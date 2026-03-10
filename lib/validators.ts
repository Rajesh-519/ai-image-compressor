import { z } from "zod";

const booleanish = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
}, z.boolean().optional());

export const compressionRequestSchema = z.object({
  outputFormat: z
    .enum(["auto", "jpeg", "jpg", "png", "webp", "avif", "jxl", "heic"])
    .default("auto"),
  quality: z.coerce.number().min(10).max(100).default(78),
  mode: z.enum(["max", "balanced", "quality", "custom"]).default("balanced"),
  maxWidth: z.coerce.number().int().min(320).max(8192).optional(),
  maxHeight: z.coerce.number().int().min(320).max(8192).optional(),
  contentAware: booleanish.default(true),
  generateResponsive: booleanish.default(false),
  preserveMetadata: booleanish.default(false),
  sourceUrl: z.string().url().optional(),
  executionMode: z.enum(["server", "edge"]).default("server"),
  detectionHints: z.string().optional()
});

export const auditRequestSchema = z.object({
  url: z.string().url()
});
