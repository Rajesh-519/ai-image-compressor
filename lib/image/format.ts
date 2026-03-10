import { slugifyFilename } from "@/utils/format";

import type { SupportedFormat } from "@/lib/image/types";

export const mimeTypeByFormat: Record<SupportedFormat, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  jxl: "image/jxl",
  heic: "image/heic"
};

export function normalizeFormat(value: string): SupportedFormat | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === "jpeg" || normalized === "jpg") {
    return normalized as SupportedFormat;
  }

  if (
    normalized === "png" ||
    normalized === "webp" ||
    normalized === "avif" ||
    normalized === "jxl" ||
    normalized === "heic"
  ) {
    return normalized;
  }

  return null;
}

export function detectFormatFromInput(fileName: string, mimeType?: string | null): SupportedFormat | null {
  if (mimeType) {
    const mimeLookup = Object.entries(mimeTypeByFormat).find(([, value]) => value === mimeType);

    if (mimeLookup) {
      return mimeLookup[0] as SupportedFormat;
    }
  }

  const extension = fileName.split(".").pop();
  return extension ? normalizeFormat(extension) : null;
}

export function toPrismaImageFormat(format: SupportedFormat) {
  if (format === "jpg") {
    return "JPEG" as const;
  }

  return format.toUpperCase() as "JPEG" | "PNG" | "WEBP" | "AVIF" | "JXL" | "HEIC";
}

export function buildOutputFilename(inputName: string, format: SupportedFormat) {
  const base = slugifyFilename(inputName) || "compressed-image";
  const extension = format === "jpeg" ? "jpg" : format;
  return `${base}.${extension}`;
}
