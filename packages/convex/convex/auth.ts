import { convexAuth } from "@convex-dev/auth/server";
import Discord from "@auth/core/providers/discord";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Discord({
      authorization:
        "https://discord.com/oauth2/authorize?scope=identify+guilds+email",
      profile(profile, tokens) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          username: profile.username,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.webp`
            : undefined,
          email: profile.email ?? undefined,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
          expiresAt: tokens.expires_at
        };
      }
    })
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      await ctx.scheduler.runAfter(0, internal.guilds.encryptAndFetchGuilds, {
        userId
      });
    }
  }
});
