import { NextResponse } from "next/server";

import { getRequestIdentity } from "@/lib/api-auth";
import { env } from "@/lib/env";
import { detectFormatFromInput, toPrismaImageFormat } from "@/lib/image/format";
import { optimizeImage } from "@/lib/image/optimizer";
import { prisma } from "@/lib/prisma";
import { enforceUsageLimit, recordUsage } from "@/lib/usage";
import { compressionRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";

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

async function resolveInputFile(file: FormDataEntryValue | null, sourceUrl?: string) {
  if (file instanceof File) {
    return file;
  }

  if (!sourceUrl) {
    return null;
  }

  const response = await fetch(sourceUrl, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch remote image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const urlPath = new URL(sourceUrl).pathname.split("/").pop() || "remote-image";
  const buffer = await response.arrayBuffer();

  return new File([buffer], urlPath, {
    type: contentType
  });
}

function parseDetectionHints(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);
  const formData = await request.formData();
  const parsed = compressionRequestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.outputFormat === "auto") {
    return NextResponse.json({ error: "Conversion requires an explicit output format." }, { status: 400 });
  }

  const file = await resolveInputFile(formData.get("file"), parsed.data.sourceUrl);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Expected a file upload or source URL." }, { status: 400 });
  }

  if (file.size > env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File exceeds ${env.UPLOAD_MAX_FILE_SIZE_MB}MB upload limit.` },
      { status: 413 }
    );
  }

  const inputFormat = detectFormatFromInput(file.name, file.type);

  if (!inputFormat) {
    return NextResponse.json({ error: "Unsupported image format." }, { status: 415 });
  }

  if (identity) {
    await enforceUsageLimit(identity.userId, identity.plan);
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const detectionHints = parseDetectionHints(formData.get("detectionHints"));

  const job = identity
    ? await prisma.compressionJob.create({
        data: {
          userId: identity.userId,
          apiKeyId: identity.apiKeyId,
          status: "PROCESSING",
          jobType: "CONVERT",
          requestedFormat: toPrismaImageFormat(parsed.data.outputFormat),
          mode: modeToPrisma(parsed.data.mode),
          quality: parsed.data.quality,
          contentAware: parsed.data.contentAware,
          bulkCount: 1
        }
      })
    : null;

  try {
    const result = await optimizeImage({
      buffer: inputBuffer,
      fileName: file.name,
      inputFormat,
      outputFormat: parsed.data.outputFormat,
      quality: parsed.data.quality,
      mode: parsed.data.mode,
      maxWidth: parsed.data.maxWidth,
      maxHeight: parsed.data.maxHeight,
      contentAware: parsed.data.contentAware,
      generateResponsive: parsed.data.generateResponsive,
      preserveMetadata: parsed.data.preserveMetadata,
      executionMode: parsed.data.executionMode,
      detectionHints
    });

    if (identity && job) {
      await prisma.compressionJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          report: {
            convertedTo: result.outputFormat,
            savings: result.savings
          }
        }
      });

      await prisma.image.create({
        data: {
          userId: identity.userId,
          jobId: job.id,
          originalName: file.name,
          sourceType: identity.source === "api_key" ? "API" : "UPLOAD",
          inputFormat: toPrismaImageFormat(inputFormat),
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

      await recordUsage({
        userId: identity.userId,
        apiKeyId: identity.apiKeyId,
        imagesProcessed: 1,
        bytesSaved: result.originalSize - result.compressedSize,
        apiCalls: identity.source === "api_key" ? 1 : 0
      });
    }

    return NextResponse.json({
      executionMode: result.executionMode,
      fileName: result.fileName,
      mimeType: result.mimeType,
      bufferBase64: result.buffer.toString("base64"),
      metrics: {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savings: result.savings,
        quality: result.quality
      },
      analysis: result.analysis,
      seo: result.seo
    });
  } catch (error) {
    if (job) {
      await prisma.compressionJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Conversion failed."
        }
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversion failed." },
      { status: 500 }
    );
  }
}
