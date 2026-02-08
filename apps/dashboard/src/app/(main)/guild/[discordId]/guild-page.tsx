"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  LogOut,
  Crown,
  Settings,
  Zap,
  Shield,
  MessageSquare,
  Users,
  Bell,
  ChevronRight
} from "lucide-react";
import { useConvex } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

import { useCurrentUser } from "~/stores/current-user-store";
import { useGuild } from "~/stores/guild-store";

import { getGuildIconUrl } from "~/lib/discord";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

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

  return content;
}

export function GuildPage({ discordId }: { discordId: string }) {
  const router = useRouter();
  const convex = useConvex();
  const { user, fetchUser, displayName, userInitials } = useCurrentUser();
  const { guild, fetchGuild } = useGuild(discordId);
  const { signOut } = useAuthActions();

  useEffect(() => {
    void fetchUser(convex);
    void fetchGuild(discordId, convex);
  }, [convex, fetchUser, fetchGuild, discordId]);

  // Redirect if guild not found or no bot
  if (guild === null) {
    router.push("/");
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

  // Redirect if bot not in guild
  if (!guild.hasBot) {
    router.push("/");
    return null;
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
    <div className="grain min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/3 absolute right-0 -bottom-1/2 size-[600px] rounded-full blur-3xl" />
      </div>

      <header className="border-border/50 bg-background/80 relative border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                <Sparkles className="size-5" />
              </div>
            </Link>
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-gradient">Ignite</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-muted-foreground text-sm">
                Welcome back,
              </span>
              <span className="font-medium">{displayName}</span>
            </div>
            <Avatar className="ring-border/50 hover:ring-primary/30 ring-2 transition-all">
              {user?.image && (
                <AvatarImage src={user.image} alt={displayName} />
              )}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-9"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-12">
        {/* Back button */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground animate-fade-up mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to servers
        </Link>

        {/* Guild header */}
        <div className="animate-fade-up stagger-1 mb-12 flex items-center gap-6">
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
        <div className="animate-fade-up stagger-2">
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
      </main>

      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
