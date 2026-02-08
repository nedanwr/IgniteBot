import type { QueryCtx } from "../_generated/server";
import { auth } from "../auth";

export async function verifyGuildAccess(ctx: QueryCtx, guildDiscordId: string) {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const guild = await ctx.db
    .query("guilds")
    .withIndex("by_user_and_discord", (q) =>
      q.eq("userId", userId).eq("discordId", guildDiscordId)
    )
    .first();

  if (!guild) {
    throw new Error("Guild not found or access denied");
  }

  if (!guild.hasBot) {
    throw new Error("Bot is not in this guild");
  }

  return guild;
}
