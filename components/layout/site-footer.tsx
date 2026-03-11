import Link from "next/link";

import { footerBullets, footerLinks } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-3">
          <p className="font-display text-base text-white">AI Image Optimizer Pro</p>
          <div className="flex flex-wrap gap-2">
            {footerBullets.map((bullet) => (
              <span
                key={bullet}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
              >
                {bullet}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-5">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
