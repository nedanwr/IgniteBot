"use client";

import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

export function useCurrentUser() {
  const user = useQuery(api.users.currentUser);

  const displayName = user?.name ?? user?.username ?? "User";
  const userInitials = displayName[0]?.toUpperCase() ?? "U";

  return {
    user,
    loading: user === undefined,
    displayName,
    userInitials
  };
}
