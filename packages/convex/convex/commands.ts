import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

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

export const list = query({
  args: { guildDiscordId: v.string() },
  handler: async (ctx, { guildDiscordId }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    return await ctx.db
      .query("commands")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .collect();
  }
});

export const get = query({
  args: { id: v.id("commands") },
  handler: async (ctx, { id }) => {
    const command = await ctx.db.get(id);
    if (!command) return null;

    await verifyGuildAccess(ctx, command.guildDiscordId);
    return command;
  }
});

export const create = mutation({
  args: {
    guildDiscordId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    response: v.string()
  },
  handler: async (ctx, { guildDiscordId, name, description, response }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    // Check if command with same name already exists
    const existing = await ctx.db
      .query("commands")
      .withIndex("by_guild_and_name", (q) =>
        q.eq("guildDiscordId", guildDiscordId).eq("name", name.toLowerCase())
      )
      .first();

    if (existing) {
      throw new Error(`Command "${name}" already exists`);
    }

    const now = Date.now();

    return await ctx.db.insert("commands", {
      guildDiscordId,
      name: name.toLowerCase(),
      description,
      response,
      enabled: true,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const update = mutation({
  args: {
    id: v.id("commands"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    response: v.optional(v.string()),
    enabled: v.optional(v.boolean())
  },
  handler: async (ctx, { id, name, description, response, enabled }) => {
    const command = await ctx.db.get(id);
    if (!command) {
      throw new Error("Command not found");
    }

    await verifyGuildAccess(ctx, command.guildDiscordId);

    // If name is being changed, check for conflicts
    if (name && name.toLowerCase() !== command.name) {
      const existing = await ctx.db
        .query("commands")
        .withIndex("by_guild_and_name", (q) =>
          q
            .eq("guildDiscordId", command.guildDiscordId)
            .eq("name", name.toLowerCase())
        )
        .first();

      if (existing) {
        throw new Error(`Command "${name}" already exists`);
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now()
    };

    if (name !== undefined) updates.name = name.toLowerCase();
    if (description !== undefined) updates.description = description;
    if (response !== undefined) updates.response = response;
    if (enabled !== undefined) updates.enabled = enabled;

    await ctx.db.patch(id, updates);
  }
});

export const remove = mutation({
  args: { id: v.id("commands") },
  handler: async (ctx, { id }) => {
    const command = await ctx.db.get(id);
    if (!command) {
      throw new Error("Command not found");
    }

    await verifyGuildAccess(ctx, command.guildDiscordId);

    await ctx.db.delete(id);
  }
});

// For the bot to fetch commands
export const getByGuildAndName = query({
  args: { guildDiscordId: v.string(), name: v.string() },
  handler: async (ctx, { guildDiscordId, name }) => {
    return await ctx.db
      .query("commands")
      .withIndex("by_guild_and_name", (q) =>
        q.eq("guildDiscordId", guildDiscordId).eq("name", name.toLowerCase())
      )
      .first();
  }
});

// For the bot to fetch all enabled commands for a guild
export const listEnabled = query({
  args: { guildDiscordId: v.string() },
  handler: async (ctx, { guildDiscordId }) => {
    const commands = await ctx.db
      .query("commands")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .collect();

    return commands.filter((c) => c.enabled);
  }
});
