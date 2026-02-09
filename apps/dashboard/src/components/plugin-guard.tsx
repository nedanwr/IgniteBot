"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PluginId } from "@ignite-bot/convex/lib/plugins";

import { useGuildPlugins } from "~/hooks/use-guild-plugins";

type PluginGuardProps = {
  pluginId: PluginId;
  children: React.ReactNode;
};

export function PluginGuard({ pluginId, children }: PluginGuardProps) {
  const params = useParams<{ discordId: string }>();
  const router = useRouter();
  const { isEnabled, loading } = useGuildPlugins(params.discordId);

  const enabled = isEnabled(pluginId);

  useEffect(() => {
    if (!loading && !enabled) {
      router.replace(`/guild/${params.discordId}`);
    }
  }, [loading, enabled, router, params.discordId]);

  if (loading || !enabled) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
