import { getServerSession } from "next-auth";

import { BillingActions } from "@/components/dashboard/billing-actions";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardBillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const currentPlan = subscription?.plan ?? session.user.plan;

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <CardTitle>Billing and subscriptions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your Stripe subscription, upgrade plans, and unlock API access or website audits.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Current plan</p>
          <p className="mt-3 font-display text-4xl text-white">{currentPlan}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {subscription?.status ?? "No active subscription"}{" "}
            {subscription?.currentPeriodEnd
              ? `• Renews ${subscription.currentPeriodEnd.toLocaleDateString()}`
              : ""}
          </p>
        </div>

        <BillingActions currentPlan={currentPlan} />
      </CardContent>
    </Card>
  );
}
