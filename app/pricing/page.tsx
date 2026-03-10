import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PricingGrid } from "@/components/marketing/pricing-grid";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-12 px-6 py-16 lg:px-8">
        <div className="space-y-4 text-center">
          <Badge>Pricing</Badge>
          <h1 className="font-display text-5xl font-semibold text-white">Choose a plan for your delivery workflow</h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Free covers daily previews. Pro unlocks batch processing and responsive assets. Agency
            adds API keys, audits, and multi-team delivery workflows.
          </p>
        </div>
        <PricingGrid />
      </main>
      <SiteFooter />
    </div>
  );
}
