"use client";

import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

export function useGuildPrefix(discordId: string) {
  const settings = useQuery(api.guildSettings.get, {
    guildDiscordId: discordId
  });

  return {
    prefix: settings?.prefix ?? "!",
    loading: settings === undefined
  };
}
