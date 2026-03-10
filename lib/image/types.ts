export const SUPPORTED_FORMATS = ["jpeg", "jpg", "png", "webp", "avif", "jxl", "heic"] as const;
export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];
export type CompressionMode = "max" | "balanced" | "quality" | "custom";
export type CompressionExecutionMode = "server" | "edge";

export type ImageIntent = "photo" | "graphic" | "document";

export type ProtectedRegionKind = "face" | "text";

export type ProtectedRegion = {
  kind: ProtectedRegionKind;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

export type DetectionHints = {
  model: string;
  runtime: "browser" | "server";
  faces: ProtectedRegion[];
  textBlocks: ProtectedRegion[];
};

export type ImageAnalysis = {
  width?: number;
  height?: number;
  hasTransparency: boolean;
  containsText: boolean;
  containsFaces: boolean;
  intent: ImageIntent;
  entropy: number;
  faceCount: number;
  textBlockCount: number;
  protectedCoverage: number;
  protectedRegions: ProtectedRegion[];
  suggestedFormat: SupportedFormat;
  suggestedQuality: number;
  recommendedWidth?: number;
  notes: string[];
};

export type OptimizeImageInput = {
  buffer: Buffer;
  fileName: string;
  inputFormat: SupportedFormat;
  outputFormat: SupportedFormat | "auto";
  quality: number;
  mode: CompressionMode;
  maxWidth?: number;
  maxHeight?: number;
  contentAware: boolean;
  generateResponsive: boolean;
  preserveMetadata: boolean;
  executionMode?: CompressionExecutionMode;
  detectionHints?: DetectionHints | null;
};

export type ResponsiveVariant = {
  width: number;
  fileName: string;
  mimeType: string;
  size: number;
};

export type SeoMetadata = {
  altText: string;
  title: string;
  caption: string;
  fileName: string;
};

export type OptimizeImageResult = {
  buffer: Buffer;
  outputFormat: SupportedFormat;
  mimeType: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  savings: number;
  quality: number;
  width?: number;
  height?: number;
  executionMode: CompressionExecutionMode;
  analysis: ImageAnalysis;
  responsiveVariants: ResponsiveVariant[];
  seo: SeoMetadata;
};
