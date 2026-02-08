"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";

import { useCurrentUser } from "~/stores/current-user-store";
import { useGuild } from "~/stores/guild-store";
import { Header } from "~/components/header";
import { GuildSidebar } from "~/components/guild-sidebar";

export function GuildShell({
  discordId,
  children
}: {
  discordId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const convex = useConvex();
  const { fetchUser } = useCurrentUser();
  const { guild, fetchGuild } = useGuild(discordId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    void fetchUser(convex);
    void fetchGuild(discordId, convex);
  }, [convex, fetchUser, fetchGuild, discordId]);

  // Redirect if guild not found or no bot
  useEffect(() => {
    if (guild === null || (guild && !guild.hasBot)) {
      router.push("/");
    }
  }, [guild, router]);

  if (guild === null || (guild && !guild.hasBot)) {
    return null;
  }

  // Loading state
  if (guild === undefined) {
    return (
      <div className="grain flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="grain min-h-screen">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/3 absolute right-0 -bottom-1/2 size-[600px] rounded-full blur-3xl" />
      </div>

      <GuildSidebar
        discordId={discordId}
        guild={{ name: guild.name, icon: guild.icon }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content area — pushed right on desktop by sidebar width */}
      <div className="relative flex min-h-screen flex-col lg:pl-64">
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} showBranding={false} />

        <main className="flex-1">
          {children}
        </main>

        <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent lg:left-64" />
      </div>
    </div>
  );
}
