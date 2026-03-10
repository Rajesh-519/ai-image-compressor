import type { Plan } from "@prisma/client";

import { env } from "@/lib/env";

export const PLAN_CONFIG: Record<
  Plan,
  {
    label: string;
    imagesPerDay: number | null;
    bulkEnabled: boolean;
    apiEnabled: boolean;
    auditEnabled: boolean;
    responsiveEnabled: boolean;
  }
> = {
  FREE: {
    label: "Free",
    imagesPerDay: env.FREE_DAILY_IMAGE_LIMIT,
    bulkEnabled: false,
    apiEnabled: false,
    auditEnabled: false,
    responsiveEnabled: false
  },
  PRO: {
    label: "Pro",
    imagesPerDay: null,
    bulkEnabled: true,
    apiEnabled: false,
    auditEnabled: false,
    responsiveEnabled: true
  },
  AGENCY: {
    label: "Agency",
    imagesPerDay: null,
    bulkEnabled: true,
    apiEnabled: true,
    auditEnabled: true,
    responsiveEnabled: true
  }
};

export function getStripePriceId(plan: Plan) {
  if (plan === "PRO") {
    return env.STRIPE_PRO_PRICE_ID;
  }

  if (plan === "AGENCY") {
    return env.STRIPE_AGENCY_PRICE_ID;
  }

  return null;
}
