import type { DetectionHints, ProtectedRegion } from "@/lib/image/types";

let faceModelPromise: Promise<unknown> | null = null;
let textWorkerPromise: Promise<any> | null = null;

async function createCanvasFromFile(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  return { canvas, context };
}

async function getFaceModel() {
  if (!faceModelPromise) {
    faceModelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await import("@tensorflow/tfjs-backend-webgl");
      await tf.ready();
      const blazeface = await import("@tensorflow-models/blazeface");
      return blazeface.load();
    })();
  }

  return faceModelPromise as Promise<{
    estimateFaces: (
      input: HTMLCanvasElement,
      returnTensors: boolean
    ) => Promise<
      Array<{
        topLeft: [number, number];
        bottomRight: [number, number];
        probability?: [number];
      }>
    >;
  }>;
}

async function getTextWorker() {
  if (!textWorkerPromise) {
    textWorkerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      return createWorker("eng");
    })();
  }

  return textWorkerPromise;
}

function normalizeRegion(
  region: Omit<ProtectedRegion, "x" | "y" | "width" | "height"> & {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  imageWidth: number,
  imageHeight: number
): ProtectedRegion {
  return {
    ...region,
    x: Math.max(0, Math.min(1, region.x / imageWidth)),
    y: Math.max(0, Math.min(1, region.y / imageHeight)),
    width: Math.max(0, Math.min(1, region.width / imageWidth)),
    height: Math.max(0, Math.min(1, region.height / imageHeight))
  };
}

export async function detectProtectedRegions(file: File): Promise<DetectionHints> {
  const { canvas } = await createCanvasFromFile(file);
  const [faceModel, textWorker] = await Promise.all([getFaceModel(), getTextWorker()]);

  const [facePredictions, textPrediction] = await Promise.all([
    faceModel.estimateFaces(canvas, false),
    textWorker.recognize(canvas)
  ]);

  const faces = facePredictions.map((prediction) => {
    const [left, top] = prediction.topLeft;
    const [right, bottom] = prediction.bottomRight;

    return normalizeRegion(
      {
        kind: "face",
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        confidence: prediction.probability?.[0] ?? 0.92
      },
      canvas.width,
      canvas.height
    );
  });

  const textBlocks = (textPrediction.data?.words ?? [])
    .filter((word: any) => Boolean(word.text?.trim()) && (word.confidence ?? 0) >= 45 && word.bbox)
    .slice(0, 16)
    .map((word: any) =>
      normalizeRegion(
        {
          kind: "text",
          x: word.bbox!.x0,
          y: word.bbox!.y0,
          width: word.bbox!.x1 - word.bbox!.x0,
          height: word.bbox!.y1 - word.bbox!.y0,
          confidence: Math.min(1, (word.confidence ?? 0) / 100)
        },
        canvas.width,
        canvas.height
      )
    );

  return {
    model: "blazeface+tesseract",
    runtime: "browser",
    faces,
    textBlocks
  };
}
