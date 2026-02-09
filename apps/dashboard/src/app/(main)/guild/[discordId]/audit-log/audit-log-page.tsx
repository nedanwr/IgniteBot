"use client";

import {
  ScrollText,
  Monitor,
  Bot,
  MessageSquare,
  Hash,
  Shield,
  Server,
  Puzzle
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

import { useGuild } from "~/hooks/use-guild";
import { Badge } from "~/components/ui/badge";
import { PluginHeader } from "~/components/plugin-header";
import { PluginGuard } from "~/components/plugin-guard";

const ACTION_LABELS: Record<string, string> = {
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

function formatRelativeTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function AuditLogPage({ discordId }: { discordId: string }) {
  const { guild } = useGuild(discordId);
  const logs = useQuery(api.auditLog.list, { guildDiscordId: discordId });

  if (!guild || logs === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <PluginGuard pluginId="auditLog">
    <div className="mx-auto max-w-6xl px-6 py-12">
      <PluginHeader
        pluginId="auditLog"
        icon={<ScrollText className="size-6" />}
        title="Audit Log"
        description="Track changes made to your server"
      />

      {/* Log entries */}
      <div className="animate-fade-up stagger-1 space-y-2">
        {logs.length === 0 ? (
          <div className="border-border/50 bg-card/50 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16">
            <div className="bg-secondary text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-xl">
              <ScrollText className="size-6" />
            </div>
            <p className="text-muted-foreground">No activity recorded yet.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log._id}
              className="border-border/50 bg-card flex items-start gap-4 rounded-xl border p-4"
            >
              <div className="bg-secondary text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                {getActionIcon(log.action)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground text-sm font-medium">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  {log.targetName && (
                    <code className="bg-secondary text-primary rounded px-1.5 py-0.5 text-xs font-medium">
                      {log.targetName}
                    </code>
                  )}
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px] uppercase"
                  >
                    {log.source === "dashboard" ? (
                      <Monitor className="size-3" />
                    ) : (
                      <Bot className="size-3" />
                    )}
                    {log.source}
                  </Badge>
                </div>

                {log.metadata &&
                  typeof log.metadata === "object" &&
                  Object.keys(log.metadata as Record<string, unknown>).length >
                    0 && (
                    <div className="text-muted-foreground mt-1.5 text-xs">
                      {Object.entries(
                        log.metadata as Record<string, unknown>
                      ).map(([key, value]) => {
                        if (
                          typeof value === "object" &&
                          value !== null &&
                          "from" in value &&
                          "to" in value
                        ) {
                          const v = value as { from: unknown; to: unknown };
                          return (
                            <span key={key} className="mr-3">
                              {key}:{" "}
                              <span className="text-destructive line-through">
                                {String(v.from)}
                              </span>{" "}
                              →{" "}
                              <span className="text-primary">
                                {String(v.to)}
                              </span>
                            </span>
                          );
                        }
                        return (
                          <span key={key} className="mr-3">
                            {key}: {String(value)}
                          </span>
                        );
                      })}
                    </div>
                  )}

                <div className="text-muted-foreground/60 mt-1 text-xs">
                  {log.actorName ?? log.actorId} ·{" "}
                  {formatRelativeTime(log.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </PluginGuard>
  );
}
