import Stripe from "stripe";

import { env } from "@/lib/env";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia"
    });
  }

  return stripeInstance;
}
