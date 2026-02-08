"use client";

import { useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

import { env } from "~/env";

let client: ConvexReactClient | null = null;

function getConvexClient() {
  if (!client) {
    client = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
  }
  return client;
}

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  const convex = useMemo(getConvexClient, []);

  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
