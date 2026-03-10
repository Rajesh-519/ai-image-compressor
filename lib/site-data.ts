import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bot,
  Gauge,
  Globe,
  Layers3,
  ScanSearch,
  Sparkles,
  WandSparkles
} from "lucide-react";

export const featureCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  stat: string;
}> = [
  {
    title: "AI content-aware compression",
    description:
      "Protect faces, text, and product detail while aggressively compressing low-salience regions.",
    icon: Bot,
    stat: "Up to 90% savings"
  },
  {
    title: "Modern codec engine",
    description:
      "AVIF, WebP, JPEG XL, HEIC, PNG, and JPEG conversion with codec-specific tuning.",
    icon: Layers3,
    stat: "6 premium formats"
  },
  {
    title: "Real-time visual QA",
    description:
      "Zoom, compare, and slide between original and output before exporting production assets.",
    icon: Sparkles,
    stat: "Instant diff preview"
  },
  {
    title: "Bulk and API workflows",
    description:
      "Compress folders, ZIP archives, and pipelines with API keys, usage quotas, and plan enforcement.",
    icon: BadgeCheck,
    stat: "Agency ready"
  },
  {
    title: "Responsive delivery",
    description:
      "Generate multi-size variants, srcset markup, and framework-friendly responsive output bundles.",
    icon: Gauge,
    stat: "4 preset breakpoints"
  },
  {
    title: "Website image audit",
    description:
      "Scan public pages for oversized assets, legacy formats, and immediate page speed opportunities.",
    icon: ScanSearch,
    stat: "SEO reporting"
  },
  {
    title: "SEO metadata automation",
    description:
      "Generate alt text, filenames, titles, and captions from image context and delivery intent.",
    icon: WandSparkles,
    stat: "AI assisted"
  },
  {
    title: "Global delivery controls",
    description:
      "Pair compression with CDN strategy, storage connectors, and format negotiation for web performance.",
    icon: Globe,
    stat: "Edge aligned"
  }
];

export const faqItems = [
  {
    question: "Which formats does CompressAI Pro support?",
    answer:
      "The platform is designed around JPEG, PNG, WebP, AVIF, HEIC, and JPEG XL workflows. Sharp handles the common path, while the codec abstraction allows Squoosh-backed fallbacks when needed."
  },
  {
    question: "How is the AI compression mode different from standard compression?",
    answer:
      "AI mode analyzes image intent and important regions before assigning codec, quality, and resize decisions. That produces smaller files without flattening faces, text, or product edges."
  },
  {
    question: "Can teams automate compression in their CMS or build pipeline?",
    answer:
      "Yes. Agency accounts can issue API keys, send files to `/api/compress`, and query `/api/usage` for quota and analytics."
  },
  {
    question: "Is privacy built in?",
    answer:
      "The app supports encrypted uploads, configurable retention, API key auth, and browser-first preview flows. You can also adapt the processing layer for fully local compression."
  }
];

export const testimonialItems = [
  {
    quote:
      "We replaced three separate tools with one upload flow and cut image payload by 68% across our catalog.",
    name: "Mina Patel",
    role: "Performance Lead, Atlas Commerce"
  },
  {
    quote:
      "The audit tool found legacy PNG banners we missed for years. The responsive bundle export paid for the migration immediately.",
    name: "Jordan Lee",
    role: "Frontend Platform, Northstar Media"
  },
  {
    quote:
      "Bulk compression plus API quotas made this workable for agency teams instead of just individual designers.",
    name: "Sofia Nguyen",
    role: "Founder, Pixel Assembly"
  }
];

export const pricingTiers = [
  {
    name: "Free",
    priceUsd: "$0",
    priceInr: "₹0",
    description: "For creators validating workflows and previewing AI compression.",
    features: ["50 images per day", "Basic compression", "Manual downloads", "Preview and compare"],
    cta: "Start free"
  },
  {
    name: "Pro",
    priceUsd: "$29",
    priceInr: "~₹2,661",
    description: "For marketers and product teams shipping optimized assets every day.",
    features: ["Unlimited compression", "Bulk processing", "Responsive variants", "SEO metadata generation"],
    cta: "Upgrade to Pro"
  },
  {
    name: "Agency",
    priceUsd: "$99",
    priceInr: "~₹9,085",
    description: "For multi-brand teams that need API access, audits, and shared governance.",
    features: ["Team accounts", "API keys", "Website audits", "Priority support"],
    cta: "Contact sales"
  }
];
