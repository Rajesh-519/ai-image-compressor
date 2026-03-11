"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBytes, formatPercent } from "@/utils/format";

type AuditReport = {
  totalImages: number;
  imagesWithIssues: number;
  totalPotentialSavingsPercent: number;
  images: Array<{
    src: string;
    contentType?: string | null;
    bytes?: number | null;
    suggestions: string[];
    estimatedSavingsPercent: number;
  }>;
};

export function AuditForm() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ url })
      });
      const payload = (await response.json()) as AuditReport & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Audit failed.");
      }

      setReport(payload);
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "Audit failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4">
          <CardTitle>Website image audit</CardTitle>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
            />
            <Button onClick={handleSubmit} disabled={!url.trim() || loading}>
              {loading ? "Scanning..." : "Run audit"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Agency plan required. Scans up to 25 images per page.</p>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </CardContent>
      </Card>

      {report ? (
        <Card>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Images scanned</p>
                <p className="mt-2 text-2xl font-semibold text-white">{report.totalImages}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Images with issues</p>
                <p className="mt-2 text-2xl font-semibold text-white">{report.imagesWithIssues}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Potential savings</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatPercent(report.totalPotentialSavingsPercent)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {report.images.map((image) => (
                <div
                  key={image.src}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <p className="truncate font-medium text-white">{image.src}</p>
                  <p className="mt-2 text-muted-foreground">
                    {image.contentType ?? "Unknown"} | {image.bytes ? formatBytes(image.bytes) : "Size unavailable"} |{" "}
                    Est. savings {formatPercent(image.estimatedSavingsPercent)}
                  </p>
                  <ul className="mt-3 space-y-1 text-muted-foreground">
                    {image.suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
