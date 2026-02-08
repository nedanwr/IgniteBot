"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Zap,
  Shield,
  Users,
  Bell,
  ArrowLeft,
  Sparkles,
  ChevronsUpDown,
  Check,
  X
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@ignite-bot/convex";

import { getGuildIconUrl } from "~/lib/discord";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "~/components/ui/dropdown-menu";

type GuildSidebarProps = {
  discordId: string;
  guild: {
    name: string;
    icon?: string;
  };
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  match: "exact" | "startsWith";
  comingSoon?: boolean;
};

export function GuildSidebar({
  discordId,
  guild,
  open,
  onClose
}: GuildSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const guilds = useQuery(api.guilds.listGuilds);

  const basePath = `/guild/${discordId}`;

  const navItems: NavItem[] = [
    {
      label: "Overview",
      href: basePath,
      icon: <LayoutDashboard className="size-4" />,
      match: "exact"
    },
    {
      label: "Custom Commands",
      href: `${basePath}/commands`,
      icon: <MessageSquare className="size-4" />,
      match: "startsWith"
    },
    {
      label: "Server Settings",
      href: `${basePath}/settings`,
      icon: <Settings className="size-4" />,
      match: "startsWith"
    },
    {
      label: "Auto Moderation",
      href: `${basePath}/moderation`,
      icon: <Zap className="size-4" />,
      match: "startsWith",
      comingSoon: true
    },
    {
      label: "Verification",
      href: `${basePath}/verification`,
      icon: <Shield className="size-4" />,
      match: "startsWith",
      comingSoon: true
    },
    {
      label: "Welcome Messages",
      href: `${basePath}/welcome`,
      icon: <Users className="size-4" />,
      match: "startsWith",
      comingSoon: true
    },
    {
      label: "Notifications",
      href: `${basePath}/notifications`,
      icon: <Bell className="size-4" />,
      match: "startsWith",
      comingSoon: true
    }
  ];

  function isActive(item: NavItem) {
    if (item.match === "exact") return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  const guildInitials = guild.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const guildIconUrl = guild.icon
    ? getGuildIconUrl(discordId, guild.icon)
    : null;

  const guildsWithBot = guilds?.filter((g) => g.hasBot) ?? [];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex h-16 items-center gap-3 px-5 shadow-[0_1px_0_oklch(1_0_0/4%)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            <span className="text-gradient">Ignite</span>
          </span>
        </Link>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground ml-auto size-8 lg:hidden"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Guild selector */}
      <div className="border-border/50 border-b px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-secondary/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors">
              <Avatar className="size-8 rounded-md">
                {guildIconUrl ? (
                  <AvatarImage src={guildIconUrl} alt={guild.name} />
                ) : null}
                <AvatarFallback className="bg-secondary rounded-md text-xs font-medium">
                  {guildInitials}
                </AvatarFallback>
              </Avatar>
              <p className="text-foreground min-w-0 flex-1 truncate text-left text-sm font-medium">
                {guild.name}
              </p>
              <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[232px]">
            <DropdownMenuLabel>Switch server</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {guildsWithBot.map((g) => {
              const iconUrl = g.icon
                ? getGuildIconUrl(g.discordId, g.icon)
                : null;
              const initials = g.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isCurrent = g.discordId === discordId;

              return (
                <DropdownMenuItem
                  key={g._id}
                  onClick={() => {
                    if (!isCurrent) router.push(`/guild/${g.discordId}`);
                  }}
                  className="gap-3"
                >
                  <Avatar className="size-6 rounded-md">
                    {iconUrl ? (
                      <AvatarImage src={iconUrl} alt={g.name} />
                    ) : null}
                    <AvatarFallback className="bg-secondary rounded-md text-[10px] font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{g.name}</span>
                  {isCurrent && (
                    <Check className="text-primary size-4 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
          Modules
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1.5 px-3">
        {navItems.map((item) => {
          const active = isActive(item);

          if (item.comingSoon) {
            return (
              <div
                key={item.label}
                className="text-muted-foreground/40 flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm"
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="bg-secondary/60 text-muted-foreground/50 ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                active
                  ? "bg-secondary text-primary font-medium shadow-sm"
                  : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <span className={active ? "text-primary" : ""}>{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <div className="bg-primary ml-auto size-1.5 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to servers */}
      <div className="border-border/50 border-t p-3">
        <Link
          href="/"
          onClick={onClose}
          className="text-muted-foreground hover:bg-secondary/50 hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to servers</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — full viewport height, fixed position */}
      <aside className="bg-background border-border/50 fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <aside className="bg-background fixed inset-y-0 left-0 z-50 w-64 shadow-2xl lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
