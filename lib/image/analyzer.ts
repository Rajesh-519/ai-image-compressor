import sharp from "sharp";

import type { ImageAnalysis, OptimizeImageInput } from "@/lib/image/types";

export async function analyzeImage({
  buffer,
  fileName,
  inputFormat,
  mode,
  maxWidth,
  detectionHints
}: Pick<
  OptimizeImageInput,
  "buffer" | "fileName" | "inputFormat" | "mode" | "maxWidth" | "detectionHints"
>): Promise<ImageAnalysis> {
  const [metadata, stats] = await Promise.all([sharp(buffer).metadata(), sharp(buffer).stats()]);
  const entropy =
    stats.channels.reduce((sum, channel) => sum + channel.stdev, 0) / Math.max(1, stats.channels.length);

  const lowerName = fileName.toLowerCase();
  const faceRegions = detectionHints?.faces ?? [];
  const textRegions = detectionHints?.textBlocks ?? [];
  const containsText =
    textRegions.length > 0 ||
    /screenshot|banner|ui|slide|invoice|receipt|document|text|thumbnail/.test(lowerName) ||
    entropy < 24;
  const containsFaces =
    faceRegions.length > 0 || /avatar|profile|portrait|face|model|person|team|headshot/.test(lowerName);
  const hasTransparency = Boolean(metadata.hasAlpha);
  const width = metadata.width ?? 1;
  const height = metadata.height ?? 1;
  const protectedRegions = [...faceRegions, ...textRegions];
  const protectedCoverage = Math.min(
    1,
    protectedRegions.reduce((sum, region) => sum + region.width * region.height, 0) / (width * height)
  );

  let intent: ImageAnalysis["intent"] = "photo";

  if (containsText) {
    intent = "document";
  } else if (hasTransparency || entropy < 34) {
    intent = "graphic";
  }

  const notes: string[] = [];

  if (containsText) {
    notes.push(
      textRegions.length > 0
        ? `Detected ${textRegions.length} text block(s); preserve crisp edges and chroma detail.`
        : "Detected document or UI-like content; preserve crisp edges."
    );
  }

  if (containsFaces) {
    notes.push(
      faceRegions.length > 0
        ? `Detected ${faceRegions.length} face region(s); preserve skin texture and avoid heavy quantization.`
        : "Filename hints at portrait content; bias quality upward."
    );
  }

  if (hasTransparency) {
    notes.push("Transparency detected; prefer alpha-safe formats.");
  }

  let suggestedFormat: ImageAnalysis["suggestedFormat"] = "avif";

  if (hasTransparency && intent === "graphic") {
    suggestedFormat = "webp";
  } else if (containsText) {
    suggestedFormat = hasTransparency ? "png" : "webp";
  } else if (inputFormat === "jxl") {
    suggestedFormat = "jxl";
  }

  const baseQuality = mode === "max" ? 58 : mode === "quality" ? 86 : 74;
  const suggestedQuality = Math.min(
    96,
    baseQuality + (containsText ? 12 : 0) + (containsFaces ? 8 : 0) + Math.round(protectedCoverage * 10)
  );

  const originalWidth = metadata.width;
  const protectedWidthFloor = containsText ? 1280 : containsFaces ? 1440 : undefined;
  const recommendedWidth =
    maxWidth ??
    (originalWidth && originalWidth > 1920
      ? Math.max(1920, protectedWidthFloor ?? 0)
      : originalWidth && originalWidth > 1280
        ? Math.max(1280, protectedWidthFloor ?? 0)
        : protectedWidthFloor && originalWidth && originalWidth > protectedWidthFloor
          ? protectedWidthFloor
          : undefined);

  if (recommendedWidth && originalWidth && recommendedWidth < originalWidth) {
    notes.push(`Resize recommended from ${originalWidth}px to ${recommendedWidth}px for web delivery.`);
  }

  return {
    width: metadata.width,
    height: metadata.height,
    hasTransparency,
    containsText,
    containsFaces,
    intent,
    entropy,
    faceCount: faceRegions.length,
    textBlockCount: textRegions.length,
    protectedCoverage,
    protectedRegions,
    suggestedFormat,
    suggestedQuality,
    recommendedWidth: recommendedWidth
      ? Math.min(recommendedWidth, originalWidth ?? recommendedWidth)
      : undefined,
    notes
  };
}
