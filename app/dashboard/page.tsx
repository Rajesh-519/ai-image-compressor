import { RecentJobs } from "@/components/dashboard/recent-jobs";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { UsageOverview } from "@/components/dashboard/usage-overview";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard-data";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const data = await getDashboardData(session.user.id);

  return (
    <div className="space-y-6">
      <StatsGrid stats={data.stats} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <UsageOverview usageSeries={data.usageSeries} />
        <Card>
          <CardContent className="space-y-4">
            <CardTitle>Plan summary</CardTitle>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Current plan</p>
              <p className="mt-3 font-display text-4xl text-white">{data.plan}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Upgrade when you need responsive bundles, API keys, or website audits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <RecentJobs jobs={data.recentJobs} />
    </div>
  );
}
