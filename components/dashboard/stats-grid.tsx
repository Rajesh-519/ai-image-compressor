import { Card, CardContent } from "@/components/ui/card";
import { formatBytes, formatPercent } from "@/utils/format";

export function StatsGrid({
  stats
}: {
  stats: {
    imagesCount: number;
    bytesSaved: number;
    reductionRate: number;
    apiKeys: number;
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
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Bytes saved</p>
          <p className="font-display text-3xl font-semibold text-white">{formatBytes(stats.bytesSaved)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Average reduction</p>
          <p className="font-display text-3xl font-semibold text-white">
            {formatPercent(stats.reductionRate)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Active API keys</p>
          <p className="font-display text-3xl font-semibold text-white">{stats.apiKeys}</p>
        </CardContent>
      </Card>
    </div>
  );
}
