"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { testimonialItems } from "@/lib/site-data";

export function Testimonials() {
  return (
    <section className="space-y-8">
      <div className="space-y-3 text-center">
        <Badge>Testimonials</Badge>
        <h2 className="font-display text-4xl font-semibold text-white">
          Teams use CompressAI Pro when image performance is revenue-critical
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {testimonialItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Card className="h-full">
              <CardContent className="space-y-4">
                <p className="text-lg leading-7 text-white">{item.quote}</p>
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
