import OpenAI from "openai";

import { env } from "@/lib/env";

let client: OpenAI | null | undefined;

export function getOpenAI() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  if (client === undefined) {
    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
  }

  return client;
}
