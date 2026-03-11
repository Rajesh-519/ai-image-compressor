"use client";

import {
  Check,
  Cpu,
  Download,
  FileScan,
  Link2,
  Loader2,
  Package,
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
import {
  getCompressionEstimate,
  suggestQualityForTarget,
  useCompressionEstimate
} from "@/hooks/use-compression-estimate";
import { formatBytes, formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

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

type ExportOptionValue = "auto" | SupportedFormat;

type ExportOption = {
  value: ExportOptionValue;
  label: string;
  eyebrow: string;
  bestFor: string;
  compatibility: string;
};

const EXPORT_OPTIONS: ExportOption[] = [
  {
    value: "auto",
    label: "Smart Export",
    eyebrow: "AI recommended",
    bestFor: "Chooses the best format automatically for the asset in front of you.",
    compatibility: "Best overall"
  },
  {
    value: "avif",
    label: "AVIF",
    eyebrow: "Smallest photos",
    bestFor: "High-detail photography, product shots, and modern web delivery.",
    compatibility: "Modern browsers"
  },
  {
    value: "webp",
    label: "WebP",
    eyebrow: "Safe modern default",
    bestFor: "UI captures, mixed content, logos, and strong browser support.",
    compatibility: "Broad support"
  },
  {
    value: "jpeg",
    label: "JPEG",
    eyebrow: "Legacy compatible",
    bestFor: "Maximum compatibility when transparency is not needed.",
    compatibility: "Universal"
  },
  {
    value: "png",
    label: "PNG",
    eyebrow: "Transparency safe",
    bestFor: "Logos, diagrams, and alpha-heavy assets where clean edges matter.",
    compatibility: "Universal"
  },
  {
    value: "jxl",
    label: "JPEG XL",
    eyebrow: "Expert codec",
    bestFor: "High-efficiency archival or controlled delivery environments.",
    compatibility: "Selective support"
  },
  {
    value: "heic",
    label: "HEIC",
    eyebrow: "Apple workflow",
    bestFor: "Apple-centric capture pipelines and HEIF-based exports.",
    compatibility: "Platform-specific"
  }
];

const EDGE_READY_FORMATS = new Set<SupportedFormat>(["avif", "webp", "jpeg", "png"]);

const SOCIAL_PRESETS = [
  { label: "Instagram", width: 1080, height: 1350 },
  { label: "YouTube", width: 1280, height: 720 },
  { label: "Twitter", width: 1600, height: 900 },
  { label: "LinkedIn", width: 1200, height: 627 },
  { label: "WhatsApp", width: 1080, height: 1080 }
] as const;

function isEdgeReadyFormat(format: SupportedFormat) {
  return EDGE_READY_FORMATS.has(format);
}

function getFormatLabel(value: ExportOptionValue | SupportedFormat) {
  return EXPORT_OPTIONS.find((option) => option.value === value)?.label ?? value.toUpperCase();
}

function getLikelyTransparency(file: File | null, sourceUrl: string) {
  const candidate = `${file?.type ?? ""} ${file?.name ?? ""} ${sourceUrl}`.toLowerCase();
  return ["png", "webp", "avif", "heic"].some((token) => candidate.includes(token));
}

function getRecommendedFormat({
  file,
  sourceUrl,
  detectionHints
}: {
  file: File | null;
  sourceUrl: string;
  detectionHints: DetectionHints | null;
}): SupportedFormat {
  const likelyTransparency = getLikelyTransparency(file, sourceUrl);
  const faces = detectionHints?.faces.length ?? 0;
  const textBlocks = detectionHints?.textBlocks.length ?? 0;

  if (likelyTransparency && textBlocks > 0) {
    return "png";
  }

  if (textBlocks > 0) {
    return "webp";
  }

  if (faces > 0) {
    return "avif";
  }

  if (likelyTransparency) {
    return "webp";
  }

  return "avif";
}

function getFormatWarnings({
  format,
  likelyTransparency,
  faceCount,
  textCount,
  executionMode
}: {
  format: SupportedFormat;
  likelyTransparency: boolean;
  faceCount: number;
  textCount: number;
  executionMode: "server" | "edge";
}) {
  const warnings: string[] = [];

  if (format === "jpeg" && likelyTransparency) {
    warnings.push("Transparency will be flattened in JPEG exports.");
  }

  if (format === "jpeg" && textCount > 0) {
    warnings.push("Detected text will usually stay sharper in WebP or PNG.");
  }

  if (format === "png" && faceCount > 0) {
    warnings.push("Photo-heavy assets are usually much smaller in AVIF or WebP.");
  }

  if ((format === "jxl" || format === "heic") && executionMode === "edge") {
    warnings.push("This selection will automatically fall back to the server pipeline.");
  }

  if (format === "avif" && textCount > 0) {
    warnings.push("AVIF is efficient here, but WebP can keep UI text slightly crisper.");
  }

  return warnings;
}

export function CompressorWorkbench({
  title = "Upload images. Optimize them. Download fast.",
  description = "Compress images, switch formats, resize for social, and export clean files."
}: CompressorWorkbenchProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [queuedPreviews, setQueuedPreviews] = useState<Array<{ name: string; size: number; url: string }>>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState("auto");
  const [executionMode, setExecutionMode] = useState<"server" | "edge">("server");
  const [mode, setMode] = useState<"max" | "balanced" | "quality" | "custom">("balanced");
  const [quality, setQuality] = useState(78);
  const [maxWidth, setMaxWidth] = useState("");
  const [maxHeight, setMaxHeight] = useState("");
  const [targetSizeKb, setTargetSizeKb] = useState("");
  const [comparePosition, setComparePosition] = useState(50);
  const [contentAware, setContentAware] = useState(true);
  const [generateResponsive, setGenerateResponsive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingBundle, setIsPreparingBundle] = useState(false);
  const [bundleStatus, setBundleStatus] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<number | null>(null);
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
    if (queuedFiles.length === 0) {
      setQueuedPreviews([]);
      return;
    }

    const previews = queuedFiles.slice(0, 8).map((file) => ({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file)
    }));

    setQueuedPreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [queuedFiles]);

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

  const likelyTransparency = getLikelyTransparency(selectedFile, sourceUrl);
  const recommendedFormat = getRecommendedFormat({
    file: selectedFile,
    sourceUrl,
    detectionHints
  });
  const selectedEffectiveFormat =
    outputFormat === "auto" ? recommendedFormat : (outputFormat as SupportedFormat);
  const originalSize = selectedFile?.size ?? 2_400_000;
  const targetSizeBytes = Number(targetSizeKb) > 0 ? Number(targetSizeKb) * 1024 : null;
  const effectiveQuality =
    targetSizeBytes && Number.isFinite(targetSizeBytes)
      ? suggestQualityForTarget({
          originalSize,
          targetSize: targetSizeBytes,
          format: selectedEffectiveFormat,
          mode
        })
      : quality;
  const estimate = useCompressionEstimate({
    originalSize,
    quality: effectiveQuality,
    format: selectedEffectiveFormat,
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
  const exportCards = useMemo(
    () =>
      EXPORT_OPTIONS.map((option) => {
        const effectiveFormat =
          option.value === "auto" ? recommendedFormat : (option.value as SupportedFormat);
        const estimate = getCompressionEstimate({
          originalSize,
          quality:
            targetSizeBytes && Number.isFinite(targetSizeBytes)
              ? suggestQualityForTarget({
                  originalSize,
                  targetSize: targetSizeBytes,
                  format: effectiveFormat,
                  mode
                })
              : quality,
          format: effectiveFormat,
          mode
        });
        const warnings = getFormatWarnings({
          format: effectiveFormat,
          likelyTransparency,
          faceCount,
          textCount,
          executionMode
        });

        return {
          ...option,
          effectiveFormat,
          estimate,
          warnings,
          serverFallback: executionMode === "edge" && !isEdgeReadyFormat(effectiveFormat)
        };
      }),
    [
      executionMode,
      faceCount,
      likelyTransparency,
      mode,
      originalSize,
      quality,
      recommendedFormat,
      targetSizeBytes,
      textCount
    ]
  );
  const activeExportCard =
    exportCards.find((option) => option.value === outputFormat) ?? exportCards[0];
  const willFallbackToServer =
    executionMode === "edge" && !isEdgeReadyFormat(selectedEffectiveFormat);
  const submitLabel =
    outputFormat === "auto"
      ? `Run Smart export (${getFormatLabel(recommendedFormat)})`
      : willFallbackToServer
        ? `Compress to ${activeExportCard.label} with server fallback`
        : `Compress to ${activeExportCard.label}`;
  const selectionInsight =
    outputFormat === "auto"
      ? textCount > 0
        ? `Smart export is favoring ${getFormatLabel(recommendedFormat)} because text regions were detected.`
        : faceCount > 0
          ? `Smart export is favoring ${getFormatLabel(recommendedFormat)} because faces were detected.`
          : likelyTransparency
            ? `Smart export is favoring ${getFormatLabel(
                recommendedFormat
              )} because this asset likely needs transparency-safe delivery.`
            : `Smart export is favoring ${getFormatLabel(
                recommendedFormat
              )} for the strongest size-to-quality tradeoff.`
      : activeExportCard.bestFor;

  function handleFiles(files: File[] | FileList | null) {
    const nextFiles = files ? Array.from(files).filter(Boolean) : [];

    if (nextFiles.length === 0) {
      return;
    }

    startTransition(() => {
      setQueuedFiles(nextFiles);
      setSelectedFile(nextFiles[0] ?? null);
      setSourceUrl("");
      setResult(null);
      setError(null);
      setVisionError(null);
      setBundleStatus(null);
      setBatchProgress(null);
    });
  }

  function applyPreset(width: number, height: number) {
    setMaxWidth(String(width));
    setMaxHeight(String(height));
  }

  async function requestCompression({
    format,
    forceExecutionMode,
    fileOverride
  }: {
    format: ExportOptionValue | SupportedFormat;
    forceExecutionMode?: "server" | "edge";
    fileOverride?: File | null;
  }) {
    const selectedFormat = format === "auto" ? recommendedFormat : (format as SupportedFormat);
    const runtime = forceExecutionMode ?? executionMode;
    const activeFile = fileOverride ?? selectedFile;
    const requestQuality =
      targetSizeBytes && Number.isFinite(targetSizeBytes)
        ? suggestQualityForTarget({
            originalSize: activeFile?.size ?? originalSize,
            targetSize: targetSizeBytes,
            format: selectedFormat,
            mode
          })
        : quality;

    if (runtime === "edge" && activeFile && !sourceUrl.trim() && isEdgeReadyFormat(selectedFormat)) {
      return compressOnEdge({
        file: activeFile,
        outputFormat: selectedFormat,
        quality: requestQuality,
        maxWidth: maxWidth ? Number(maxWidth) : undefined,
        maxHeight: maxHeight ? Number(maxHeight) : undefined,
        generateResponsive,
        detectionHints
      });
    }

    const formData = new FormData();

    if (activeFile) {
      formData.append("file", activeFile);
    }

    if (sourceUrl.trim()) {
      formData.append("sourceUrl", sourceUrl.trim());
    }

    if (detectionHints) {
      formData.append("detectionHints", JSON.stringify(detectionHints));
    }

    formData.append("outputFormat", format);
    formData.append("executionMode", runtime);
    formData.append("mode", mode);
    formData.append("quality", String(requestQuality));
    if (maxWidth) {
      formData.append("maxWidth", maxWidth);
    }
    if (maxHeight) {
      formData.append("maxHeight", maxHeight);
    }
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

    return payload;
  }

  async function handleSubmit() {
    if (!selectedFile && !sourceUrl.trim()) {
      setError("Provide a local image, paste one, or enter a URL.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setBatchProgress(null);
    setBundleStatus(null);

    try {
      if (queuedFiles.length > 1) {
        const { default: JSZip } = await import("jszip");
        const archive = new JSZip();

        for (const [index, file] of queuedFiles.entries()) {
          const payload = await requestCompression({
            format: outputFormat,
            fileOverride: file
          });

          archive.file(payload.fileName, Uint8Array.from(atob(payload.bufferBase64), (char) => char.charCodeAt(0)));
          setBatchProgress(Math.round(((index + 1) / queuedFiles.length) * 100));
          setBundleStatus(`Compressed ${index + 1} of ${queuedFiles.length} images...`);

          if (index === queuedFiles.length - 1) {
            startTransition(() => setResult(payload));
          }
        }

        setBundleStatus("Building batch ZIP...");
        const zipBlob = await archive.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = "ai-image-optimizer-batch.zip";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
        setBundleStatus("Batch ZIP ready.");
        return;
      }

      const payload = await requestCompression({
        format: outputFormat
      });
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

  async function handleDownloadAll() {
    if (!selectedFile && !sourceUrl.trim()) {
      setError("Provide a local image or source URL before exporting all formats.");
      return;
    }

    setIsPreparingBundle(true);
    setBundleStatus("Preparing multi-format export...");
    setError(null);

    try {
      const { default: JSZip } = await import("jszip");
      const archive = new JSZip();
      const bundleFormats: SupportedFormat[] = ["avif", "webp", "jpeg", "png", "jxl", "heic"];
      const baseName =
        selectedFile?.name.replace(/\.[^/.]+$/, "") ||
        sourceUrl.split("/").pop()?.replace(/\.[^/.]+$/, "") ||
        "compressai-export";

      for (const [index, format] of bundleFormats.entries()) {
        setBundleStatus(`Encoding ${format.toUpperCase()} (${index + 1}/${bundleFormats.length})...`);

        try {
          const payload = await requestCompression({
            format,
            forceExecutionMode: "server"
          });
          archive.file(payload.fileName, Uint8Array.from(atob(payload.bufferBase64), (char) => char.charCodeAt(0)));
        } catch (bundleError) {
          archive.file(
            `${baseName}-${format}-error.txt`,
            bundleError instanceof Error ? bundleError.message : `Failed to export ${format.toUpperCase()}.`
          );
        }
      }

      setBundleStatus("Building ZIP archive...");
      const zipBlob = await archive.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${baseName}-all-formats.zip`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
      setBundleStatus("ZIP export ready.");
    } catch (bundleFailure) {
      setError(bundleFailure instanceof Error ? bundleFailure.message : "Bulk export failed.");
      setBundleStatus(null);
    } finally {
      setIsPreparingBundle(false);
    }
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
                handleFiles(event.dataTransfer.files);
              }}
              onPaste={(event) => {
                const item = Array.from(event.clipboardData.items).find((entry) =>
                  entry.type.startsWith("image/")
                );
                handleFiles(item?.getAsFile() ? [item.getAsFile() as File] : null);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <UploadCloud className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-white">Drop images, paste from clipboard, or fetch from URL</p>
                  <p className="text-sm text-muted-foreground">
                    Use server AI for full coverage or edge mode for fast browser-side encoding.
                  </p>
                </div>
              </div>

              <input
                type="file"
                multiple
                accept="image/*,.avif,.webp,.jxl,.heic"
                onChange={(event) => handleFiles(event.target.files)}
                className="block w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
              />

              {queuedPreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Upload preview grid</span>
                    <span>{queuedFiles.length} image(s) queued</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {queuedPreviews.map((preview) => (
                      <div
                        key={preview.name}
                        className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]"
                      >
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="aspect-[4/3] w-full object-cover"
                        />
                        <div className="space-y-1 px-3 py-3 text-xs">
                          <p className="truncate text-white">{preview.name}</p>
                          <p className="text-muted-foreground">{formatBytes(preview.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <Link2 className="h-4 w-4 text-primary" />
                <Input
                  placeholder="Remote URL: https://example.com/hero-image.jpg"
                  value={sourceUrl}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSourceUrl(nextValue);

                    if (nextValue.trim()) {
                      setQueuedFiles([]);
                      setSelectedFile(null);
                      setResult(null);
                    }
                  }}
                />
              </div>
            </motion.div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Choose the export you want to download</p>
                  <p className="text-sm text-muted-foreground">
                    Smart Export is the default. Manual codecs stay available when you need exact control.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground">
                  Current AI pick: <span className="font-medium text-white">{getFormatLabel(recommendedFormat)}</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {exportCards.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setOutputFormat(option.value)}
                    className={cn(
                      "rounded-[26px] border p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]",
                      outputFormat === option.value
                        ? "border-primary/45 bg-primary/[0.10] shadow-[0_18px_48px_rgba(59,130,246,0.16)]"
                        : "border-white/10 bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                          {option.eyebrow}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">{option.label}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {option.value === "auto" ? (
                          <Badge>{getFormatLabel(recommendedFormat)} now</Badge>
                        ) : null}
                        {outputFormat === option.value ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.bestFor}</p>

                    <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-black/30">
                      {previewUrl || sourceUrl ? (
                        <div className="relative aspect-[16/10]">
                          <img
                            src={previewUrl ?? sourceUrl}
                            alt={`${option.label} preview`}
                            className="h-full w-full object-cover opacity-80"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-primary">
                              {option.value === "auto"
                                ? `Exports as ${getFormatLabel(recommendedFormat)}`
                                : `${option.label} output`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex aspect-[16/10] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                          Add an image to preview this export option.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Est. size
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {formatBytes(option.estimate.estimatedSize)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Savings
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {formatPercent(option.estimate.savings)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{option.compatibility}</span>
                      <span>{option.serverFallback ? "Server fallback" : executionMode === "edge" ? "Edge ready" : "Server ready"}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-primary">Selected export</p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {outputFormat === "auto"
                          ? `Smart Export -> ${getFormatLabel(recommendedFormat)}`
                          : activeExportCard.label}
                      </p>
                    </div>
                    <Badge>{activeExportCard.compatibility}</Badge>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectionInsight}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {faceCount > 0 ? <Badge>{faceCount} face(s)</Badge> : null}
                    {textCount > 0 ? <Badge>{textCount} text block(s)</Badge> : null}
                    {likelyTransparency ? <Badge>Transparency likely</Badge> : null}
                    {targetSizeBytes ? <Badge>Goal {targetSizeKb} KB</Badge> : null}
                    {willFallbackToServer ? <Badge>Server fallback enabled</Badge> : null}
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {activeExportCard.warnings.length > 0 ? (
                      activeExportCard.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))
                    ) : (
                      <p>No quality or compatibility warning for this export path.</p>
                    )}
                    {targetSizeBytes ? (
                      <p>
                        Current estimate is {formatBytes(activeExportCard.estimate.estimatedSize)} against a goal of{" "}
                        {formatBytes(targetSizeBytes)}.
                      </p>
                    ) : null}
                  </div>
                </div>

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
                  <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-primary">Download outcome</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {outputFormat === "auto"
                        ? `Most users should stay on Smart Export. It will deliver ${getFormatLabel(
                            recommendedFormat
                          )} for this image.`
                        : `Manual mode locks the export to ${activeExportCard.label} so the download result matches your selection exactly.`}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-3">
                <p className="text-sm font-medium text-white">Social presets</p>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset.width, preset.height)}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition hover:border-white/20 hover:text-white"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap once to load platform-friendly image sizes.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-muted-foreground">
                  Width
                  <Input
                    inputMode="numeric"
                    placeholder="Optional"
                    value={maxWidth}
                    onChange={(event) => setMaxWidth(event.target.value.replace(/[^\d]/g, ""))}
                  />
                </label>
                <label className="space-y-2 text-sm text-muted-foreground">
                  Height
                  <Input
                    inputMode="numeric"
                    placeholder="Optional"
                    value={maxHeight}
                    onChange={(event) => setMaxHeight(event.target.value.replace(/[^\d]/g, ""))}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{targetSizeBytes ? "Auto-tuned quality" : "Quality target"}</span>
                  <span>{effectiveQuality}</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={95}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="w-full accent-[hsl(var(--primary))]"
                />
                <Progress value={(effectiveQuality / 95) * 100} />
                <p className="text-xs text-muted-foreground">
                  {targetSizeBytes
                    ? `Manual slider stays at ${quality}, but exports are auto-tuned to ${effectiveQuality} to chase ${targetSizeKb} KB.`
                    : "Use the slider when you care more about visual quality than file size."}
                </p>
              </div>

              <label className="space-y-2 text-sm text-muted-foreground">
                Target size in KB
                <Input
                  inputMode="numeric"
                  placeholder="Optional, e.g. 180"
                  value={targetSizeKb}
                  onChange={(event) => setTargetSizeKb(event.target.value.replace(/[^\d]/g, ""))}
                />
                <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-primary">Size-first mode</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Enter a KB goal and CompressAI Pro will tune quality toward that target before export.
                  </p>
                </div>
              </label>
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
                {submitLabel}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                disabled={queuedFiles.length > 1 || isPreparingBundle || isSubmitting}
                leftIcon={isPreparingBundle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              >
                Download all formats
              </Button>
              {result ? (
                <Button variant="outline" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
                  Download {result.fileName.split(".").pop()?.toUpperCase() ?? "result"}
                </Button>
              ) : null}
            </div>

            {bundleStatus ? <p className="text-sm text-muted-foreground">{bundleStatus}</p> : null}
            {batchProgress !== null ? <Progress value={batchProgress} /> : null}
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

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Before / after slider</p>
            <div className="grid-overlay relative overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
              {previewUrl || sourceUrl ? (
                <div className="relative aspect-[16/10]">
                  <img
                    src={previewUrl ?? sourceUrl}
                    alt="Original preview"
                    className="h-full w-full object-cover"
                  />
                  {resultPreviewUrl ? (
                    <>
                      <div
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{ width: `${comparePosition}%` }}
                      >
                        <img
                          src={resultPreviewUrl}
                          alt="Compressed preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div
                        className="absolute inset-y-0 w-px bg-white/80"
                        style={{ left: `${comparePosition}%` }}
                      />
                    </>
                  ) : null}
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white">
                    Original
                  </div>
                  <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white">
                    Optimized
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Upload or paste an image to populate the preview.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span>Compare</span>
                <span>{comparePosition}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={comparePosition}
                onChange={(event) => setComparePosition(Number(event.target.value))}
                className="w-full accent-[hsl(var(--primary))]"
                disabled={!resultPreviewUrl}
              />
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
                  <Badge>{deferredResult.fileName.split(".").pop()?.toUpperCase() ?? "EXPORT"}</Badge>
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
