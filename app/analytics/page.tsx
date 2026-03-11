import { AuditForm } from "@/components/analytics/audit-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-16 lg:px-8">
        <div className="space-y-4">
          <Badge>Website Image Audit</Badge>
          <h1 className="font-display text-5xl font-semibold text-white">Scan any site for heavy images</h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Find large files. Get quick format and size fixes.
          </p>
        </div>
        <AuditForm />
      </main>
      <SiteFooter />
    </div>
  );
}
