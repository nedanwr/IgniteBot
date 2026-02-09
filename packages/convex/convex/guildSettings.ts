import { v } from "convex/values";

import { internalQuery, mutation, query } from "./_generated/server";
import { verifyGuildAccess } from "./lib/access";
import { logAudit } from "./auditLog";
import { auth } from "./auth";
import { PLUGIN_IDS, isPluginEnabled } from "./lib/plugins";

const DEFAULT_PREFIX = "!";

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

    const trimmed = prefix.trim();
    if (!trimmed || trimmed.length > 5) {
      throw new Error("Prefix must be 1-5 non-whitespace characters");
    }

    const existing = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    const oldPrefix = existing?.prefix ?? DEFAULT_PREFIX;

    if (existing) {
      await ctx.db.patch(existing._id, { prefix: trimmed });
    } else {
      await ctx.db.insert("guildSettings", { guildDiscordId, prefix: trimmed });
    }

    const userId = await auth.getUserId(ctx);
    await logAudit(ctx, {
      guildDiscordId,
      action: "guild.prefix_updated",
      source: "dashboard",
      actorId: userId!.toString(),
      targetType: "guild",
      metadata: { from: oldPrefix, to: trimmed }
    });
  }
});

// For the bot - resolves a command from message content
// Returns the command if found, null otherwise
export const resolveCommand = internalQuery({
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

// Get just the prefix for a guild (internal only)
export const getPrefix = internalQuery({
  args: { guildDiscordId: v.string() },
  handler: async (ctx, { guildDiscordId }) => {
    const settings = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    return settings?.prefix ?? DEFAULT_PREFIX;
  }
});

export const enablePlugin = mutation({
  args: { guildDiscordId: v.string(), pluginId: v.string() },
  handler: async (ctx, { guildDiscordId, pluginId }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    if (!PLUGIN_IDS.includes(pluginId as (typeof PLUGIN_IDS)[number])) {
      throw new Error(`Unknown plugin: ${pluginId}`);
    }

    const existing = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    if (existing) {
      const current = existing.enabledPlugins ?? [...PLUGIN_IDS];
      if (!current.includes(pluginId)) {
        await ctx.db.patch(existing._id, {
          enabledPlugins: [...current, pluginId]
        });
      }
    } else {
      await ctx.db.insert("guildSettings", {
        guildDiscordId,
        prefix: DEFAULT_PREFIX,
        enabledPlugins: [...PLUGIN_IDS]
      });
    }

    const userId = await auth.getUserId(ctx);
    await logAudit(ctx, {
      guildDiscordId,
      action: "plugin.enabled",
      source: "dashboard",
      actorId: userId!.toString(),
      targetType: "plugin",
      targetName: pluginId
    });
  }
});

export const disablePlugin = mutation({
  args: { guildDiscordId: v.string(), pluginId: v.string() },
  handler: async (ctx, { guildDiscordId, pluginId }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    if (!PLUGIN_IDS.includes(pluginId as (typeof PLUGIN_IDS)[number])) {
      throw new Error(`Unknown plugin: ${pluginId}`);
    }

    const existing = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    if (existing) {
      const current = existing.enabledPlugins ?? [...PLUGIN_IDS];
      await ctx.db.patch(existing._id, {
        enabledPlugins: current.filter((id) => id !== pluginId)
      });
    } else {
      await ctx.db.insert("guildSettings", {
        guildDiscordId,
        prefix: DEFAULT_PREFIX,
        enabledPlugins: PLUGIN_IDS.filter((id) => id !== pluginId)
      });
    }

    const userId = await auth.getUserId(ctx);
    await logAudit(ctx, {
      guildDiscordId,
      action: "plugin.disabled",
      source: "dashboard",
      actorId: userId!.toString(),
      targetType: "plugin",
      targetName: pluginId
    });
  }
});

// Check if a specific plugin is enabled (internal, for bot HTTP endpoints)
export const isPluginEnabledQuery = internalQuery({
  args: { guildDiscordId: v.string(), pluginId: v.string() },
  handler: async (ctx, { guildDiscordId, pluginId }) => {
    const settings = await ctx.db
      .query("guildSettings")
      .withIndex("by_guild", (q) => q.eq("guildDiscordId", guildDiscordId))
      .first();

    return isPluginEnabled(
      settings?.enabledPlugins,
      pluginId as (typeof PLUGIN_IDS)[number]
    );
  }
});
