import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Command response - content can be text or URL
export const responseValidator = v.object({
  content: v.string()
});

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    // Discord OAuth tokens
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresIn: v.optional(v.float64()),
    expiresAt: v.optional(v.float64())
  })
    .index("email", ["email"])
    .index("by_username", ["username"]),

  guilds: defineTable({
    discordId: v.string(),
    name: v.string(),
    icon: v.optional(v.string()),
    owner: v.boolean(),
    permissions: v.string(),
    hasBot: v.boolean(),
    // Users who have access to this guild
    userId: v.id("users")
  })
    .index("by_user", ["userId"])
    .index("by_discord_id", ["discordId"])
    .index("by_user_and_discord", ["userId", "discordId"]),

  commands: defineTable({
    guildDiscordId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    responses: v.array(responseValidator),
    enabled: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64()
  })
    .index("by_guild", ["guildDiscordId"])
    .index("by_guild_and_name", ["guildDiscordId", "name"])
    .index("by_guild_and_enabled", ["guildDiscordId", "enabled"]),

  guildSettings: defineTable({
    guildDiscordId: v.string(),
    prefix: v.string(),
    enabledPlugins: v.optional(v.array(v.string()))
  }).index("by_guild", ["guildDiscordId"]),

  auditLog: defineTable({
    guildDiscordId: v.string(),
    action: v.string(),
    source: v.string(),
    actorId: v.string(),
    actorName: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    targetName: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.float64()
  })
    .index("by_guild", ["guildDiscordId"])
    .index("by_guild_and_timestamp", ["guildDiscordId", "timestamp"])
});
