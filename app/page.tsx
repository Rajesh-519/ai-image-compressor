import Link from "next/link";

import { CompressorWorkbench } from "@/components/compressor/compressor-workbench";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FaqList } from "@/components/marketing/faq-list";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ResultsBand } from "@/components/marketing/results-band";
import { SeoMiniGrid } from "@/components/marketing/seo-mini-grid";
import { Badge } from "@/components/ui/badge";
import { heroHighlights } from "@/lib/site-data";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="space-y-20 pb-20">
        <section className="mx-auto max-w-7xl px-6 pt-14 lg:px-8 lg:pt-20">
          <div className="hero-shell surface-hairline overflow-hidden rounded-[36px] border border-white/10 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <Badge>AI Image Optimizer</Badge>
                <div className="space-y-4">
                  <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
                    Compress images fast. Keep them clean.
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    Compress JPG PNG WebP and AVIF instantly.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {heroHighlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="#tool"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:brightness-105"
                  >
                    Upload images
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    View pricing
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Smart output</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-muted-foreground">Example result</p>
                      <p className="mt-2 text-3xl font-semibold text-white">2.4 MB to 280 KB</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-muted-foreground">AI pick</p>
                      <p className="mt-2 text-3xl font-semibold text-white">AVIF</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Batch</p>
                    <p className="mt-2 text-xl font-semibold text-white">ZIP export</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Audit</p>
                    <p className="mt-2 text-xl font-semibold text-white">Website scan</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">API</p>
                    <p className="mt-2 text-xl font-semibold text-white">Developer ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tool" className="mx-auto max-w-7xl px-6 lg:px-8">
          <CompressorWorkbench
            title="Upload images. Optimize them. Download fast."
            description="Drag files, paste images, add URLs, pick presets, and export modern formats."
          />
        </section>

        <div className="mx-auto max-w-7xl space-y-20 px-6 lg:px-8">
          <ResultsBand />
          <FeatureGrid />
          <HowItWorks />
          <SeoMiniGrid />
          <FaqList />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
