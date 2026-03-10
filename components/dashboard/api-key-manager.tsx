"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type KeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string | Date;
  lastUsedAt?: string | Date | null;
};

export function ApiKeyManager({ initialKeys }: { initialKeys: KeyRecord[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ name })
      });
      const payload = (await response.json()) as {
        error?: string;
        key?: KeyRecord;
        rawKey?: string;
      };

      if (!response.ok || !payload.key || !payload.rawKey) {
        throw new Error(payload.error ?? "Failed to create API key.");
      }

      setKeys((current) => [payload.key as KeyRecord, ...current]);
      setRawKey(payload.rawKey);
      setName("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create API key.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardContent className="space-y-4">
          <CardTitle>Create API key</CardTitle>
          <Input
            placeholder="Agency ingestion pipeline"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button onClick={handleCreate} disabled={!name.trim() || submitting}>
            Generate key
          </Button>
          {rawKey ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Copy this key now. It will not be shown again.
              <pre className="mt-3 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs">{rawKey}</pre>
            </div>
          ) : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <CardTitle>Active keys</CardTitle>
          <div className="space-y-3">
            {keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No API keys created yet.</p>
            ) : (
              keys.map((key) => (
                <div
                  key={key.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{key.name}</p>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary">
                      {key.prefix}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt ? ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
