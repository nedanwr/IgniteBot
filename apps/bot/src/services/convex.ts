import { ConvexHttpClient } from "convex/browser";
import { api } from "@ignite-bot/convex";

import { env } from "~/lib/env";

export const convex = new ConvexHttpClient(env.CONVEX_URL);

export { api };
