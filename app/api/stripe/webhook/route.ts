import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function stripeStatusToPlanStatus(status: string) {
  if (status === "active") {
    return "ACTIVE" as const;
  }

  if (status === "trialing") {
    return "TRIALING" as const;
  }

  if (status === "past_due") {
    return "PAST_DUE" as const;
  }

  if (status === "canceled" || status === "unpaid") {
    return "CANCELED" as const;
  }

  return "INACTIVE" as const;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = headers().get("stripe-signature");

  if (!stripe || !env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as "PRO" | "AGENCY" | undefined;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : undefined;

      if (userId && subscriptionId && plan) {
        await prisma.subscription.upsert({
          where: {
            stripeSubscriptionId: subscriptionId
          },
          update: {
            plan,
            status: "ACTIVE",
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            cancelAtPeriodEnd: false
          },
          create: {
            userId,
            plan,
            status: "ACTIVE",
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            stripeSubscriptionId: subscriptionId
          }
        });

        await prisma.user.update({
          where: {
            id: userId
          },
          data: {
            defaultPlan: plan,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined
          }
        });
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const item = subscription.items.data[0];
      const existing = await prisma.subscription.findFirst({
        where: {
          stripeSubscriptionId: subscription.id
        }
      });

      if (existing) {
        await prisma.subscription.update({
          where: {
            id: existing.id
          },
          data: {
            status: stripeStatusToPlanStatus(subscription.status),
            stripePriceId: item?.price.id,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed." },
      { status: 400 }
    );
  }
}
