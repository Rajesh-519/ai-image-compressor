import sharp from "sharp";

import { generateSeoMetadata } from "@/lib/ai/seo";
import { analyzeImage } from "@/lib/image/analyzer";
import { buildOutputFilename, mimeTypeByFormat } from "@/lib/image/format";
import { processWithSharp } from "@/lib/image/processors/sharp-processor";
import { processWithSquoosh } from "@/lib/image/processors/squoosh-processor";
import type {
  CompressionMode,
  OptimizeImageInput,
  OptimizeImageResult,
  SupportedFormat
} from "@/lib/image/types";

function resolveModeQuality(mode: CompressionMode, customQuality: number) {
  if (mode === "max") {
    return 58;
  }

  if (mode === "quality") {
    return 88;
  }

  if (mode === "custom") {
    return customQuality;
  }

  return 74;
}

function shouldUseSquoosh(format: SupportedFormat) {
  return format === "jxl";
}

async function renderVariant({
  buffer,
  format,
  width,
  quality
}: {
  buffer: Buffer;
  format: SupportedFormat;
  width: number;
  quality: number;
}) {
  if (shouldUseSquoosh(format)) {
    return processWithSquoosh({
      buffer,
      outputFormat: format,
      quality,
      resize: {
        width
      }
    });
  }

  return processWithSharp({
    buffer,
    outputFormat: format,
    quality,
    resize: {
      width
    },
    preserveMetadata: false,
    analysis: {
      width,
      height: undefined,
      hasTransparency: false,
      containsText: false,
      containsFaces: false,
      intent: "photo",
      entropy: 0,
      faceCount: 0,
      textBlockCount: 0,
      protectedCoverage: 0,
      protectedRegions: [],
      suggestedFormat: format,
      suggestedQuality: quality,
      notes: []
    }
  });
}

export async function optimizeImage(input: OptimizeImageInput): Promise<OptimizeImageResult> {
  const analysis = await analyzeImage(input);
  const outputFormat = input.outputFormat === "auto" ? analysis.suggestedFormat : input.outputFormat;
  const targetQuality = Math.min(
    96,
    Math.max(
      28,
      input.contentAware
        ? Math.round((resolveModeQuality(input.mode, input.quality) + analysis.suggestedQuality) / 2)
        : resolveModeQuality(input.mode, input.quality)
    )
  );
  const protectedQualityFloor = analysis.containsText ? 76 : analysis.containsFaces ? 72 : 0;
  const resize = {
    width: input.maxWidth ?? analysis.recommendedWidth,
    height: input.maxHeight
  };
  const effectiveQuality = Math.max(targetQuality, protectedQualityFloor);

  const buffer = shouldUseSquoosh(outputFormat)
    ? await processWithSquoosh({
        buffer: input.buffer,
        outputFormat,
        quality: effectiveQuality,
        resize
      })
    : await processWithSharp({
        buffer: input.buffer,
        outputFormat,
        quality: effectiveQuality,
        resize,
        preserveMetadata: input.preserveMetadata,
        analysis
      });

  const outputMetadata = await sharp(buffer).metadata();
  const mimeType = mimeTypeByFormat[outputFormat];
  const preview = await sharp(buffer)
    .resize({ width: 768, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  const seo = await generateSeoMetadata({
    fileName: input.fileName,
    outputFormat,
    analysis,
    mimeType,
    previewBase64: preview.toString("base64")
  });

  const responsiveVariants = input.generateResponsive
    ? await Promise.all(
        [1920, 1280, 768, 480]
          .filter((width) => width < (outputMetadata.width ?? width + 1))
          .map(async (width) => {
            const variantBuffer = await renderVariant({
              buffer: input.buffer,
              format: outputFormat,
              width,
              quality: effectiveQuality
            });

            return {
              width,
              fileName: buildOutputFilename(
                input.fileName.replace(/\.[^/.]+$/, `-${width}`),
                outputFormat
              ),
              mimeType,
              size: variantBuffer.byteLength
            };
          })
      )
    : [];

  return {
    buffer,
    outputFormat,
    mimeType,
    fileName: buildOutputFilename(input.fileName, outputFormat),
    originalSize: input.buffer.byteLength,
    compressedSize: buffer.byteLength,
    savings: Math.max(0, ((input.buffer.byteLength - buffer.byteLength) / input.buffer.byteLength) * 100),
    quality: effectiveQuality,
    width: outputMetadata.width,
    height: outputMetadata.height,
    executionMode: input.executionMode ?? "server",
    analysis,
    responsiveVariants,
    seo
  };
}
