"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

import { env } from "~/env";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
