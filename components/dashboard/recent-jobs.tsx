import type { CompressionJob } from "@prisma/client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";

export function RecentJobs({ jobs }: { jobs: CompressionJob[] }) {
  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <CardTitle>Recent jobs</CardTitle>
          <span className="text-sm text-muted-foreground">{jobs.length} entries</span>
        </div>

        <div className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No compression jobs yet.</p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{job.jobType}</p>
                  <p className="text-muted-foreground">
                    {job.createdAt.toLocaleDateString()} • {job.bulkCount} file(s)
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
                  {job.status}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
