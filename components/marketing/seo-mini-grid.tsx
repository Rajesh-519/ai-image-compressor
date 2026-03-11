import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { seoMiniSections } from "@/lib/site-data";

export function SeoMiniGrid() {
  return (
    <section className="space-y-6">
      <div className="space-y-3 text-center">
        <Badge>AI Image Optimizer</Badge>
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Fast image optimization for web and apps
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {seoMiniSections.map((section) => (
          <Card key={section.title}>
            <CardContent className="space-y-3">
              <CardTitle>{section.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{section.copy}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
