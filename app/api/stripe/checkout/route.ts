import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { getStripePriceId } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as { plan?: "PRO" | "AGENCY" };
  const plan = body.plan;

  if (!plan) {
    return NextResponse.json({ error: "Select a paid plan." }, { status: 400 });
  }

  const stripe = getStripe();
  const priceId = getStripePriceId(plan);

  if (!stripe || !priceId) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: {
        userId: user.id
      }
    });

    customerId = customer.id;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customerId
      }
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    success_url: `${env.APP_BASE_URL}/dashboard/billing?success=true`,
    cancel_url: `${env.APP_BASE_URL}/pricing?canceled=true`,
    allow_promotion_codes: true,
    metadata: {
      userId: user.id,
      plan
    }
  });

  return NextResponse.json({
    url: checkoutSession.url
  });
}
