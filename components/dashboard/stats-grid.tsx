import { Card, CardContent } from "@/components/ui/card";
import { formatBytes } from "@/utils/format";

export function StatsGrid({
  stats
}: {
  stats: {
    imagesCount: number;
    storageUsed: number;
    bytesSaved: number;
    apiUsage: number;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Images processed</p>
          <p className="font-display text-3xl font-semibold text-white">{stats.imagesCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Storage used</p>
          <p className="font-display text-3xl font-semibold text-white">{formatBytes(stats.storageUsed)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Total size saved</p>
          <p className="font-display text-3xl font-semibold text-white">{formatBytes(stats.bytesSaved)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">API usage</p>
          <p className="font-display text-3xl font-semibold text-white">{stats.apiUsage}</p>
        </CardContent>
      </Card>
    </div>
  );
}
