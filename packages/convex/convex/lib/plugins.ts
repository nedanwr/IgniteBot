export const PLUGIN_IDS = [
  "leaderboard",
  "auditLog",
  "customCommands",
  "welcomeMessages",
  "autoModeration",
  "levels",
  "starboards"
] as const;

export type PluginId = (typeof PLUGIN_IDS)[number];

/**
 * Check if a plugin is enabled for a guild.
 * When enabledPlugins is undefined, all plugins are considered enabled (backwards-compatible).
 */
export function isPluginEnabled(
  enabledPlugins: string[] | undefined,
  pluginId: PluginId
): boolean {
  if (enabledPlugins === undefined) return true;
  return enabledPlugins.includes(pluginId);
}
