import { NextResponse } from "next/server";

import { getRequestIdentity } from "@/lib/api-auth";
import { getDashboardData } from "@/lib/dashboard-data";

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);

  if (!identity) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const data = await getDashboardData(identity.userId);
  return NextResponse.json(data);
}
