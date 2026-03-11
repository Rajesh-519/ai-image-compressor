import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoLandingShell } from "@/components/marketing/seo-landing-shell";
import type { SeoLandingSlug } from "@/lib/site-data";
import { seoLandingPages } from "@/lib/site-data";

type LandingPageProps = {
  params: {
    slug: string;
  };
};

function isSeoLandingSlug(slug: string): slug is SeoLandingSlug {
  return slug in seoLandingPages;
}

export function generateStaticParams() {
  return Object.keys(seoLandingPages).map((slug) => ({
    slug
  }));
}

export function generateMetadata({ params }: LandingPageProps): Metadata {
  if (!isSeoLandingSlug(params.slug)) {
    return {};
  }

  const page = seoLandingPages[params.slug];

  return {
    title: `${page.title} | AI Image Optimizer Pro`,
    description: `${page.subtitle} ${page.bullets.join(". ")}.`
  };
}

export default function SeoLandingPage({ params }: LandingPageProps) {
  if (!isSeoLandingSlug(params.slug)) {
    notFound();
  }

  return <SeoLandingShell slug={params.slug} />;
}
