import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

function verifyBotSecret(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${process.env.BOT_SECRET}`;
}

http.route({
  path: "/bot/guild-joined",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyBotSecret(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { discordId } = await request.json();
    const updated = await ctx.runMutation(internal.guilds.botJoinedGuild, {
      discordId,
    });
    return Response.json({ updated });
  }),
});

http.route({
  path: "/bot/guild-left",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyBotSecret(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { discordId } = await request.json();
    const updated = await ctx.runMutation(internal.guilds.botLeftGuild, {
      discordId,
    });
    return Response.json({ updated });
  }),
});

http.route({
  path: "/bot/sync-guilds",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyBotSecret(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { discordIds } = await request.json();
    const updated = await ctx.runMutation(internal.guilds.botSyncGuilds, {
      discordIds,
    });
    return Response.json({ updated });
  }),
});

http.route({
  path: "/bot/resolve-command",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyBotSecret(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { guildDiscordId, messageContent } = await request.json();

    const pluginEnabled = await ctx.runQuery(
      internal.guildSettings.isPluginEnabledQuery,
      { guildDiscordId, pluginId: "customCommands" }
    );
    if (!pluginEnabled) {
      return Response.json({ result: null });
    }

    const result = await ctx.runQuery(
      internal.guildSettings.resolveCommand,
      { guildDiscordId, messageContent }
    );
    return Response.json({ result });
  }),
});

http.route({
  path: "/bot/audit-log",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyBotSecret(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const body = await request.json();

    const pluginEnabled = await ctx.runQuery(
      internal.guildSettings.isPluginEnabledQuery,
      { guildDiscordId: body.guildDiscordId, pluginId: "auditLog" }
    );
    if (!pluginEnabled) {
      return Response.json({ success: false, reason: "plugin_disabled" });
    }

    await ctx.runMutation(internal.auditLog.create, body);
    return Response.json({ success: true });
  }),
});

http.route({
  path: "/bot/plugin-enabled",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyBotSecret(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { guildDiscordId, pluginId } = await request.json();
    const enabled = await ctx.runQuery(
      internal.guildSettings.isPluginEnabledQuery,
      { guildDiscordId, pluginId }
    );
    return Response.json({ enabled });
  }),
});

export default http;
