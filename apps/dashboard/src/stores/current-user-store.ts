import { create } from "zustand";
import type { ConvexReactClient } from "convex/react";
import { api } from "@ignite-bot/convex";

type User = {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
  email?: string;
};

type CurrentUserState = {
  user: User | null | undefined; // undefined = not fetched, null = not authed
  loading: boolean;
  error: string | null;
  fetchUser: (client: ConvexReactClient) => Promise<void>;
  clearUser: () => void;
};

export const useCurrentUserStore = create<CurrentUserState>((set, get) => ({
  user: undefined,
  loading: false,
  error: null,

  fetchUser: async (client) => {
    const { user, loading } = get();
    if (user !== undefined || loading) return;

    set({ loading: true, error: null });

    try {
      const result = await client.query(api.users.currentUser, {});
      set({ user: result ?? null, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch user"
      });
    }
  },

  clearUser: () => {
    set({ user: undefined, loading: false, error: null });
  }
}));

export function useCurrentUser() {
  const user = useCurrentUserStore((s) => s.user);
  const loading = useCurrentUserStore((s) => s.loading);
  const error = useCurrentUserStore((s) => s.error);
  const fetchUser = useCurrentUserStore((s) => s.fetchUser);

  const displayName = user?.name ?? user?.username ?? "User";
  const userInitials = displayName[0]?.toUpperCase() ?? "U";

  return { user, loading, error, fetchUser, displayName, userInitials };
}
