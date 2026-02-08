import { create } from "zustand";
import type { ConvexReactClient } from "convex/react";
import { api } from "@ignite-bot/convex";

type GuildPrefixState = {
  prefixes: Record<string, string>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  fetchPrefix: (discordId: string, client: ConvexReactClient) => Promise<void>;
  invalidatePrefix: (discordId: string) => void;
};

export const useGuildPrefixStore = create<GuildPrefixState>((set, get) => ({
  prefixes: {},
  loading: {},
  errors: {},

  fetchPrefix: async (discordId, client) => {
    const { prefixes, loading } = get();
    if (prefixes[discordId] !== undefined || loading[discordId]) return;

    set({
      loading: { ...get().loading, [discordId]: true },
      errors: { ...get().errors, [discordId]: null }
    });

    try {
      const settings = await client.query(api.guildSettings.get, {
        guildDiscordId: discordId
      });
      set({
        prefixes: { ...get().prefixes, [discordId]: settings.prefix },
        loading: { ...get().loading, [discordId]: false }
      });
    } catch (err) {
      set({
        loading: { ...get().loading, [discordId]: false },
        errors: {
          ...get().errors,
          [discordId]:
            err instanceof Error ? err.message : "Failed to fetch prefix"
        }
      });
    }
  },

  invalidatePrefix: (discordId) => {
    const { prefixes, loading, errors } = get();
    const { [discordId]: _, ...rest } = prefixes;
    const { [discordId]: __, ...restLoading } = loading;
    const { [discordId]: ___, ...restErrors } = errors;
    set({ prefixes: rest, loading: restLoading, errors: restErrors });
  }
}));

export function useGuildPrefix(discordId: string) {
  const prefix = useGuildPrefixStore((s) => s.prefixes[discordId]);
  const loading = useGuildPrefixStore((s) => s.loading[discordId] ?? false);
  const error = useGuildPrefixStore((s) => s.errors[discordId] ?? null);
  const fetchPrefix = useGuildPrefixStore((s) => s.fetchPrefix);
  const invalidatePrefix = useGuildPrefixStore((s) => s.invalidatePrefix);

  return {
    prefix: prefix ?? "!",
    loading,
    error,
    fetchPrefix,
    invalidatePrefix
  };
}
