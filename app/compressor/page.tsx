import { CompressorWorkbench } from "@/components/compressor/compressor-workbench";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";

export default function CompressorPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-16 lg:px-8">
        <div className="space-y-4">
          <Badge>Compressor</Badge>
          <h1 className="font-display text-5xl font-semibold text-white">Optimize images now</h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Compress. Convert. Resize. Export.
          </p>
        </div>
        <CompressorWorkbench />
      </main>
      <SiteFooter />
    </div>
  );
}
