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
import type { SeoLandingSlug } from "@/lib/site-data";
import { seoLandingPages } from "@/lib/site-data";

export function SeoLandingShell({ slug }: { slug: SeoLandingSlug }) {
  const page = seoLandingPages[slug];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="space-y-20 pb-20">
        <section className="mx-auto max-w-7xl px-6 pt-14 lg:px-8 lg:pt-20">
          <div className="hero-shell surface-hairline overflow-hidden rounded-[36px] border border-white/10 p-8 lg:p-10">
            <div className="space-y-6">
              <Badge>{page.title}</Badge>
              <div className="space-y-4">
                <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
                  {page.title}
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground">{page.subtitle}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {page.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white"
                  >
                    {bullet}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="#tool"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:brightness-105"
                >
                  Open tool
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  View plans
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="tool" className="mx-auto max-w-7xl px-6 lg:px-8">
          <CompressorWorkbench title={page.title} description={page.subtitle} />
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
