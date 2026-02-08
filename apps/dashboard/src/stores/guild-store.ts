import { create } from "zustand";
import type { ConvexReactClient } from "convex/react";
import { api } from "@ignite-bot/convex";

type Guild = {
  _id: string;
  discordId: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  hasBot: boolean;
};

type GuildState = {
  guilds: Record<string, Guild | null>; // null = not found
  loading: Record<string, boolean>;
  fetchGuild: (discordId: string, client: ConvexReactClient) => Promise<void>;
  invalidateGuild: (discordId: string) => void;
};

export const useGuildStore = create<GuildState>((set, get) => ({
  guilds: {},
  loading: {},

  fetchGuild: async (discordId, client) => {
    const { guilds, loading } = get();
    if (discordId in guilds || loading[discordId]) return;

    set({ loading: { ...get().loading, [discordId]: true } });

    try {
      const result = await client.query(api.guilds.getGuild, { discordId });
      set({
        guilds: { ...get().guilds, [discordId]: result ?? null },
        loading: { ...get().loading, [discordId]: false }
      });
    } catch {
      set({ loading: { ...get().loading, [discordId]: false } });
    }
  },

  invalidateGuild: (discordId) => {
    const { guilds, loading } = get();
    const { [discordId]: _, ...restGuilds } = guilds;
    const { [discordId]: __, ...restLoading } = loading;
    set({ guilds: restGuilds, loading: restLoading });
  }
}));

export function useGuild(discordId: string) {
  const guild = useGuildStore((s) => s.guilds[discordId]);
  const loading = useGuildStore((s) => s.loading[discordId] ?? false);
  const fetchGuild = useGuildStore((s) => s.fetchGuild);
  const invalidateGuild = useGuildStore((s) => s.invalidateGuild);

  // undefined if not yet in store (not fetched), null if fetched but not found
  const resolved = discordId in useGuildStore.getState().guilds ? guild : undefined;

  return {
    guild: resolved as Guild | null | undefined,
    loading,
    fetchGuild,
    invalidateGuild
  };
}
