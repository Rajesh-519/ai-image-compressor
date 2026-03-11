import { prisma } from "@/lib/prisma";

function sevenDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getDashboardData(userId: string) {
  const [imagesCount, totals, recentJobs, subscription, usageEvents, apiKeys] = await Promise.all([
    prisma.image.count({
      where: {
        userId
      }
    }),
    prisma.image.aggregate({
      where: {
        userId,
        compressedBytes: {
          not: null
        }
      },
      _sum: {
        originalBytes: true,
        compressedBytes: true
      }
    }),
    prisma.compressionJob.findMany({
      where: {
        userId
      },
      take: 6,
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE", "TRIALING"]
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    }),
    prisma.usageTracking.findMany({
      where: {
        userId,
        date: {
          gte: sevenDaysAgo()
        }
      },
      orderBy: {
        date: "asc"
      }
    }),
    prisma.aPIKey.count({
      where: {
        userId,
        revokedAt: null
      }
    })
  ]);

  const usageByDay = new Map<string, { images: number; apiCalls: number }>();

  for (const event of usageEvents) {
    const key = event.date.toISOString().slice(0, 10);
    const current = usageByDay.get(key) ?? {
      images: 0,
      apiCalls: 0
    };

    current.images += event.imagesProcessed;
    current.apiCalls += event.apiCalls;
    usageByDay.set(key, current);
  }

  const originalBytes = totals._sum.originalBytes ?? 0;
  const compressedBytes = totals._sum.compressedBytes ?? 0;
  const bytesSaved = Math.max(0, originalBytes - compressedBytes);
  const apiUsage = usageEvents.reduce((total, entry) => total + entry.apiCalls, 0);

  return {
    plan: subscription?.plan ?? "FREE",
    stats: {
      imagesCount,
      storageUsed: compressedBytes,
      bytesSaved,
      apiUsage,
      reductionRate: originalBytes > 0 ? (bytesSaved / originalBytes) * 100 : 0,
      apiKeys
    },
    recentJobs,
    usageSeries: Array.from(usageByDay.entries()).map(([date, values]) => ({
      date,
      ...values
    }))
  };
}
