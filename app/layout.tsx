import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

import { Providers } from "@/app/providers";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display"
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "CompressAI Pro",
  description:
    "AI-powered image compression, conversion, SEO metadata, bulk processing, and website image audits for modern teams.",
  applicationName: "CompressAI Pro",
  keywords: [
    "image compression",
    "AVIF",
    "WebP",
    "JPEG XL",
    "image SEO",
    "website image audit"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
