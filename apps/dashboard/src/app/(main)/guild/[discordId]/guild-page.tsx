"use client";

import Link from "next/link";
import {
  Crown,
  Settings,
  Zap,
  Shield,
  MessageSquare,
  Users,
  Bell,
  ChevronRight
} from "lucide-react";

import { useGuild } from "~/stores/guild-store";

import { getGuildIconUrl } from "~/lib/discord";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";

type ModuleCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  enabled?: boolean;
  comingSoon?: boolean;
};

function ModuleCard({
  icon,
  title,
  description,
  href,
  enabled = false,
  comingSoon = false
}: ModuleCardProps) {
  const content = (
    <div
      className={`border-border/50 bg-card group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
        comingSoon
          ? "cursor-not-allowed opacity-50"
          : "hover-lift hover:border-primary/30 hover:bg-card/80 cursor-pointer"
      }`}
    >
      <div className="from-primary/5 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start gap-4">
        <div
          className={`flex size-12 items-center justify-center rounded-xl ${
            enabled
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-lg font-medium">{title}</h3>
            {comingSoon && (
              <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>

        {href && !comingSoon ? (
          <ChevronRight className="text-muted-foreground group-hover:text-primary size-5 transition-colors" />
        ) : (
          <div
            className={`size-3 rounded-full ${
              enabled
                ? "bg-emerald-500 shadow-lg shadow-emerald-500/50"
                : "bg-muted"
            }`}
          />
        )}
      </div>
    </div>
  );

  if (href && !comingSoon) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <div role="group" aria-label={`${title} — coming soon`}>
      {content}
    </div>
  );
}

export function GuildPage({ discordId }: { discordId: string }) {
  const { guild } = useGuild(discordId);

  if (!guild) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  const guildInitials = guild.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const guildIconUrl = guild.icon
    ? getGuildIconUrl(guild.discordId, guild.icon)
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
          <p className="text-muted-foreground mt-1">
            Configure Ignite for your server
          </p>
        </div>
      </div>

      {/* Modules section */}
      <div className="animate-fade-up stagger-1">
        <h2 className="mb-6 text-xl font-medium">Modules</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <ModuleCard
            icon={<Zap className="size-6" />}
            title="Auto Moderation"
            description="Automatically moderate messages, filter spam, and enforce rules"
            comingSoon
          />
          <ModuleCard
            icon={<Shield className="size-6" />}
            title="Verification"
            description="Require members to verify before accessing the server"
            comingSoon
          />
          <ModuleCard
            icon={<MessageSquare className="size-6" />}
            title="Custom Commands"
            description="Create custom commands for your community"
            href={`/guild/${discordId}/commands`}
          />
          <ModuleCard
            icon={<Users className="size-6" />}
            title="Welcome Messages"
            description="Greet new members with customizable welcome messages"
            comingSoon
          />
          <ModuleCard
            icon={<Bell className="size-6" />}
            title="Notifications"
            description="Set up notifications for various server events"
            comingSoon
          />
          <ModuleCard
            icon={<Settings className="size-6" />}
            title="Server Settings"
            description="Configure general bot settings for your server"
            href={`/guild/${discordId}/settings`}
          />
        </div>
      </div>
    </div>
  );
}
