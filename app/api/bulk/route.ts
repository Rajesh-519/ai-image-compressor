import JSZip from "jszip";
import { NextResponse } from "next/server";

import { getRequestIdentity } from "@/lib/api-auth";
import { detectFormatFromInput, toPrismaImageFormat } from "@/lib/image/format";
import { optimizeImage } from "@/lib/image/optimizer";
import type { SupportedFormat } from "@/lib/image/types";
import { PLAN_CONFIG } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { recordUsage } from "@/lib/usage";
import { compressionRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";

type BatchFile = {
  name: string;
  buffer: Buffer;
  format: SupportedFormat;
};

function modeToPrisma(mode: "max" | "balanced" | "quality" | "custom") {
  if (mode === "max") {
    return "MAX" as const;
  }

  if (mode === "quality") {
    return "QUALITY" as const;
  }

  if (mode === "custom") {
    return "CUSTOM" as const;
  }

  return "BALANCED" as const;
}

async function extractBatchFiles(formData: FormData) {
  const entries = Array.from(formData.values()).filter((value): value is File => value instanceof File);
  const files: BatchFile[] = [];

  for (const file of entries) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const archive = await JSZip.loadAsync(await file.arrayBuffer());

      for (const [name, entry] of Object.entries(archive.files)) {
        if (entry.dir) {
          continue;
        }

        const format = detectFormatFromInput(name);

        if (!format) {
          continue;
        }

        files.push({
          name,
          buffer: Buffer.from(await entry.async("nodebuffer")),
          format
        });
      }

      continue;
    }

    const format = detectFormatFromInput(file.name, file.type);

    if (!format) {
      continue;
    }

    files.push({
      name: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
      format
    });
  }

  return files;
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);

  if (!identity) {
    return NextResponse.json({ error: "Bulk compression requires authentication." }, { status: 401 });
  }

  if (!PLAN_CONFIG[identity.plan].bulkEnabled) {
    return NextResponse.json({ error: "Bulk compression is not available on the current plan." }, { status: 403 });
  }

  const formData = await request.formData();
  const parsed = compressionRequestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const batchFiles = await extractBatchFiles(formData);

  if (batchFiles.length === 0) {
    return NextResponse.json({ error: "No supported image files were provided." }, { status: 400 });
  }

  const job = await prisma.compressionJob.create({
    data: {
      userId: identity.userId,
      apiKeyId: identity.apiKeyId,
      status: "PROCESSING",
      jobType: "BULK",
      requestedFormat:
        parsed.data.outputFormat === "auto" ? undefined : toPrismaImageFormat(parsed.data.outputFormat),
      mode: modeToPrisma(parsed.data.mode),
      quality: parsed.data.quality,
      contentAware: parsed.data.contentAware,
      bulkCount: batchFiles.length
    }
  });

  try {
    const archive = new JSZip();
    let totalBytesSaved = 0;

    for (const batchFile of batchFiles) {
      const result = await optimizeImage({
        buffer: batchFile.buffer,
        fileName: batchFile.name,
        inputFormat: batchFile.format,
        outputFormat: parsed.data.outputFormat,
        quality: parsed.data.quality,
        mode: parsed.data.mode,
        maxWidth: parsed.data.maxWidth,
        maxHeight: parsed.data.maxHeight,
        contentAware: parsed.data.contentAware,
        generateResponsive: parsed.data.generateResponsive,
        preserveMetadata: parsed.data.preserveMetadata,
        executionMode: parsed.data.executionMode
      });

      archive.file(result.fileName, result.buffer);
      totalBytesSaved += result.originalSize - result.compressedSize;

      await prisma.image.create({
        data: {
          userId: identity.userId,
          jobId: job.id,
          originalName: batchFile.name,
          sourceType: identity.source === "api_key" ? "API" : "UPLOAD",
          inputFormat: toPrismaImageFormat(batchFile.format),
          outputFormat: toPrismaImageFormat(result.outputFormat),
          width: result.width,
          height: result.height,
          originalBytes: result.originalSize,
          compressedBytes: result.compressedSize,
          compressionRatio: result.savings,
          altText: result.seo.altText,
          title: result.seo.title,
          caption: result.seo.caption,
          seoFilename: result.seo.fileName
        }
      });
    }

    const zipBuffer = await archive.generateAsync({ type: "nodebuffer" });

    await prisma.compressionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        report: {
          processedFiles: batchFiles.length,
          bytesSaved: totalBytesSaved
        }
      }
    });

    await recordUsage({
      userId: identity.userId,
      apiKeyId: identity.apiKeyId,
      imagesProcessed: batchFiles.length,
      bytesSaved: totalBytesSaved,
      apiCalls: identity.source === "api_key" ? 1 : 0
    });

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="compressai-batch.zip"'
      }
    });
  } catch (error) {
    await prisma.compressionJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Bulk compression failed."
      }
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk compression failed." },
      { status: 500 }
    );
  }
}
