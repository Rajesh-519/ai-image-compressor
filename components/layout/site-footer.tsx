import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-display text-base text-white">CompressAI Pro</p>
          <p>AI-powered image compression, conversion, SEO metadata, and website audits.</p>
        </div>
        <div className="flex gap-5">
          <Link href="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link href="/compressor" className="transition hover:text-white">
            Compressor
          </Link>
          <Link href="/analytics" className="transition hover:text-white">
            Analytics
          </Link>
        </div>
      </div>
    </footer>
  );
}
