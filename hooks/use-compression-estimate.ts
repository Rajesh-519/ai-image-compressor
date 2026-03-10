"use client";

import { useMemo } from "react";

export type EstimateMode = "max" | "balanced" | "quality" | "custom";

type EstimateOptions = {
  originalSize: number;
  quality: number;
  format: string;
  mode: EstimateMode;
};

const formatAdjustments: Record<string, number> = {
  avif: 0.42,
  webp: 0.58,
  jxl: 0.48,
  jpeg: 0.67,
  jpg: 0.67,
  png: 0.86
};

const modeAdjustments: Record<EstimateMode, number> = {
  max: 0.62,
  balanced: 0.78,
  quality: 0.95,
  custom: 0.82
};

export function getCompressionEstimate({
  originalSize,
  quality,
  format,
  mode
}: EstimateOptions) {
  const normalizedFormat = format.toLowerCase();
  const formatFactor = formatAdjustments[normalizedFormat] ?? 0.74;
  const modeFactor = modeAdjustments[mode];
  const qualityFactor = Math.max(0.28, Math.min(1.2, quality / 100));
  const estimatedSize = Math.max(
    12_000,
    Math.round(originalSize * formatFactor * modeFactor * qualityFactor)
  );

  return {
    estimatedSize,
    savings: Math.max(0, ((originalSize - estimatedSize) / originalSize) * 100)
  };
}

export function useCompressionEstimate({
  originalSize,
  quality,
  format,
  mode
}: EstimateOptions) {
  return useMemo(
    () =>
      getCompressionEstimate({
        originalSize,
        quality,
        format,
        mode
      }),
    [format, mode, originalSize, quality]
  );
}
