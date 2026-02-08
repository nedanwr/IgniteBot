import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query
} from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string | number;
}

// MANAGE_GUILD permission bit
const MANAGE_GUILD = 0x20n;

function canManageGuild(permissions: string | number): boolean {
  return (BigInt(permissions) & MANAGE_GUILD) === MANAGE_GUILD;
}

async function fetchAndSyncGuilds(
  ctx: {
    runQuery: typeof action.prototype;
    runMutation: typeof action.prototype;
  },
  userId: string
) {
  const user = await ctx.runQuery(internal.guilds.getUser, { userId });
  if (!user?.accessToken) {
    throw new Error("No access token found");
  }

  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${user.accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guilds: ${response.status}`);
  }

  const allGuilds: DiscordGuild[] = await response.json();

  // Only keep guilds where user has MANAGE_GUILD permission
  const manageableGuilds = allGuilds.filter(
    (g) => g.owner || canManageGuild(g.permissions)
  );

  await ctx.runMutation(internal.guilds.syncGuilds, {
    userId,
    guilds: manageableGuilds.map((g) => ({
      discordId: g.id,
      name: g.name,
      icon: g.icon,
      owner: g.owner,
      permissions: String(g.permissions)
    }))
  });

  return manageableGuilds.length;
}

// Called automatically after user authentication
export const fetchGuildsInternal = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await fetchAndSyncGuilds(ctx as any, userId);
  }
});

// Can be called manually by the user
export const fetchGuilds = action({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await fetchAndSyncGuilds(ctx as any, userId);
  }
});

export const getUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  }
});

export const syncGuilds = internalMutation({
  args: {
    userId: v.id("users"),
    guilds: v.array(
      v.object({
        discordId: v.string(),
        name: v.string(),
        icon: v.union(v.string(), v.null()),
        owner: v.boolean(),
        permissions: v.string()
      })
    )
  },
  handler: async (ctx, { userId, guilds }) => {
    const existingGuilds = await ctx.db
      .query("guilds")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const existingDiscordIds = new Set(existingGuilds.map((g) => g.discordId));
    const incomingDiscordIds = new Set(guilds.map((g) => g.discordId));

    // Remove guilds the user no longer has access to
    for (const existing of existingGuilds) {
      if (!incomingDiscordIds.has(existing.discordId)) {
        await ctx.db.delete(existing._id);
      }
    }

    // Add new guilds
    for (const guild of guilds) {
      if (!existingDiscordIds.has(guild.discordId)) {
        await ctx.db.insert("guilds", {
          discordId: guild.discordId,
          name: guild.name,
          icon: guild.icon ?? undefined,
          owner: guild.owner,
          permissions: guild.permissions,
          hasBot: false,
          userId
        });
      }
    }
  }
});

export const listGuilds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("guilds")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  }
});

export const getGuild = query({
  args: { discordId: v.string() },
  handler: async (ctx, { discordId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("guilds")
      .withIndex("by_user_and_discord", (q) =>
        q.eq("userId", userId).eq("discordId", discordId)
      )
      .first();
  }
});

// Bot mutations - called when the bot joins/leaves a guild
export const botJoinedGuild = internalMutation({
  args: { discordId: v.string() },
  handler: async (ctx, { discordId }) => {
    const guilds = await ctx.db
      .query("guilds")
      .withIndex("by_discord_id", (q) => q.eq("discordId", discordId))
      .collect();

    for (const guild of guilds) {
      await ctx.db.patch(guild._id, { hasBot: true });
    }

    return guilds.length;
  }
});

export const botLeftGuild = internalMutation({
  args: { discordId: v.string() },
  handler: async (ctx, { discordId }) => {
    const guilds = await ctx.db
      .query("guilds")
      .withIndex("by_discord_id", (q) => q.eq("discordId", discordId))
      .collect();

    for (const guild of guilds) {
      await ctx.db.patch(guild._id, { hasBot: false });
    }

    return guilds.length;
  }
});

// Sync all guilds the bot is currently in (called on bot startup)
export const botSyncGuilds = internalMutation({
  args: { discordIds: v.array(v.string()) },
  handler: async (ctx, { discordIds }) => {
    const botGuildIds = new Set(discordIds);

    // Get all guilds in the database
    const allGuilds = await ctx.db.query("guilds").collect();

    let updated = 0;
    for (const guild of allGuilds) {
      const shouldHaveBot = botGuildIds.has(guild.discordId);
      if (guild.hasBot !== shouldHaveBot) {
        await ctx.db.patch(guild._id, { hasBot: shouldHaveBot });
        updated++;
      }
    }

    return updated;
  }
});
