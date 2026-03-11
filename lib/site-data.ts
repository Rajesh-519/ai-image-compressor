import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Code2,
  Globe,
  Layers3,
  Package,
  ScanSearch,
  Smartphone,
  Sparkles
} from "lucide-react";

export const heroHighlights = [
  "Reduce image size up to 90%",
  "JPG PNG WebP AVIF HEIC support",
  "Batch compression and ZIP export",
  "AI picks format quality and size"
];

export const resultsHighlights = [
  {
    label: "Average savings",
    value: "90%",
    note: "Smaller payloads. Better page speed."
  },
  {
    label: "Formats",
    value: "6",
    note: "JPG PNG WebP AVIF HEIC JXL."
  },
  {
    label: "Delivery",
    value: "<2s",
    note: "Edge codecs and fast server fallback."
  }
];

export const featureCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  stat: string;
}> = [
  {
    title: "AI Smart Optimize",
    description: "AI picks format, quality, and resize in one click.",
    icon: Bot,
    stat: "Auto strategy"
  },
  {
    title: "Modern formats",
    description: "JPG PNG WebP AVIF HEIC and JPEG XL.",
    icon: Layers3,
    stat: "6 formats"
  },
  {
    title: "Visual compare",
    description: "Preview original and output before download.",
    icon: Sparkles,
    stat: "Before / after"
  },
  {
    title: "Batch exports",
    description: "ZIP delivery for large image sets.",
    icon: Package,
    stat: "Bulk ready"
  },
  {
    title: "Website audit",
    description: "Scan pages and find heavy images fast.",
    icon: ScanSearch,
    stat: "SEO wins"
  },
  {
    title: "Developer API",
    description: "Compress convert and resize from your app.",
    icon: Code2,
    stat: "API endpoints"
  },
  {
    title: "Social presets",
    description: "Instagram YouTube Twitter LinkedIn WhatsApp.",
    icon: Smartphone,
    stat: "1 tap presets"
  },
  {
    title: "CDN ready",
    description: "Generate responsive assets for global delivery.",
    icon: Globe,
    stat: "Fast delivery"
  }
];

export const workflowSteps = [
  {
    title: "1. Upload",
    bullets: ["Drag and drop images", "Paste from clipboard", "Add image or website URL"]
  },
  {
    title: "2. Optimize",
    bullets: ["Use AI Smart Optimize", "Set format quality and size", "Apply social or web presets"]
  },
  {
    title: "3. Export",
    bullets: ["Preview savings", "Download one file or ZIP", "Use responsive output and API links"]
  }
];

export const seoMiniSections = [
  {
    title: "AI image optimizer",
    copy:
      "AI Image Optimizer Pro cuts file size while keeping images clean. Use it for websites, stores, social posts, and app assets."
  },
  {
    title: "Modern formats",
    copy:
      "Convert JPG PNG WebP AVIF and HEIC in one place. Smart mode picks the best output for speed and quality."
  },
  {
    title: "Built for teams",
    copy:
      "Compress single files, large batches, and website image sets. Use dashboard stats, API keys, and usage tracking."
  }
];

export const faqItems = [
  {
    question: "Which formats are supported?",
    answer: "JPG PNG WebP AVIF HEIC and JPEG XL."
  },
  {
    question: "What does AI Smart Optimize do?",
    answer: "It selects format quality and resize settings automatically."
  },
  {
    question: "Can I compress images from a URL?",
    answer: "Yes. Paste an image URL and optimize it directly."
  },
  {
    question: "Can teams use an API?",
    answer: "Yes. Pro and Agency workflows can use API keys and usage tracking."
  }
];

export const testimonialItems = [
  {
    quote: "We cut image payload by 68% in the first week.",
    name: "Mina Patel",
    role: "Performance Lead"
  },
  {
    quote: "The website audit found image waste we had missed for years.",
    name: "Jordan Lee",
    role: "Frontend Platform"
  },
  {
    quote: "Batch export plus API access made this useful across the whole team.",
    name: "Sofia Nguyen",
    role: "Agency Founder"
  }
];

export const pricingTiers = [
  {
    name: "Free",
    priceUsd: "$0",
    priceInr: "INR 0",
    description: "For testing and quick one-off exports.",
    features: ["20 images / day", "Single image tool", "Preview and download", "Basic AI optimize"],
    cta: "Start free"
  },
  {
    name: "Pro",
    priceUsd: "$29",
    priceInr: "~INR 2,661",
    description: "For creators and teams shipping assets daily.",
    features: ["Unlimited compression", "Batch uploads", "API access", "CDN-ready outputs"],
    cta: "Upgrade to Pro"
  },
  {
    name: "Agency",
    priceUsd: "$99",
    priceInr: "~INR 9,085",
    description: "For bigger teams with audits and advanced workflows.",
    features: ["Team access", "Website audits", "Priority support", "Higher throughput"],
    cta: "Contact sales"
  }
];

export const seoLandingPages = {
  "compress-jpg": {
    title: "Compress JPG Online",
    subtitle: "Shrink JPG files fast with AI quality control.",
    bullets: ["Reduce JPG size", "Keep photos sharp", "Download instantly"]
  },
  "compress-png": {
    title: "Compress PNG Online",
    subtitle: "Optimize PNG files with transparency-safe output.",
    bullets: ["Keep alpha layers", "Reduce heavy screenshots", "Export faster pages"]
  },
  "compress-webp": {
    title: "Compress WebP Online",
    subtitle: "Tune WebP files for speed and clean detail.",
    bullets: ["Great for UI shots", "Strong browser support", "Fast web delivery"]
  },
  "compress-avif": {
    title: "Compress AVIF Online",
    subtitle: "Use AVIF for smaller modern image delivery.",
    bullets: ["Excellent savings", "Modern format", "Best for web photos"]
  },
  "batch-image-compressor": {
    title: "Batch Image Compressor",
    subtitle: "Compress large image sets and export ZIP packages.",
    bullets: ["Large batch flows", "ZIP output", "Team ready"]
  },
  "ai-image-optimizer": {
    title: "AI Image Optimizer",
    subtitle: "Let AI choose the best format quality and size.",
    bullets: ["1 click optimize", "Format conversion", "Responsive output"]
  }
} as const;

export type SeoLandingSlug = keyof typeof seoLandingPages;

export const seoLandingCards = Object.entries(seoLandingPages).map(([slug, page]) => ({
  slug,
  ...page
}));

export const footerLinks = [
  {
    label: "Compressor",
    href: "/compressor"
  },
  {
    label: "Website Audit",
    href: "/analytics"
  },
  {
    label: "Pricing",
    href: "/pricing"
  },
  {
    label: "Dashboard",
    href: "/dashboard"
  }
];

export const footerBullets = ["AI compression", "Batch exports", "API ready", "Mobile friendly"];

export const dashboardMessages = {
  planSummary: "Upgrade for batch jobs, API usage, and site audits."
};
