"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { featureCards } from "@/lib/site-data";

export function FeatureGrid() {
  return (
    <section id="features" className="space-y-8">
      <div className="space-y-3 text-center">
        <Badge>Features</Badge>
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Built for fast image work
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Card className="h-full">
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-accent">
                      {feature.stat}
                    </span>
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
