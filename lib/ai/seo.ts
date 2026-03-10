import { z } from "zod";

import type { ImageAnalysis, SeoMetadata, SupportedFormat } from "@/lib/image/types";
import { getOpenAI } from "@/lib/openai";
import { slugifyFilename } from "@/utils/format";

const seoSchema = z.object({
  altText: z.string().min(12).max(140),
  title: z.string().min(3).max(80),
  caption: z.string().min(6).max(160),
  fileName: z.string().min(3).max(80)
});

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildFallbackSeo(fileName: string, analysis: ImageAnalysis, outputFormat: SupportedFormat): SeoMetadata {
  const base = titleCase(slugifyFilename(fileName).replace(/-/g, " ")) || "Optimized Image";
  const descriptor =
    analysis.intent === "photo"
      ? analysis.containsFaces
        ? "portrait photo"
        : "optimized photo"
      : analysis.intent === "document"
        ? "interface or document graphic"
        : "graphic asset";

  return {
    altText: `${base} ${descriptor} optimized for fast web delivery`,
    title: base,
    caption: `${base} exported in ${outputFormat.toUpperCase()} for faster performance.`,
    fileName: `${slugifyFilename(base)}-${outputFormat}`
  };
}

export async function generateSeoMetadata({
  fileName,
  outputFormat,
  analysis,
  mimeType,
  previewBase64
}: {
  fileName: string;
  outputFormat: SupportedFormat;
  analysis: ImageAnalysis;
  mimeType: string;
  previewBase64?: string;
}): Promise<SeoMetadata> {
  const fallback = buildFallbackSeo(fileName, analysis, outputFormat);
  const openai = getOpenAI();

  if (!openai || !previewBase64) {
    return fallback;
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Return JSON with keys altText, title, caption, fileName. Keep altText under 110 characters. fileName must be lowercase kebab-case without extension."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Image intent: ${analysis.intent}. Contains text: ${analysis.containsText}. Contains faces: ${analysis.containsFaces}. Original filename: ${fileName}. Target format: ${outputFormat}.`
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${previewBase64}`,
              detail: "auto"
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      }
    });

    if (!response.output_text) {
      return fallback;
    }

    return seoSchema.parse(JSON.parse(response.output_text));
  } catch {
    return fallback;
  }
}
