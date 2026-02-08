import { create } from "zustand";
import type { ConvexReactClient } from "convex/react";
import { api } from "@ignite-bot/convex";

type GuildPrefixState = {
  prefixes: Record<string, string>;
  loading: Record<string, boolean>;
  fetchPrefix: (
    discordId: string,
    client: ConvexReactClient
  ) => Promise<void>;
  invalidatePrefix: (discordId: string) => void;
};

export const useGuildPrefixStore = create<GuildPrefixState>((set, get) => ({
  prefixes: {},
  loading: {},

  fetchPrefix: async (discordId, client) => {
    const { prefixes, loading } = get();
    if (prefixes[discordId] !== undefined || loading[discordId]) return;

    set({ loading: { ...get().loading, [discordId]: true } });

    try {
      const settings = await client.query(api.guildSettings.get, {
        guildDiscordId: discordId
      });
      set({
        prefixes: { ...get().prefixes, [discordId]: settings.prefix },
        loading: { ...get().loading, [discordId]: false }
      });
    } catch {
      set({ loading: { ...get().loading, [discordId]: false } });
    }
  },

  invalidatePrefix: (discordId) => {
    const { prefixes, loading } = get();
    const { [discordId]: _, ...rest } = prefixes;
    const { [discordId]: __, ...restLoading } = loading;
    set({ prefixes: rest, loading: restLoading });
  }
}));

export function useGuildPrefix(discordId: string) {
  const prefix = useGuildPrefixStore((s) => s.prefixes[discordId]);
  const loading = useGuildPrefixStore((s) => s.loading[discordId] ?? false);
  const fetchPrefix = useGuildPrefixStore((s) => s.fetchPrefix);
  const invalidatePrefix = useGuildPrefixStore((s) => s.invalidatePrefix);

  return { prefix: prefix ?? "!", loading, fetchPrefix, invalidatePrefix };
}
