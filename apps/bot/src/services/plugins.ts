import { callBotEndpoint } from "./convex";

/**
 * Check if a plugin is enabled for a guild.
 * Calls the Convex HTTP endpoint to check the guild settings.
 */
export async function isPluginEnabled(
  guildDiscordId: string,
  pluginId: string
): Promise<boolean> {
  const result = (await callBotEndpoint("/bot/plugin-enabled", {
    guildDiscordId,
    pluginId
  })) as { enabled: boolean };
  return result.enabled;
}
