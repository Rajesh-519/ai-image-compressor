"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { workflowSteps } from "@/lib/site-data";

export function HowItWorks() {
  return (
    <section className="space-y-6">
      <div className="space-y-3 text-center">
        <Badge>How It Works</Badge>
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Upload. Optimize. Export.
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
          >
            <Card className="h-full">
              <CardContent className="space-y-4">
                <CardTitle>{step.title}</CardTitle>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {step.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
