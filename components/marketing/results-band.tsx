"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resultsHighlights } from "@/lib/site-data";

export function ResultsBand() {
  return (
    <section className="space-y-6">
      <div className="space-y-3 text-center">
        <Badge>Compression Results</Badge>
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Clear output. Fast savings.
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {resultsHighlights.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
          >
            <Card className="h-full">
              <CardContent className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">{item.label}</p>
                <p className="font-display text-4xl font-semibold text-white">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.note}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
