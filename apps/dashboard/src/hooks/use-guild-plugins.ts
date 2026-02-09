"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@ignite-bot/convex";
import type { PluginId } from "@ignite-bot/convex/lib/plugins";

export function useGuildPlugins(discordId: string) {
  const settings = useQuery(api.guildSettings.get, {
    guildDiscordId: discordId
  });

  const enablePluginMutation = useMutation(api.guildSettings.enablePlugin);
  const disablePluginMutation = useMutation(api.guildSettings.disablePlugin);

  const enabledPlugins =
    settings && "enabledPlugins" in settings
      ? settings.enabledPlugins
      : undefined;

  function isEnabled(pluginId: PluginId): boolean {
    if (enabledPlugins === undefined) return true;
    return enabledPlugins.includes(pluginId);
  }

  function enablePlugin(pluginId: PluginId) {
    return enablePluginMutation({ guildDiscordId: discordId, pluginId });
  }

  function disablePlugin(pluginId: PluginId) {
    return disablePluginMutation({ guildDiscordId: discordId, pluginId });
  }

  return {
    isEnabled,
    enablePlugin,
    disablePlugin,
    loading: settings === undefined
  };
}
