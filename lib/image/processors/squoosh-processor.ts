import os from "os";

import type { SupportedFormat } from "@/lib/image/types";

type SquooshProcessorOptions = {
  buffer: Buffer;
  outputFormat: SupportedFormat;
  quality: number;
  resize?: {
    width?: number;
    height?: number;
  };
};

export async function processWithSquoosh({
  buffer,
  outputFormat,
  quality,
  resize
}: SquooshProcessorOptions) {
  const { ImagePool } = await import("@squoosh/lib");
  const imagePool = new ImagePool(Math.max(1, Math.min(os.cpus().length, 4)));
  const image = imagePool.ingestImage(buffer);

  try {
    await image.decoded;

    if (resize?.width || resize?.height) {
      await image.preprocess({
        resize: {
          width: resize.width ?? 0,
          height: resize.height ?? 0
        }
      });
    }

    const encoder =
      outputFormat === "jpeg" || outputFormat === "jpg"
        ? "mozjpeg"
        : outputFormat === "png"
          ? "oxipng"
          : outputFormat;

    const options =
      encoder === "mozjpeg"
        ? { mozjpeg: { quality } }
        : encoder === "oxipng"
          ? { oxipng: { level: quality < 65 ? 3 : 2 } }
          : encoder === "jxl"
            ? { jxl: { quality, effort: 7 } }
            : encoder === "avif"
              ? { avif: { cqLevel: Math.max(0, Math.round((100 - quality) * 0.7)) } }
              : { webp: { quality } };

    await image.encode(options);
    const key = Object.keys(options)[0] as keyof typeof image.encodedWith;
    const encoded = await image.encodedWith[key];

    if (!encoded) {
      throw new Error(`Squoosh failed to encode ${outputFormat}.`);
    }

    return Buffer.from(encoded.binary);
  } finally {
    await imagePool.close();
  }
}
