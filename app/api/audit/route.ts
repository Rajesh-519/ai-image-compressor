import { NextResponse } from "next/server";

import { scanWebsiteImages } from "@/lib/audit";
import { getRequestIdentity } from "@/lib/api-auth";
import { PLAN_CONFIG } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { recordUsage } from "@/lib/usage";
import { auditRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const identity = await getRequestIdentity(request);

  if (!identity) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!PLAN_CONFIG[identity.plan].auditEnabled) {
    return NextResponse.json({ error: "Website audits require the Agency plan." }, { status: 403 });
  }

  const parsed = auditRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const job = await prisma.compressionJob.create({
    data: {
      userId: identity.userId,
      apiKeyId: identity.apiKeyId,
      status: "PROCESSING",
      jobType: "AUDIT",
      sourceUrl: parsed.data.url
    }
  });

  try {
    const report = await scanWebsiteImages(parsed.data.url);

    await prisma.compressionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        report
      }
    });

    await recordUsage({
      userId: identity.userId,
      apiKeyId: identity.apiKeyId,
      auditsRun: 1,
      apiCalls: identity.source === "api_key" ? 1 : 0
    });

    return NextResponse.json(report);
  } catch (error) {
    await prisma.compressionJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Audit failed."
      }
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audit failed." },
      { status: 500 }
    );
  }
}
