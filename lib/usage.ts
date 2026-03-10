import type { Plan } from "@prisma/client";

import { PLAN_CONFIG } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function enforceUsageLimit(userId: string, plan: Plan) {
  const config = PLAN_CONFIG[plan];

  if (!config.imagesPerDay) {
    return;
  }

  const aggregate = await prisma.usageTracking.aggregate({
    where: {
      userId,
      date: {
        gte: startOfUtcDay()
      }
    },
    _sum: {
      imagesProcessed: true
    }
  });

  if ((aggregate._sum.imagesProcessed ?? 0) >= config.imagesPerDay) {
    throw new Error("Daily image quota reached for the active plan.");
  }
}

export async function recordUsage({
  userId,
  apiKeyId,
  imagesProcessed = 0,
  bytesSaved = 0,
  auditsRun = 0,
  apiCalls = 0
}: {
  userId?: string;
  apiKeyId?: string;
  imagesProcessed?: number;
  bytesSaved?: number;
  auditsRun?: number;
  apiCalls?: number;
}) {
  await prisma.usageTracking.create({
    data: {
      userId,
      apiKeyId,
      imagesProcessed,
      bytesSaved: BigInt(Math.max(0, bytesSaved)),
      auditsRun,
      apiCalls
    }
  });
}
