"use client";

import Link from "next/link";
import {
  Crown,
  MessageSquare,
  Terminal,
  Activity,
  Clock,
  ScrollText,
  Monitor,
  Bot,
  Hash,
  Shield,
  Server,
  Puzzle
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

import { useGuild } from "~/hooks/use-guild";
import { useGuildPrefix } from "~/hooks/use-guild-prefix";
import { Badge } from "~/components/ui/badge";
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

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "command.created": "Created command",
  "command.updated": "Updated command",
  "command.deleted": "Deleted command",
  "guild.prefix_updated": "Changed prefix",
  "guild.updated": "Guild updated",
  "guild.bot_joined": "Bot joined",
  "guild.bot_left": "Bot left",
  "channel.created": "Channel created",
  "channel.updated": "Channel updated",
  "channel.deleted": "Channel deleted",
  "role.created": "Role created",
  "role.updated": "Role updated",
  "role.deleted": "Role deleted",
  "plugin.enabled": "Enabled plugin",
  "plugin.disabled": "Disabled plugin"
};

function getActionIcon(action: string) {
  if (action.startsWith("command."))
    return <MessageSquare className="size-4" />;
  if (action.startsWith("channel.")) return <Hash className="size-4" />;
  if (action.startsWith("role.")) return <Shield className="size-4" />;
  if (action.startsWith("plugin.")) return <Puzzle className="size-4" />;
  return <Server className="size-4" />;
}

export function GuildPage({ discordId }: { discordId: string }) {
  const { guild } = useGuild(discordId);
  const { prefix, loading: prefixLoading } = useGuildPrefix(discordId);
  const commands = useQuery(api.commands.list, { guildDiscordId: discordId });
  const auditLogs = useQuery(api.auditLog.list, {
    guildDiscordId: discordId,
    limit: 5
  });

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
          <p className="text-muted-foreground mt-1">Overview</p>
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

      {/* Recent Audit Logs */}
      <div className="animate-fade-up stagger-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Activity</h2>
          <Link
            href={`/guild/${discordId}/audit-log`}
            className="text-primary text-sm hover:underline"
          >
            View all
          </Link>
        </div>

        {auditLogs === undefined ? (
          <div className="border-border/50 bg-card space-y-1 rounded-2xl border p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-secondary h-14 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="border-border/50 bg-card space-y-1 rounded-2xl border p-2">
            {auditLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
              >
                <div className="bg-secondary text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                  {getActionIcon(log.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">
                      {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    {log.targetName && (
                      <code className="bg-secondary text-primary truncate rounded px-1.5 py-0.5 text-xs font-medium">
                        {log.targetName}
                      </code>
                    )}
                  </div>
                  <span className="text-muted-foreground/60 text-xs">
                    {log.actorName ?? log.actorId} · {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 gap-1 text-[10px] uppercase"
                >
                  {log.source === "dashboard" ? (
                    <Monitor className="size-3" />
                  ) : (
                    <Bot className="size-3" />
                  )}
                  {log.source}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-border/50 bg-card rounded-2xl border p-8 text-center">
            <ScrollText className="text-muted-foreground/50 mx-auto mb-3 size-8" />
            <p className="text-muted-foreground text-sm">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
