"use client";

import Link from "next/link";
import { Settings, ChevronRight, Sparkles, Crown } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

import { env } from "~/env";
import { getGuildIconUrl, getGuildInitials } from "~/lib/discord";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Header } from "~/components/header";

type Guild = {
  _id: string;
  discordId: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  hasBot: boolean;
};

const BOT_PERMISSIONS = "8"; // Administrator

function getBotInviteUrl(guildId: string): string {
  const params = new URLSearchParams({
    client_id: env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
    permissions: BOT_PERMISSIONS,
    scope: "bot applications.commands",
    guild_id: guildId,
    disable_guild_select: "true"
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function GuildCard({ guild, index }: { guild: Guild; index: number }) {
  const initials = getGuildInitials(guild.name);

  const staggerClass = `stagger-${Math.min(index + 1, 8)}`;
  const iconUrl = guild.icon
    ? getGuildIconUrl(guild.discordId, guild.icon)
    : null;

  const href = guild.hasBot
    ? `/guild/${guild.discordId}`
    : getBotInviteUrl(guild.discordId);

  return (
    <Link
      href={href}
      target={guild.hasBot ? undefined : "_blank"}
      rel={guild.hasBot ? undefined : "noopener noreferrer"}
      className={`group animate-fade-up relative block ${staggerClass}`}
    >
      <div
        className={`border-border/50 bg-card hover-lift hover:border-primary/30 hover:bg-card/80 relative cursor-pointer overflow-hidden rounded-2xl border p-6 transition-all duration-300 ease-out`}
      >
        <div className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-start gap-4">
          <div className="relative">
            <Avatar className="ring-border/50 group-hover:ring-primary/30 size-14 rounded-xl ring-2 transition-all duration-300">
              {iconUrl ? <AvatarImage src={iconUrl} alt={guild.name} /> : null}
              <AvatarFallback className="bg-secondary rounded-xl text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            {guild.owner && (
              <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full shadow-lg">
                <Crown className="size-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-foreground group-hover:text-primary truncate text-lg font-medium transition-colors">
              {guild.name}
            </h3>
          </div>

          <div className="flex items-center">
            {guild.hasBot ? (
              <div className="text-muted-foreground group-hover:text-primary flex items-center gap-2 transition-colors">
                <Settings className="size-4 transition-transform duration-300 group-hover:rotate-45" />
                <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20 gap-1.5"
              >
                <Sparkles className="size-3" />
                Add Bot
              </Badge>
            )}
          </div>
        </div>

        {guild.hasBot && (
          <div className="via-primary/40 absolute right-6 bottom-0 left-6 h-px bg-linear-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </div>
    </Link>
  );
}

export function Dashboard() {
  const guilds = useQuery(api.guilds.listGuilds);

  const guildsWithBot = guilds?.filter((g) => g.hasBot).length ?? 0;
  const isLoading = guilds === undefined;

  return (
    <div className="grain min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/3 absolute right-0 -bottom-1/2 size-[600px] rounded-full blur-3xl" />
      </div>

      <Header maxWidth />

      <main className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="animate-fade-up mb-12">
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            Your <span className="text-gradient">Servers</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-lg">
            Select a server to configure Ignite and manage your community.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-border/50 bg-card animate-pulse rounded-2xl border p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-secondary size-14 rounded-xl" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="bg-secondary h-5 w-2/3 rounded" />
                    <div className="bg-secondary h-4 w-1/3 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="animate-fade-up stagger-1 mb-10 flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="size-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                <span className="text-muted-foreground">
                  <span className="text-foreground font-medium">
                    {guildsWithBot}
                  </span>{" "}
                  servers with Ignite
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="bg-primary shadow-primary/50 size-2 rounded-full shadow-lg" />
                <span className="text-muted-foreground">
                  <span className="text-foreground font-medium">
                    {guilds.length}
                  </span>{" "}
                  total servers
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guilds.map((guild, index) => (
                <GuildCard key={guild._id} guild={guild} index={index} />
              ))}
            </div>

            <div className="animate-fade-up stagger-8 mt-12 text-center">
              <p className="text-muted-foreground text-sm">
                Don&apos;t see your server?{" "}
                <span className="text-primary font-medium">
                  Make sure you have Manage Server permissions
                </span>
              </p>
            </div>
          </>
        )}
      </main>

      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
