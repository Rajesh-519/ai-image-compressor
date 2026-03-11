import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Image Optimizer Pro",
    short_name: "Image Optimizer",
    description: "AI-powered image compression, format conversion, resize presets, and batch export.",
    start_url: "/",
    display: "standalone",
    background_color: "#060816",
    theme_color: "#6366F1",
    icons: [
      {
        src: "/pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/pwa-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
