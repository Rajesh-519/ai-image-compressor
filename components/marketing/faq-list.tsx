import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { faqItems } from "@/lib/site-data";

export function FaqList() {
  return (
    <section className="space-y-8">
      <div className="space-y-3 text-center">
        <Badge>FAQ</Badge>
        <h2 className="font-display text-4xl font-semibold text-white">
          Implementation details teams ask about
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {faqItems.map((item) => (
          <Card key={item.question}>
            <CardContent className="space-y-3">
              <CardTitle className="text-lg">{item.question}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
