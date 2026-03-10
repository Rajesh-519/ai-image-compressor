import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { createApiKey } from "@/lib/api-auth";
import { PLAN_CONFIG } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const keys = await prisma.aPIKey.findMany({
    where: {
      userId: session.user.id,
      revokedAt: null
    },
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true
    }
  });

  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!PLAN_CONFIG[session.user.plan].apiEnabled) {
    return NextResponse.json({ error: "API access requires the Agency plan." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; teamId?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "API key name is required." }, { status: 400 });
  }

  const key = createApiKey();

  const saved = await prisma.aPIKey.create({
    data: {
      userId: session.user.id,
      teamId: body.teamId,
      name,
      prefix: key.prefix,
      hashedKey: key.hashedKey
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    key: saved,
    rawKey: key.raw
  });
}
