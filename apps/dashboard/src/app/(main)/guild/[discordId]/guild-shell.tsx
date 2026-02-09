"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useGuild } from "~/hooks/use-guild";
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
  const { guild } = useGuild(discordId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if guild not found or no bot
  useEffect(() => {
    if (guild === null || (guild && !guild.hasBot)) {
      router.push("/");
    }
  }, [guild, router]);

  if (guild === null || (guild && !guild.hasBot)) {
    return null;
  }

  // Loading state — skeleton matching the shell layout
  if (guild === undefined) {
    return (
      <div className="grain min-h-screen">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="bg-primary/5 absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full blur-3xl" />
          <div className="bg-primary/3 absolute right-0 -bottom-1/2 size-[600px] rounded-full blur-3xl" />
        </div>
        {/* Sidebar skeleton */}
        <aside className="bg-background border-border/50 fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-3 px-5">
              <div className="bg-secondary size-8 animate-pulse rounded-lg" />
              <div className="bg-secondary h-5 w-16 animate-pulse rounded" />
            </div>
            <div className="border-border/50 border-b px-3 py-3">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="bg-secondary size-8 animate-pulse rounded-md" />
                <div className="bg-secondary h-4 flex-1 animate-pulse rounded" />
              </div>
            </div>
            <div className="space-y-2 px-3 pt-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-secondary h-9 animate-pulse rounded-lg"
                />
              ))}
            </div>
          </div>
        </aside>
        {/* Content skeleton */}
        <div className="relative flex min-h-screen flex-col lg:pl-64">
          <div className="border-border/50 h-16 border-b" />
          <div className="mx-auto w-full max-w-6xl px-6 py-12">
            <div className="bg-secondary mb-4 h-8 w-48 animate-pulse rounded" />
            <div className="bg-secondary h-4 w-72 animate-pulse rounded" />
          </div>
        </div>
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
        <Header
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          showBranding={false}
        />

        <main className="flex-1">{children}</main>

        <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent lg:left-64" />
      </div>
    </div>
  );
}
