import Link from "next/link";

import { CompressorWorkbench } from "@/components/compressor/compressor-workbench";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FaqList } from "@/components/marketing/faq-list";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { Testimonials } from "@/components/marketing/testimonials";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="hero-shell surface-hairline grid gap-10 overflow-hidden rounded-[36px] border border-white/10 p-8 lg:grid-cols-[1.08fr_0.92fr] lg:p-10">
              <div className="space-y-8">
              <Badge>AI Image Compression SaaS</Badge>
                <div className="space-y-5">
                  <h1 className="text-balance font-display text-5xl font-semibold leading-tight text-white lg:text-7xl">
                    AI compression infrastructure for teams that care about image quality and page speed.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                    CompressAI Pro blends protected-region detection, edge WebAssembly codecs, modern
                    format conversion, responsive variants, and audit tooling into one product.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/compressor"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_18px_48px_rgba(59,130,246,0.24)] transition hover:brightness-105"
                  >
                    Launch compression lab
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                  >
                    Explore plans
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Codecs</p>
                    <p className="mt-3 font-display text-3xl text-white">AVIF, WebP, JXL</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Protected zones</p>
                    <p className="mt-3 font-display text-3xl text-white">Faces + text</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">Execution</p>
                    <p className="mt-3 font-display text-3xl text-white">Server or edge</p>
                  </div>
                </div>
              </div>

              <div className="dotted-noise grid gap-4">
                <div className="rounded-[28px] border border-white/10 bg-black/30 p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Live advisor</p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm text-muted-foreground">Asset</p>
                      <p className="mt-2 text-2xl font-semibold text-white">Homepage hero PNG</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-primary">Recommendation</p>
                        <p className="mt-2 text-lg text-white">AVIF + edge delivery</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-primary">Protected</p>
                        <p className="mt-2 text-lg text-white">2 faces, 4 text blocks</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-primary">Projected win</p>
                      <p className="mt-2 text-3xl font-semibold text-white">2.4MB → 280KB</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Why teams switch</p>
                  <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                    <li>One pipeline for editorial, storefront, and app screenshots.</li>
                    <li>Protected-region detection stops faces and typography from collapsing.</li>
                    <li>Edge mode reduces waiting time for fast one-off exports.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-24 px-6 py-16 lg:px-8 lg:py-24">
          <FeatureGrid />
          <CompressorWorkbench />
          <PricingGrid />
          <Testimonials />
          <FaqList />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
