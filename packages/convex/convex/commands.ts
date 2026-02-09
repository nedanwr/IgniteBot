import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyGuildAccess } from "./lib/access";
import { responseValidator } from "./schema";
import { logAudit } from "./auditLog";
import { auth } from "./auth";

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

    const commandId = await ctx.db.insert("commands", {
      guildDiscordId,
      name: name.toLowerCase(),
      description,
      responses,
      enabled: true,
      createdAt: now,
      updatedAt: now
    });

    const userId = await auth.getUserId(ctx);
    await logAudit(ctx, {
      guildDiscordId,
      action: "command.created",
      source: "dashboard",
      actorId: userId!.toString(),
      targetType: "command",
      targetId: commandId,
      targetName: name.toLowerCase()
    });

    return commandId;
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

    const changes: Record<string, unknown> = {};
    if (name !== undefined && name.toLowerCase() !== command.name)
      changes.name = { from: command.name, to: name.toLowerCase() };
    if (enabled !== undefined && enabled !== command.enabled)
      changes.enabled = { from: command.enabled, to: enabled };
    if (description !== undefined && description !== command.description)
      changes.description = { from: command.description, to: description };
    if (responses !== undefined) changes.responses = "updated";

    const userId = await auth.getUserId(ctx);
    await logAudit(ctx, {
      guildDiscordId: command.guildDiscordId,
      action: "command.updated",
      source: "dashboard",
      actorId: userId!.toString(),
      targetType: "command",
      targetId: id,
      targetName: command.name,
      metadata: changes
    });
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

    const userId = await auth.getUserId(ctx);
    await logAudit(ctx, {
      guildDiscordId: command.guildDiscordId,
      action: "command.deleted",
      source: "dashboard",
      actorId: userId!.toString(),
      targetType: "command",
      targetId: id,
      targetName: command.name
    });

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
    return await ctx.db
      .query("commands")
      .withIndex("by_guild_and_enabled", (q) =>
        q.eq("guildDiscordId", guildDiscordId).eq("enabled", true)
      )
      .collect();
  }
});
