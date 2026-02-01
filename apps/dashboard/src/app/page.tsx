import Link from "next/link";
import {
  Users,
  Settings,
  ChevronRight,
  Sparkles,
  LogOut,
  Crown
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

// Placeholder guild data - will be replaced with real data from Discord API
const guilds = [
  {
    id: "1",
    name: "Ethereal Studios",
    icon: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=128&h=128&fit=crop",
    memberCount: 12847,
    isOwner: true,
    hasBot: true
  },
  {
    id: "2",
    name: "Midnight Developers",
    icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop",
    memberCount: 3521,
    isOwner: false,
    hasBot: true
  },
  {
    id: "3",
    name: "Creative Collective",
    icon: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=128&h=128&fit=crop",
    memberCount: 891,
    isOwner: false,
    hasBot: false
  },
  {
    id: "4",
    name: "Tech Enthusiasts",
    icon: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=128&h=128&fit=crop",
    memberCount: 24103,
    isOwner: false,
    hasBot: true
  },
  {
    id: "5",
    name: "Gaming Nexus",
    icon: "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=128&h=128&fit=crop",
    memberCount: 7892,
    isOwner: true,
    hasBot: true
  },
  {
    id: "6",
    name: "Art & Design Hub",
    icon: null,
    memberCount: 456,
    isOwner: false,
    hasBot: false
  }
];

// Placeholder user data
const user = {
  name: "Alexander",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop"
};

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function GuildCard({
  guild,
  index
}: {
  guild: (typeof guilds)[0];
  index: number;
}) {
  const initials = guild.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const staggerClass = `stagger-${index + 1}`;

  return (
    <Link
      href={guild.hasBot ? `/guild/${guild.id}` : "#"}
      className={`group animate-fade-up relative block ${staggerClass}`}
    >
      <div
        className={`border-border/50 bg-card relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ease-out ${guild.hasBot ? "hover-lift hover:border-primary/30 hover:bg-card/80 cursor-pointer" : "cursor-not-allowed opacity-60"} `}
      >
        <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-start gap-4">
          <div className="relative">
            <Avatar className="ring-border/50 group-hover:ring-primary/30 size-14 rounded-xl ring-2 transition-all duration-300">
              {guild.icon ? (
                <AvatarImage src={guild.icon} alt={guild.name} />
              ) : null}
              <AvatarFallback className="bg-secondary rounded-xl text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            {guild.isOwner && (
              <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full shadow-lg">
                <Crown className="size-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-foreground group-hover:text-primary truncate text-lg font-medium transition-colors">
              {guild.name}
            </h3>
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
              <Users className="size-3.5" />
              {formatMemberCount(guild.memberCount)} members
            </div>
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
          <div className="via-primary/40 absolute right-6 bottom-0 left-6 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <div className="grain min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/3 absolute right-0 -bottom-1/2 size-[600px] rounded-full blur-3xl" />
      </div>

      <header className="border-border/50 bg-background/80 relative border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
              <Sparkles className="size-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-gradient">Ignite</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-muted-foreground text-sm">
                Welcome back,
              </span>
              <span className="font-medium">{user.name}</span>
            </div>
            <Avatar className="ring-border/50 hover:ring-primary/30 ring-2 transition-all">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-9"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="animate-fade-up mb-12">
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
            Your <span className="text-gradient">Servers</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-lg">
            Select a server to configure Ignite and manage your community.
          </p>
        </div>

        <div className="animate-fade-up stagger-1 mb-10 flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">
                {guilds.filter((g) => g.hasBot).length}
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
            <GuildCard key={guild.id} guild={guild} index={index} />
          ))}
        </div>

        <div className="animate-fade-up stagger-8 mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            Don&apos;t see your server?{" "}
            <a
              href="#"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Make sure you have Manage Server permissions
            </a>
          </p>
        </div>
      </main>

      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />
    </div>
  );
}
