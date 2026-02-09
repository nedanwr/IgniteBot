import { v } from "convex/values";

import { internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { verifyGuildAccess } from "./lib/access";

export type AuditLogParams = {
  guildDiscordId: string;
  action: string;
  source: "dashboard" | "bot";
  actorId: string;
  actorName?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(ctx: MutationCtx, params: AuditLogParams) {
  await ctx.db.insert("auditLog", {
    guildDiscordId: params.guildDiscordId,
    action: params.action,
    source: params.source,
    actorId: params.actorId,
    actorName: params.actorName,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName,
    metadata: params.metadata,
    timestamp: Date.now()
  });
}

export const create = internalMutation({
  args: {
    guildDiscordId: v.string(),
    action: v.string(),
    source: v.string(),
    actorId: v.string(),
    actorName: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLog", {
      ...args,
      timestamp: Date.now()
    });
  }
});

export const list = query({
  args: {
    guildDiscordId: v.string(),
    limit: v.optional(v.float64())
  },
  handler: async (ctx, { guildDiscordId, limit }) => {
    await verifyGuildAccess(ctx, guildDiscordId);

    const pageSize = limit ?? 50;

    return await ctx.db
      .query("auditLog")
      .withIndex("by_guild_and_timestamp", (q) =>
        q.eq("guildDiscordId", guildDiscordId)
      )
      .order("desc")
      .take(pageSize);
  }
});
