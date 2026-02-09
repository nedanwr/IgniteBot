import { v, type GenericId } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx
} from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { decryptToken, encryptToken, isEncrypted } from "./lib/crypto";

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

function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false; // If no expiry info, assume valid
  // Add 60s buffer so we refresh before actual expiry
  return Date.now() / 1000 >= expiresAt - 60;
}

function getEncryptionKey(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  return key;
}

async function refreshDiscordToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.AUTH_DISCORD_ID;
  const clientSecret = process.env.AUTH_DISCORD_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Discord OAuth credentials not configured");
  }

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

async function fetchAndSyncGuilds(ctx: ActionCtx, userId: GenericId<"users">) {
  const user = await ctx.runQuery(internal.guilds.getUser, { userId });
  if (!user?.accessToken) {
    throw new Error("No access token found");
  }

  const encryptionKey = getEncryptionKey();
  let accessToken = await decryptToken(user.accessToken, encryptionKey);
  let needsEncryption = !isEncrypted(user.accessToken);

  // Refresh token if expired
  if (isTokenExpired(user.expiresAt) && user.refreshToken) {
    const plainRefreshToken = await decryptToken(
      user.refreshToken,
      encryptionKey
    );
    const tokens = await refreshDiscordToken(plainRefreshToken);
    accessToken = tokens.access_token;

    // Encrypt new tokens before storing
    const encryptedAccess = await encryptToken(
      tokens.access_token,
      encryptionKey
    );
    const encryptedRefresh = await encryptToken(
      tokens.refresh_token,
      encryptionKey
    );

    await ctx.runMutation(internal.guilds.updateUserTokens, {
      userId,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      expiresIn: tokens.expires_in,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in
    });

    needsEncryption = false;
  }

  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guilds: ${response.status}`);
  }

  const allGuilds: DiscordGuild[] = await response.json();

  // Lazy migration: encrypt plaintext tokens after successful API call
  if (needsEncryption) {
    const encryptedAccess = await encryptToken(accessToken, encryptionKey);
    const encryptedRefresh = user.refreshToken
      ? await encryptToken(
          await decryptToken(user.refreshToken, encryptionKey),
          encryptionKey
        )
      : undefined;

    await ctx.runMutation(internal.guilds.updateUserTokens, {
      userId,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh ?? user.refreshToken ?? "",
      expiresIn: user.expiresIn ?? 0,
      expiresAt: user.expiresAt ?? 0
    });
  }

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

// Called after OAuth to encrypt tokens immediately, then fetch guilds
export const encryptAndFetchGuilds = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.runQuery(internal.guilds.getUser, { userId });
    if (!user?.accessToken) {
      throw new Error("No access token found");
    }

    const encryptionKey = getEncryptionKey();

    // Encrypt tokens if they are still plaintext
    if (!isEncrypted(user.accessToken)) {
      const encryptedAccess = await encryptToken(
        user.accessToken,
        encryptionKey
      );
      const encryptedRefresh = user.refreshToken
        ? await encryptToken(user.refreshToken, encryptionKey)
        : "";

      await ctx.runMutation(internal.guilds.updateUserTokens, {
        userId,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresIn: user.expiresIn ?? 0,
        expiresAt: user.expiresAt ?? 0
      });
    }

    return await fetchAndSyncGuilds(ctx, userId);
  }
});

// Called automatically after user authentication (kept for backward compat)
export const fetchGuildsInternal = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await fetchAndSyncGuilds(ctx, userId);
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
    return await fetchAndSyncGuilds(ctx, userId);
  }
});

export const getUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  }
});

export const updateUserTokens = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.float64(),
    expiresAt: v.float64()
  },
  handler: async (
    ctx,
    { userId, accessToken, refreshToken, expiresIn, expiresAt }
  ) => {
    await ctx.db.patch(userId, {
      accessToken,
      refreshToken,
      expiresIn,
      expiresAt
    });
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

    const existingByDiscordId = new Map(
      existingGuilds.map((g) => [g.discordId, g])
    );
    const incomingDiscordIds = new Set(guilds.map((g) => g.discordId));

    // Remove guilds the user no longer has access to
    for (const existing of existingGuilds) {
      if (!incomingDiscordIds.has(existing.discordId)) {
        await ctx.db.delete(existing._id);
      }
    }

    // Add or update guilds
    for (const guild of guilds) {
      const existing = existingByDiscordId.get(guild.discordId);
      if (existing) {
        // Update if name, icon, owner, or permissions changed
        if (
          existing.name !== guild.name ||
          existing.icon !== (guild.icon ?? undefined) ||
          existing.owner !== guild.owner ||
          existing.permissions !== guild.permissions
        ) {
          await ctx.db.patch(existing._id, {
            name: guild.name,
            icon: guild.icon ?? undefined,
            owner: guild.owner,
            permissions: guild.permissions
          });
        }
      } else {
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
