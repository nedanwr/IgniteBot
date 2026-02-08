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
  errors: Record<string, string | null>;
  fetchGuild: (discordId: string, client: ConvexReactClient) => Promise<void>;
  invalidateGuild: (discordId: string) => void;
};

export const useGuildStore = create<GuildState>((set, get) => ({
  guilds: {},
  loading: {},
  errors: {},

  fetchGuild: async (discordId, client) => {
    const { guilds, loading } = get();
    if (discordId in guilds || loading[discordId]) return;

    set({
      loading: { ...get().loading, [discordId]: true },
      errors: { ...get().errors, [discordId]: null }
    });

    try {
      const result = await client.query(api.guilds.getGuild, { discordId });
      set({
        guilds: { ...get().guilds, [discordId]: result ?? null },
        loading: { ...get().loading, [discordId]: false }
      });
    } catch (err) {
      set({
        loading: { ...get().loading, [discordId]: false },
        errors: {
          ...get().errors,
          [discordId]:
            err instanceof Error ? err.message : "Failed to fetch guild"
        }
      });
    }
  },

  invalidateGuild: (discordId) => {
    const { guilds, loading, errors } = get();
    const { [discordId]: _, ...restGuilds } = guilds;
    const { [discordId]: __, ...restLoading } = loading;
    const { [discordId]: ___, ...restErrors } = errors;
    set({ guilds: restGuilds, loading: restLoading, errors: restErrors });
  }
}));

export function useGuild(discordId: string) {
  const fetched = useGuildStore((s) => discordId in s.guilds);
  const guild = useGuildStore((s) => s.guilds[discordId]);
  const loading = useGuildStore((s) => s.loading[discordId] ?? false);
  const error = useGuildStore((s) => s.errors[discordId] ?? null);
  const fetchGuild = useGuildStore((s) => s.fetchGuild);
  const invalidateGuild = useGuildStore((s) => s.invalidateGuild);

  return {
    // undefined if not yet in store (not fetched), null if fetched but not found
    guild: fetched ? (guild as Guild | null) : undefined,
    loading,
    error,
    fetchGuild,
    invalidateGuild
  };
}
