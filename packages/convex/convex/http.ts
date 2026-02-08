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

export default http;
