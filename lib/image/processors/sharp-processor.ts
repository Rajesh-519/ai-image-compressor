import sharp from "sharp";

import type { ImageAnalysis, SupportedFormat } from "@/lib/image/types";

type SharpProcessorOptions = {
  buffer: Buffer;
  outputFormat: SupportedFormat;
  quality: number;
  resize?: {
    width?: number;
    height?: number;
  };
  preserveMetadata: boolean;
  analysis: ImageAnalysis;
};

export async function processWithSharp({
  buffer,
  outputFormat,
  quality,
  resize,
  preserveMetadata,
  analysis
}: SharpProcessorOptions) {
  let pipeline = sharp(buffer, {
    failOn: "none"
  }).rotate();

  if (resize?.width || resize?.height) {
    pipeline = pipeline.resize({
      width: resize.width,
      height: resize.height,
      fit: "inside",
      withoutEnlargement: true
    });
  }

  if (preserveMetadata) {
    pipeline = pipeline.withMetadata();
  }

  switch (outputFormat) {
    case "jpeg":
    case "jpg":
      return pipeline
        .jpeg({
          quality,
          mozjpeg: true,
          chromaSubsampling: analysis.containsText || analysis.containsFaces ? "4:4:4" : "4:2:0"
        })
        .toBuffer();
    case "png":
      return pipeline
        .png({
          quality,
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: quality < 74
        })
        .toBuffer();
    case "webp":
      return pipeline
        .webp({
          quality,
          effort: analysis.protectedCoverage > 0.12 ? 6 : 5,
          alphaQuality: Math.min(100, quality + 6)
        })
        .toBuffer();
    case "avif":
      return pipeline
        .avif({
          quality,
          effort: analysis.protectedCoverage > 0.12 ? 7 : 6
        })
        .toBuffer();
    case "heic":
      return pipeline
        .heif({
          quality,
          compression: "hevc"
        })
        .toBuffer();
    default:
      throw new Error(`Sharp processor cannot encode ${outputFormat}.`);
  }
}
