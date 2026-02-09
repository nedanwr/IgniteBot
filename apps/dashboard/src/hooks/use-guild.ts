"use client";

import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

export function useGuild(discordId: string) {
  const guild = useQuery(api.guilds.getGuild, { discordId });

  return {
    guild,
    loading: guild === undefined
  };
}
