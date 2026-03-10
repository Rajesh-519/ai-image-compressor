import { getServerSession } from "next-auth";

import { ApiKeyManager } from "@/components/dashboard/api-key-manager";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardApiPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const keys = await prisma.aPIKey.findMany({
    where: {
      userId: session.user.id,
      revokedAt: null
    },
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <CardTitle>Developer API</CardTitle>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-muted-foreground">
            <pre className="overflow-x-auto text-xs text-white">{`POST /api/compress
POST /api/convert
POST /api/bulk
GET  /api/usage

Authorization: Bearer <api_key>`}</pre>
          </div>
        </CardContent>
      </Card>
      <ApiKeyManager initialKeys={keys} />
    </div>
  );
}
