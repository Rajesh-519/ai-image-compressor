import crypto from "crypto";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RequestIdentity = {
  source: "session" | "api_key";
  userId: string;
  apiKeyId?: string;
  plan: "FREE" | "PRO" | "AGENCY";
};

export function createApiKey() {
  const prefix = `cap_${crypto.randomBytes(4).toString("hex")}`;
  const secret = crypto.randomBytes(24).toString("base64url");
  const raw = `${prefix}_${secret}`;

  return {
    raw,
    prefix,
    hashedKey: hashApiKey(raw)
  };
}

export function hashApiKey(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function getRequestIdentity(request: Request): Promise<RequestIdentity | null> {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    return {
      source: "session",
      userId: session.user.id,
      plan: session.user.plan
    };
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const rawApiKey = bearer ?? request.headers.get("x-api-key");

  if (!rawApiKey) {
    return null;
  }

  const apiKey = await prisma.aPIKey.findFirst({
    where: {
      hashedKey: hashApiKey(rawApiKey.trim()),
      revokedAt: null
    },
    include: {
      user: true
    }
  });

  if (!apiKey) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: apiKey.userId,
      status: {
        in: ["ACTIVE", "TRIALING"]
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  await prisma.aPIKey.update({
    where: {
      id: apiKey.id
    },
    data: {
      lastUsedAt: new Date()
    }
  });

  return {
    source: "api_key",
    userId: apiKey.userId,
    apiKeyId: apiKey.id,
    plan: subscription?.plan ?? apiKey.user.defaultPlan
  };
}
