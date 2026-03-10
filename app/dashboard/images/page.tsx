import { getServerSession } from "next-auth";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBytes, formatPercent } from "@/utils/format";

export default async function DashboardImagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const images = await prisma.image.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <CardTitle>Saved images</CardTitle>
          <span className="text-sm text-muted-foreground">{images.length} recent assets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Formats</th>
                <th className="px-3 py-2">Sizes</th>
                <th className="px-3 py-2">Savings</th>
              </tr>
            </thead>
            <tbody>
              {images.map((image) => (
                <tr key={image.id} className="border-t border-white/10">
                  <td className="px-3 py-3 text-white">{image.originalName}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {image.inputFormat} → {image.outputFormat ?? "Pending"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {formatBytes(image.originalBytes)} → {formatBytes(image.compressedBytes ?? 0)}
                  </td>
                  <td className="px-3 py-3 text-primary">
                    {formatPercent(image.compressionRatio ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
