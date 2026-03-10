"use client";

import {
  Cpu,
  FileScan,
  Link2,
  Loader2,
  ScanFace,
  ShieldCheck,
  Sparkles,
  UploadCloud
} from "lucide-react";
import { motion } from "framer-motion";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from "react";

import type { DetectionHints, SupportedFormat } from "@/lib/image/types";

import { compressOnEdge } from "@/lib/edge/wasm-compression";
import { detectProtectedRegions } from "@/lib/edge/vision";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useCompressionEstimate } from "@/hooks/use-compression-estimate";
import { formatBytes, formatPercent } from "@/utils/format";

type CompressionResult = {
  executionMode: "server" | "edge";
  fileName: string;
  mimeType: string;
  bufferBase64: string;
  metrics: {
    originalSize: number;
    compressedSize: number;
    savings: number;
    quality: number;
    width?: number;
    height?: number;
  };
  analysis: {
    intent: string;
    suggestedFormat: string;
    notes: string[];
    faceCount?: number;
    textBlockCount?: number;
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

type CompressorWorkbenchProps = {
  title?: string;
  description?: string;
};

function resolveEdgeFormat(outputFormat: string, hints: DetectionHints | null, file: File | null): SupportedFormat {
  if (outputFormat !== "auto") {
    return outputFormat as SupportedFormat;
  }

  if (hints?.textBlocks.length) {
    return "webp";
  }

  if (file?.type.includes("png")) {
    return "webp";
  }

  return "avif";
}

export function CompressorWorkbench({
  title = "Compression tuned for product screenshots, editorial images, and ecommerce catalogs",
  description = "Choose between server-side AI preservation and browser-side WebAssembly compression. Faces and text blocks are detected before encoding so the quality floor stays where it matters."
}: CompressorWorkbenchProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState("auto");
  const [executionMode, setExecutionMode] = useState<"server" | "edge">("server");
  const [mode, setMode] = useState<"max" | "balanced" | "quality" | "custom">("balanced");
  const [quality, setQuality] = useState(78);
  const [contentAware, setContentAware] = useState(true);
  const [generateResponsive, setGenerateResponsive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visionStatus, setVisionStatus] = useState<"idle" | "analyzing" | "ready" | "error">("idle");
  const [visionError, setVisionError] = useState<string | null>(null);
  const [detectionHints, setDetectionHints] = useState<DetectionHints | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedFile]);

  useEffect(() => {
    let cancelled = false;

    async function runVision() {
      if (!selectedFile || !contentAware) {
        startTransition(() => {
          setVisionStatus("idle");
          setVisionError(null);
          setDetectionHints(null);
        });
        return;
      }

      startTransition(() => {
        setVisionStatus("analyzing");
        setVisionError(null);
      });

      try {
        const hints = await detectProtectedRegions(selectedFile);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setDetectionHints(hints);
          setVisionStatus("ready");
        });
      } catch (visionFailure) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setVisionStatus("error");
          setVisionError(
            visionFailure instanceof Error ? visionFailure.message : "Protected-region detection failed."
          );
          setDetectionHints(null);
        });
      }
    }

    void runVision();

    return () => {
      cancelled = true;
    };
  }, [contentAware, selectedFile]);

  const originalSize = selectedFile?.size ?? 2_400_000;
  const estimate = useCompressionEstimate({
    originalSize,
    quality,
    format: outputFormat === "auto" ? "avif" : outputFormat,
    mode
  });
  const deferredResult = useDeferredValue(result);

  const resultPreviewUrl = useMemo(() => {
    if (!deferredResult) {
      return null;
    }

    return `data:${deferredResult.mimeType};base64,${deferredResult.bufferBase64}`;
  }, [deferredResult]);

  const faceCount = detectionHints?.faces.length ?? 0;
  const textCount = detectionHints?.textBlocks.length ?? 0;

  function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    startTransition(() => {
      setSelectedFile(file);
      setResult(null);
      setError(null);
      setVisionError(null);
    });
  }

  async function handleSubmit() {
    if (!selectedFile && !sourceUrl.trim()) {
      setError("Provide a local image, paste one, or enter a URL.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (executionMode === "edge" && selectedFile && !sourceUrl.trim()) {
        const edgeResult = await compressOnEdge({
          file: selectedFile,
          outputFormat: resolveEdgeFormat(outputFormat, detectionHints, selectedFile),
          quality,
          generateResponsive,
          detectionHints
        });

        startTransition(() => setResult(edgeResult));
        return;
      }

      const formData = new FormData();

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (sourceUrl.trim()) {
        formData.append("sourceUrl", sourceUrl.trim());
      }

      if (detectionHints) {
        formData.append("detectionHints", JSON.stringify(detectionHints));
      }

      formData.append("outputFormat", outputFormat);
      formData.append("executionMode", executionMode);
      formData.append("mode", mode);
      formData.append("quality", String(quality));
      formData.append("contentAware", String(contentAware));
      formData.append("generateResponsive", String(generateResponsive));
      formData.append("responseType", "json");

      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as CompressionResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Compression failed.");
      }

      startTransition(() => setResult(payload));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Compression failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDownload() {
    if (!result) {
      return;
    }

    const link = document.createElement("a");
    link.href = `data:${result.mimeType};base64,${result.bufferBase64}`;
    link.download = result.fileName;
    link.click();
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="hero-shell overflow-hidden">
        <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-7 border-b border-white/10 p-7 lg:border-b-0 lg:border-r lg:p-8">
            <div className="space-y-4">
              <Badge>Compression Lab</Badge>
              <div className="space-y-3">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-white">
                  {title}
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setExecutionMode("server")}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  executionMode === "server"
                    ? "border-primary/40 bg-primary/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Server AI
                </span>
              </button>
              <button
                type="button"
                onClick={() => setExecutionMode("edge")}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  executionMode === "edge"
                    ? "border-primary/40 bg-primary/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Edge WASM
                </span>
              </button>
            </div>

            <motion.div
              layout
              className="grid gap-4 rounded-[28px] border border-dashed border-white/15 bg-black/20 p-6"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files.item(0));
              }}
              onPaste={(event) => {
                const item = Array.from(event.clipboardData.items).find((entry) =>
                  entry.type.startsWith("image/")
                );
                handleFile(item?.getAsFile() ?? null);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <UploadCloud className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-white">Drop an asset, paste from clipboard, or fetch from URL</p>
                  <p className="text-sm text-muted-foreground">
                    Use server AI for the most compatible pipeline or edge mode for low-latency in-browser encoding.
                  </p>
                </div>
              </div>

              <input
                type="file"
                accept="image/*,.avif,.webp,.jxl,.heic"
                onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />

              <div className="flex items-center gap-3">
                <Link2 className="h-4 w-4 text-primary" />
                <Input
                  placeholder="Remote URL: https://example.com/hero-image.jpg"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                />
              </div>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-muted-foreground">
                Output format
                <select
                  value={outputFormat}
                  onChange={(event) => setOutputFormat(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                >
                  <option value="auto">Auto recommend</option>
                  <option value="avif">AVIF</option>
                  <option value="webp">WebP</option>
                  <option value="jxl">JPEG XL</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="heic">HEIC</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-muted-foreground">
                Compression mode
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as "max" | "balanced" | "quality" | "custom")
                  }
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                >
                  <option value="max">Maximum compression</option>
                  <option value="balanced">Balanced</option>
                  <option value="quality">High quality</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Quality target</span>
                <span>{quality}</span>
              </div>
              <input
                type="range"
                min={35}
                max={95}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
              />
              <Progress value={(quality / 95) * 100} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white">
                <span>Protected-region AI</span>
                <input
                  type="checkbox"
                  checked={contentAware}
                  onChange={(event) => setContentAware(event.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white">
                <span>Generate responsive variants</span>
                <input
                  type="checkbox"
                  checked={generateResponsive}
                  onChange={(event) => setGenerateResponsive(event.target.checked)}
                />
              </label>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {executionMode === "edge" ? "Run edge compression" : "Run server compression"}
              </Button>
              {result ? (
                <Button variant="outline" onClick={handleDownload}>
                  Download result
                </Button>
              ) : null}
            </div>
          </div>

          <div className="dotted-noise space-y-5 p-7 lg:p-8">
            <div className="rounded-[24px] border border-white/10 bg-black/30 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-primary">Execution path</p>
                <Badge>{executionMode === "edge" ? "Browser WASM" : "Server AI"}</Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">
                {executionMode === "edge" ? "Low-latency local encode" : "Deep compatibility pipeline"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {executionMode === "edge"
                  ? "Uses WebAssembly codecs directly in the browser for fast AVIF, WebP, JPEG, and PNG output."
                  : "Uses Sharp and codec fallbacks on the server, with preservation hints from face and text detection."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Predicted output</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatBytes(estimate.estimatedSize)}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Predicted savings</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatPercent(estimate.savings)}</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <ScanFace className="h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Protected subjects</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-muted-foreground">Faces</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{faceCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-muted-foreground">Text blocks</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{textCount}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
                {visionStatus === "idle" && "Select an image to run face and text protection analysis."}
                {visionStatus === "analyzing" && "Running browser-side face and OCR detection."}
                {visionStatus === "ready" &&
                  `Vision model ready: ${faceCount} face region(s), ${textCount} text region(s).`}
                {visionStatus === "error" && (visionError ?? "Vision pipeline failed.")}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Preservation policy</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Detected text keeps a higher quality floor and sharper chroma treatment.</li>
                <li>Detected faces bias quality upward and reduce aggressive quantization.</li>
                <li>Server mode can fall back to broader codec support when edge mode is not suitable.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="space-y-5 p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary">Output review</p>
              <CardTitle className="mt-2">Before and after</CardTitle>
            </div>
            <Badge>{deferredResult ? deferredResult.executionMode.toUpperCase() : "READY"}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Original asset</p>
              <div className="grid-overlay flex aspect-square items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                {previewUrl || sourceUrl ? (
                  <img
                    src={previewUrl ?? sourceUrl}
                    alt="Original preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="max-w-[14rem] text-center text-sm text-muted-foreground">
                    Upload or paste an image to populate the source preview.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Compressed asset</p>
              <div className="grid-overlay flex aspect-square items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                {resultPreviewUrl ? (
                  <img
                    src={resultPreviewUrl}
                    alt="Compressed preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <p className="max-w-[14rem] text-center text-sm text-muted-foreground">
                    Run the pipeline to preview the encoded output.
                  </p>
                )}
              </div>
            </div>
          </div>

          {deferredResult ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Original</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatBytes(deferredResult.metrics.originalSize)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Compressed</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatBytes(deferredResult.metrics.compressedSize)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Reduction</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {formatPercent(deferredResult.metrics.savings)}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2">
                  <FileScan className="h-4 w-4 text-primary" />
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Analysis summary</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{deferredResult.analysis.intent}</Badge>
                  <Badge>{deferredResult.analysis.suggestedFormat}</Badge>
                  <Badge>{deferredResult.analysis.faceCount ?? faceCount} face(s)</Badge>
                  <Badge>{deferredResult.analysis.textBlockCount ?? textCount} text block(s)</Badge>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {deferredResult.analysis.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Generated SEO metadata</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="text-white">Alt text:</span> {deferredResult.seo.altText}
                  </p>
                  <p>
                    <span className="text-white">Title:</span> {deferredResult.seo.title}
                  </p>
                  <p>
                    <span className="text-white">Caption:</span> {deferredResult.seo.caption}
                  </p>
                  <p>
                    <span className="text-white">Filename:</span> {deferredResult.seo.fileName}
                  </p>
                </div>
              </div>

              {deferredResult.responsiveVariants.length > 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Responsive variants</p>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {deferredResult.responsiveVariants.map((variant) => (
                      <p key={variant.fileName}>
                        {variant.fileName} ({variant.width}px, {formatBytes(variant.size)})
                      </p>
                    ))}
                  </div>
                  <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-muted-foreground">
                    {deferredResult.srcSet || "No srcset generated."}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
