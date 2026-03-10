"use client";

import { useState } from "react";

import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { pricingTiers } from "@/lib/site-data";
import { cn } from "@/utils/cn";

export function PricingGrid() {
  const [currency, setCurrency] = useState<"inr" | "usd">("inr");

  return (
    <section id="pricing" className="space-y-8">
      <div className="space-y-3 text-center">
        <Badge>Pricing</Badge>
        <h2 className="font-display text-4xl font-semibold text-white">Plans that scale with usage</h2>
        <p className="mx-auto max-w-3xl text-muted-foreground">
          Start with preview workflows, then unlock batch processing, responsive variants, API
          access, and agency controls.
        </p>
        <div className="flex justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            {(["inr", "usd"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCurrency(option)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  currency === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-white"
                )}
              >
                {option === "inr" ? "INR" : "USD"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <Card key={tier.name} className={tier.name === "Pro" ? "border-primary/40" : ""}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.18em] text-primary">{tier.name}</p>
                <CardTitle>{currency === "inr" ? tier.priceInr : tier.priceUsd}/mo</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {currency === "inr" ? `Also ${tier.priceUsd}/mo` : `Approx. ${tier.priceInr}/mo`}
                </p>
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

      <p className="text-center text-xs text-muted-foreground">
        INR is shown as an approximate conversion for Indian buyers. Reference used: 1 USD ≈ ₹91.77
        on March 10, 2026. Final charge still depends on your Stripe billing currency setup.
      </p>
    </section>
  );
}
