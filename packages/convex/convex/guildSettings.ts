import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

const DEFAULT_PREFIX = "!";

// Helper to verify user has access to guild
async function verifyGuildAccess(
  ctx: { db: any; auth: any },
  guildDiscordId: string
) {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const guild = await ctx.db
    .query("guilds")
    .withIndex("by_user_and_discord", (q: any) =>
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

export const get = query({
  args: { guildDiscordId: v.string() },
  handler: async (ctx, { guildDiscordId }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    const settings = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    return settings ?? { prefix: DEFAULT_PREFIX };
  }
});

export const updatePrefix = mutation({
  args: { guildDiscordId: v.string(), prefix: v.string() },
  handler: async (ctx, { guildDiscordId, prefix }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    if (!prefix || prefix.length > 5) {
      throw new Error("Prefix must be 1-5 characters");
    }

    const existing = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { prefix });
    } else {
      await ctx.db.insert("guildSettings", { guildDiscordId, prefix });
    }
  }
});

// For the bot - resolves a command from message content
// Returns the command if found, null otherwise
export const resolveCommand = query({
  args: { guildDiscordId: v.string(), messageContent: v.string() },
  handler: async (ctx, { guildDiscordId, messageContent }) => {
    // Get guild prefix (or default)
    const settings = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    const prefix = settings?.prefix ?? DEFAULT_PREFIX;

    // Check if message starts with this guild's prefix
    if (!messageContent.startsWith(prefix)) {
      return null;
    }

    // Extract command name
    const withoutPrefix = messageContent.slice(prefix.length).trim();
    const commandName = withoutPrefix.split(/\s+/)[0]?.toLowerCase();

    if (!commandName) {
      return null;
    }

    // Look up the command
    const command = await ctx.db
      .query("commands")
      .withIndex("by_guild_and_name", (q) =>
        q.eq("guildDiscordId", guildDiscordId).eq("name", commandName)
      )
      .first();

    if (!command || !command.enabled) {
      return null;
    }

    // Randomly select a response from the array
    const response =
      command.responses[Math.floor(Math.random() * command.responses.length)];

    return {
      name: command.name,
      response
    };
  }
});

// Get just the prefix for a guild (for the bot, no auth needed)
export const getPrefix = query({
  args: { guildDiscordId: v.string() },
  handler: async (ctx, { guildDiscordId }) => {
    const settings = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    return settings?.prefix ?? DEFAULT_PREFIX;
  }
});
