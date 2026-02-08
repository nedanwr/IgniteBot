import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyGuildAccess } from "./lib/access";

// Response validator matching schema
const responseValidator = v.object({
  content: v.string()
});

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
    responses: v.array(responseValidator)
  },
  handler: async (ctx, { guildDiscordId, name, description, responses }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    if (responses.length === 0) {
      throw new Error("At least one response is required");
    }

    // Validate each response has content
    for (const response of responses) {
      if (!response.content.trim()) {
        throw new Error("Each response must have content");
      }
    }

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
      responses,
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
    responses: v.optional(v.array(responseValidator)),
    enabled: v.optional(v.boolean())
  },
  handler: async (ctx, { id, name, description, responses, enabled }) => {
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

    if (responses !== undefined) {
      if (responses.length === 0) {
        throw new Error("At least one response is required");
      }

      // Validate each response has content
      for (const response of responses) {
        if (!response.content.trim()) {
          throw new Error("Each response must have content");
        }
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now()
    };

    if (name !== undefined) updates.name = name.toLowerCase();
    if (description !== undefined) updates.description = description;
    if (responses !== undefined) updates.responses = responses;
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
