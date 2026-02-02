import { convexAuth } from "@convex-dev/auth/server";
import Discord from "@auth/core/providers/discord";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Discord({
      authorization: {
        params: {
          scope: "identify guilds"
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          username: profile.username,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.webp`
            : undefined,
          email: profile.email ?? undefined
        };
      }
    })
  ]
});
