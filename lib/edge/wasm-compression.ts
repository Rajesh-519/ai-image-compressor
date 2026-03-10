import type { CompressionExecutionMode, DetectionHints, SupportedFormat } from "@/lib/image/types";
import { buildOutputFilename, mimeTypeByFormat } from "@/lib/image/format";

type EdgeCompressionOptions = {
  file: File;
  outputFormat: SupportedFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  generateResponsive: boolean;
  detectionHints?: DetectionHints | null;
};

type EdgeCompressionPayload = {
  executionMode: CompressionExecutionMode;
  fileName: string;
  mimeType: string;
  bufferBase64: string;
  metrics: {
    originalSize: number;
    compressedSize: number;
    savings: number;
    quality: number;
    width: number;
    height: number;
  };
  analysis: {
    intent: string;
    suggestedFormat: string;
    notes: string[];
    faceCount: number;
    textBlockCount: number;
  };
  seo: {
    altText: string;
    title: string;
    caption: string;
    fileName: string;
  };
  responsiveVariants: Array<{
    width: number;
    fileName: string;
    size: number;
  }>;
  srcSet: string;
};

async function fileToCanvas(file: File, width?: number, height?: number) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;
  const scale = Math.min(
    width ? width / sourceWidth : 1,
    height ? height / sourceHeight : 1,
    1
  );

  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return { canvas, context };
}

function uint8ArrayToBase64(value: Uint8Array) {
  let result = "";

  for (let index = 0; index < value.length; index += 1) {
    result += String.fromCharCode(value[index]);
  }

  return btoa(result);
}

function supportedEdgeFormat(format: SupportedFormat) {
  return format === "avif" || format === "webp" || format === "jpeg" || format === "png";
}

async function encodeWithCodec(imageData: ImageData, format: SupportedFormat, quality: number) {
  const normalizeBinary = (value: Uint8Array | ArrayBuffer) =>
    value instanceof Uint8Array ? value : new Uint8Array(value);

  if (format === "avif") {
    const codec = (await import("@jsquash/avif")) as unknown as {
      encode: (data: ImageData, options: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
    };

    return normalizeBinary(
      await codec.encode(imageData, {
      quality,
      speed: quality > 82 ? 6 : 8
      })
    );
  }

  if (format === "webp") {
    const codec = (await import("@jsquash/webp")) as unknown as {
      encode: (data: ImageData, options: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
    };

    return normalizeBinary(await codec.encode(imageData, { quality }));
  }

  if (format === "jpeg") {
    const codec = (await import("@jsquash/jpeg")) as unknown as {
      encode: (data: ImageData, options: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
    };

    return normalizeBinary(await codec.encode(imageData, { quality }));
  }

  const codec = (await import("@jsquash/png")) as unknown as {
    encode: (data: ImageData, options?: Record<string, unknown>) => Promise<Uint8Array | ArrayBuffer>;
  };

  return normalizeBinary(
    await codec.encode(imageData, {
      level: quality < 70 ? 3 : 2
    })
  );
}

function buildNotes(detectionHints?: DetectionHints | null) {
  const notes = ["Compressed in-browser using WebAssembly codecs for low-latency delivery."];

  if (detectionHints?.faces.length) {
    notes.push(`Preserved ${detectionHints.faces.length} detected face region(s) with a higher quality floor.`);
  }

  if (detectionHints?.textBlocks.length) {
    notes.push(`Preserved ${detectionHints.textBlocks.length} text region(s) to avoid glyph breakup.`);
  }

  return notes;
}

export async function compressOnEdge({
  file,
  outputFormat,
  quality,
  maxWidth,
  maxHeight,
  generateResponsive,
  detectionHints
}: EdgeCompressionOptions): Promise<EdgeCompressionPayload> {
  if (!supportedEdgeFormat(outputFormat)) {
    throw new Error(`${outputFormat.toUpperCase()} is not available in edge WebAssembly mode.`);
  }

  const protectedQualityFloor = detectionHints?.textBlocks.length ? 78 : detectionHints?.faces.length ? 72 : 0;
  const effectiveQuality = Math.max(quality, protectedQualityFloor);
  const { canvas, context } = await fileToCanvas(file, maxWidth, maxHeight);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const encoded = await encodeWithCodec(imageData, outputFormat, effectiveQuality);
  const mimeType = mimeTypeByFormat[outputFormat];
  const responsiveVariants: Array<{ width: number; fileName: string; size: number }> = [];

  if (generateResponsive) {
    for (const width of [1920, 1280, 768, 480]) {
      if (width >= canvas.width) {
        continue;
      }

      const resized = await fileToCanvas(file, width);
      const variantData = resized.context.getImageData(0, 0, resized.canvas.width, resized.canvas.height);
      const variantEncoded = await encodeWithCodec(variantData, outputFormat, effectiveQuality);

      responsiveVariants.push({
        width,
        fileName: buildOutputFilename(file.name.replace(/\.[^/.]+$/, `-${width}`), outputFormat),
        size: variantEncoded.byteLength
      });
    }
  }

  const optimizedFileName = buildOutputFilename(file.name, outputFormat);
  const savings = Math.max(0, ((file.size - encoded.byteLength) / file.size) * 100);
  const seoBase = optimizedFileName.replace(/\.[^/.]+$/, "").replace(/-/g, " ");

  return {
    executionMode: "edge",
    fileName: optimizedFileName,
    mimeType,
    bufferBase64: uint8ArrayToBase64(encoded),
    metrics: {
      originalSize: file.size,
      compressedSize: encoded.byteLength,
      savings,
      quality: effectiveQuality,
      width: canvas.width,
      height: canvas.height
    },
    analysis: {
      intent: detectionHints?.textBlocks.length ? "document" : detectionHints?.faces.length ? "photo" : "graphic",
      suggestedFormat: outputFormat,
      notes: buildNotes(detectionHints),
      faceCount: detectionHints?.faces.length ?? 0,
      textBlockCount: detectionHints?.textBlocks.length ?? 0
    },
    seo: {
      altText: `${seoBase} optimized image`,
      title: seoBase,
      caption: `${seoBase} compressed on the edge with ${outputFormat.toUpperCase()}.`,
      fileName: optimizedFileName.replace(/\.[^/.]+$/, "")
    },
    responsiveVariants,
    srcSet: responsiveVariants.map((variant) => `${variant.fileName} ${variant.width}w`).join(", ")
  };
}
