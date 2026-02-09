"use client";

import Link from "next/link";
import {
  Crown,
  Settings,
  MessageSquare,
  Terminal,
  Activity,
  Clock,
  ChevronRight,
  Circle
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

import { useGuild } from "~/hooks/use-guild";
import { useGuildPrefix } from "~/hooks/use-guild-prefix";
import { getGuildIconUrl, getGuildInitials } from "~/lib/discord";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function GuildPage({ discordId }: { discordId: string }) {
  const { guild } = useGuild(discordId);
  const { prefix, loading: prefixLoading } = useGuildPrefix(discordId);
  const commands = useQuery(api.commands.list, { guildDiscordId: discordId });

  if (!guild) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12 flex items-center gap-6">
          <div className="bg-secondary size-20 animate-pulse rounded-2xl" />
          <div className="space-y-3">
            <div className="bg-secondary h-8 w-48 animate-pulse rounded-lg" />
            <div className="bg-secondary h-4 w-32 animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border-border/50 bg-card h-28 animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      </div>
    );
  }

  const guildInitials = getGuildInitials(guild.name);
  const guildIconUrl = guild.icon
    ? getGuildIconUrl(guild.discordId, guild.icon)
    : null;

  const totalCommands = commands?.length ?? 0;
  const enabledCommands = commands?.filter((c) => c.enabled).length ?? 0;
  const lastUpdated = commands?.length
    ? Math.max(...commands.map((c) => c.updatedAt))
    : null;
  const recentCommands = commands
    ? [...commands].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Guild header */}
      <div className="animate-fade-up mb-12 flex items-center gap-6">
        <div className="relative">
          <Avatar className="ring-border/50 size-20 rounded-2xl ring-2">
            {guildIconUrl ? (
              <AvatarImage src={guildIconUrl} alt={guild.name} />
            ) : null}
            <AvatarFallback className="bg-secondary rounded-2xl text-2xl font-medium">
              {guildInitials}
            </AvatarFallback>
          </Avatar>
          {guild.owner && (
            <div className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full shadow-lg">
              <Crown className="size-4" />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            {guild.name}
          </h1>
          <p className="text-muted-foreground mt-1">Server Overview</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="animate-fade-up stagger-1 mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border/50 bg-card rounded-2xl border p-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 text-primary flex size-10 items-center justify-center rounded-xl">
              <Terminal className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Total Commands
              </p>
              <p className="text-foreground text-2xl font-semibold">
                {commands ? totalCommands : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-border/50 bg-card rounded-2xl border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
              <Activity className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Active Commands
              </p>
              <p className="text-foreground text-2xl font-semibold">
                {commands ? enabledCommands : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-border/50 bg-card rounded-2xl border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-500">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Prefix
              </p>
              <p className="text-foreground text-2xl font-semibold">
                {prefixLoading ? "—" : prefix}
              </p>
            </div>
          </div>
        </div>

        <div className="border-border/50 bg-card rounded-2xl border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Last Updated
              </p>
              <p className="text-foreground text-2xl font-semibold">
                {lastUpdated ? formatRelativeTime(lastUpdated) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-up stagger-2 mb-8 grid gap-4 sm:grid-cols-2">
        <Link href={`/guild/${discordId}/commands`}>
          <div className="border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300">
            <div className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="bg-primary/20 text-primary flex size-12 items-center justify-center rounded-xl">
                <MessageSquare className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-lg font-medium">
                  Custom Commands
                </h3>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Create and manage commands for your server
                </p>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
            </div>
          </div>
        </Link>

        <Link href={`/guild/${discordId}/settings`}>
          <div className="border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300">
            <div className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-500">
                <Settings className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground text-lg font-medium">
                  Server Settings
                </h3>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Configure prefix and bot settings
                </p>
              </div>
              <ChevronRight className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Commands */}
      <div className="animate-fade-up stagger-3">
        <h2 className="mb-4 text-lg font-medium">Recent Commands</h2>

        {!commands ? (
          <div className="border-border/50 bg-card space-y-1 rounded-2xl border p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-secondary h-12 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : recentCommands && recentCommands.length > 0 ? (
          <div className="border-border/50 bg-card rounded-2xl border p-2">
            {recentCommands.map((cmd) => (
              <Link
                key={cmd._id}
                href={`/guild/${discordId}/commands/${cmd._id}`}
                className="hover:bg-secondary/50 flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
              >
                <Circle
                  className={`size-2 shrink-0 ${cmd.enabled ? "fill-emerald-500 text-emerald-500" : "fill-muted text-muted"}`}
                />
                <code className="text-foreground text-sm font-medium">
                  {prefix}
                  {cmd.name}
                </code>
                <span className="text-muted-foreground ml-auto text-xs">
                  {formatRelativeTime(cmd.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-border/50 bg-card rounded-2xl border p-8 text-center">
            <MessageSquare className="text-muted-foreground/50 mx-auto mb-3 size-8" />
            <p className="text-muted-foreground text-sm">No commands yet</p>
            <Link
              href={`/guild/${discordId}/commands`}
              className="text-primary mt-2 inline-block text-sm hover:underline"
            >
              Create your first command
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
