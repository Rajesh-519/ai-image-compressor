import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found." }, { status: 404 });
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${env.APP_BASE_URL}/dashboard/billing`
  });

  return NextResponse.json({
    url: portal.url
  });
}
