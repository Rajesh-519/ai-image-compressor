import { Card, CardContent, CardTitle } from "@/components/ui/card";

export function UsageOverview({
  usageSeries
}: {
  usageSeries: Array<{ date: string; images: number; apiCalls: number }>;
}) {
  const maxImages = Math.max(1, ...usageSeries.map((entry) => entry.images));

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <CardTitle>Usage overview</CardTitle>
          <span className="text-sm text-muted-foreground">Last 7 days</span>
        </div>

        <div className="grid grid-cols-7 items-end gap-3">
          {usageSeries.length === 0
            ? Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="h-28 rounded-full bg-white/5" />
                  <div className="h-3 rounded-full bg-white/5" />
                </div>
              ))
            : usageSeries.map((entry) => (
                <div key={entry.date} className="space-y-3">
                  <div className="flex h-28 items-end">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-primary to-accent"
                      style={{ height: `${Math.max(12, (entry.images / maxImages) * 100)}%` }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-white">{entry.images}</p>
                    <p className="text-[11px] text-muted-foreground">{entry.date.slice(5)}</p>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
