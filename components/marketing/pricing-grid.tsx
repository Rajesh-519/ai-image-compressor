import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pricingTiers } from "@/lib/site-data";

export function PricingGrid() {
  return (
    <section id="pricing" className="space-y-8">
      <div className="space-y-3 text-center">
        <Badge>Pricing</Badge>
        <h2 className="font-display text-4xl font-semibold text-white">Plans that scale with usage</h2>
        <p className="mx-auto max-w-3xl text-muted-foreground">
          Start with preview workflows, then unlock batch processing, responsive variants, API
          access, and agency controls.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={tier.name === "Pro" ? "border-primary/40" : ""}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.18em] text-primary">{tier.name}</p>
                <CardTitle>{tier.price}/mo</CardTitle>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={tier.name === "Agency" ? "mailto:sales@compressai.pro" : "/pricing"}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {tier.cta}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
