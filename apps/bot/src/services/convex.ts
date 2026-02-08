import { ConvexHttpClient } from "convex/browser";
import { api } from "@ignite-bot/convex";

import { env } from "~/lib/env";

export const convex = new ConvexHttpClient(env.CONVEX_URL);

/**
 * Call a bot HTTP endpoint on the Convex backend.
 * These endpoints require BOT_SECRET for authentication.
 */
export async function callBotEndpoint(
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const baseUrl = env.CONVEX_URL.replace(".cloud", ".site");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.BOT_SECRET}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Bot endpoint ${path} failed: ${response.status}`);
  }
  return response.json();
}

export { api };
