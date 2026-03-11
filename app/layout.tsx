import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/app/globals.css";

import { Providers } from "@/app/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "AI Image Optimizer Pro",
  description:
    "AI-powered image optimization for JPG, PNG, WebP, AVIF, HEIC, batch export, and developer APIs.",
  applicationName: "AI Image Optimizer Pro",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Image Optimizer Pro"
  },
  icons: {
    icon: "/pwa-icon.svg",
    apple: "/pwa-icon.svg"
  },
  keywords: [
    "ai image optimizer",
    "image compressor",
    "compress jpg",
    "compress png",
    "compress webp",
    "compress avif",
    "batch image compressor"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
