import * as cheerio from "cheerio";

type AuditedImage = {
  src: string;
  width?: number;
  height?: number;
  contentType?: string | null;
  bytes?: number | null;
  suggestions: string[];
  estimatedSavingsPercent: number;
};

async function inspectImage(src: string) {
  try {
    const response = await fetch(src, {
      method: "HEAD",
      headers: {
        "user-agent": "CompressAI-Pro-Audit/1.0"
      },
      cache: "no-store"
    });

    return {
      contentType: response.headers.get("content-type"),
      bytes: Number(response.headers.get("content-length") ?? "0") || null
    };
  } catch {
    return {
      contentType: null,
      bytes: null
    };
  }
}

export async function scanWebsiteImages(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "CompressAI-Pro-Audit/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const images = await Promise.all(
    $("img")
      .slice(0, 25)
      .toArray()
      .map(async (element) => {
        const src = $(element).attr("src");

        if (!src) {
          return null;
        }

        const absoluteSrc = new URL(src, url).toString();
        const width = Number($(element).attr("width") ?? "0") || undefined;
        const height = Number($(element).attr("height") ?? "0") || undefined;
        const inspection = await inspectImage(absoluteSrc);
        const suggestions: string[] = [];
        let estimatedSavingsPercent = 0;

        if (inspection.contentType?.includes("png") && (inspection.bytes ?? 0) > 250_000) {
          suggestions.push("Convert heavy PNG asset to AVIF or WebP.");
          estimatedSavingsPercent += 35;
        }

        if (inspection.contentType?.includes("jpeg") && (inspection.bytes ?? 0) > 180_000) {
          suggestions.push("Switch JPEG to AVIF for better quality-per-byte.");
          estimatedSavingsPercent += 28;
        }

        if ((width ?? 0) > 1920) {
          suggestions.push("Resize source to a practical responsive maximum.");
          estimatedSavingsPercent += 14;
        }

        if (!width || !height) {
          suggestions.push("Define intrinsic width and height to reduce layout shift.");
        }

        return {
          src: absoluteSrc,
          width,
          height,
          contentType: inspection.contentType,
          bytes: inspection.bytes,
          suggestions,
          estimatedSavingsPercent
        } satisfies AuditedImage;
      })
  );

  const filteredImages = images.filter(Boolean) as AuditedImage[];

  return {
    totalImages: filteredImages.length,
    imagesWithIssues: filteredImages.filter((image) => image.suggestions.length > 0).length,
    totalPotentialSavingsPercent:
      filteredImages.length > 0
        ? filteredImages.reduce((sum, image) => sum + image.estimatedSavingsPercent, 0) /
          filteredImages.length
        : 0,
    images: filteredImages
  };
}
