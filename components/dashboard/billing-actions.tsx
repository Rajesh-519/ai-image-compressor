"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function BillingActions({ currentPlan }: { currentPlan: "FREE" | "PRO" | "AGENCY" }) {
  const [loading, setLoading] = useState<"pro" | "agency" | "portal" | null>(null);

  async function launch(path: string, payload?: Record<string, string>) {
    setLoading(path.includes("portal") ? "portal" : (payload?.plan?.toLowerCase() as "pro" | "agency"));

    const response = await fetch(path, {
      method: "POST",
      headers: payload ? { "content-type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined
    });

    const data = (await response.json()) as { url?: string; error?: string };

    setLoading(null);

    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "Unable to open billing flow.");
    }

    window.location.href = data.url;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {currentPlan !== "PRO" ? (
        <Button variant="outline" onClick={() => launch("/api/stripe/checkout", { plan: "PRO" })}>
          {loading === "pro" ? "Loading..." : "Upgrade to Pro"}
        </Button>
      ) : null}
      {currentPlan !== "AGENCY" ? (
        <Button onClick={() => launch("/api/stripe/checkout", { plan: "AGENCY" })}>
          {loading === "agency" ? "Loading..." : "Upgrade to Agency"}
        </Button>
      ) : null}
      {currentPlan !== "FREE" ? (
        <Button variant="ghost" onClick={() => launch("/api/stripe/portal")}>
          {loading === "portal" ? "Loading..." : "Manage billing"}
        </Button>
      ) : null}
    </div>
  );
}
