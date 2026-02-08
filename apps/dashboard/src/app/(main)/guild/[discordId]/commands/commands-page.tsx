"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  LogOut,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MessageSquare
} from "lucide-react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@ignite-bot/convex";
import { useGuildPrefix } from "~/stores/guild-prefix-store";

import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

type Command = {
  _id: string;
  name: string;
  description?: string;
  responses: { content: string }[];
  enabled: boolean;
};

function CommandCard({
  command,
  discordId,
  prefix,
  onDelete,
  onToggle
}: {
  command: Command;
  discordId: string;
  prefix: string;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <Link
      href={`/guild/${discordId}/commands/${command._id}`}
      className="border-border/50 bg-card hover:border-primary/50 group relative block overflow-hidden rounded-xl border p-4 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="bg-secondary text-primary rounded px-2 py-0.5 text-sm font-medium">
              {prefix}{command.name}
            </code>
            {!command.enabled && (
              <Badge variant="secondary" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-sm italic">
            {command.description || "No description provided"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={(e) => { e.preventDefault(); onToggle(); }}
          >
            {command.enabled ? (
              <ToggleRight className="text-primary size-4" />
            ) : (
              <ToggleLeft className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={(e) => { e.preventDefault(); onDelete(); }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

export function CommandsPage({ discordId }: { discordId: string }) {
  const router = useRouter();
  const convex = useConvex();
  const user = useQuery(api.users.currentUser);
  const guild = useQuery(api.guilds.getGuild, { discordId });
  const commands = useQuery(api.commands.list, { guildDiscordId: discordId });
  const { signOut } = useAuthActions();
  const { prefix, fetchPrefix } = useGuildPrefix(discordId);

  useEffect(() => {
    void fetchPrefix(discordId, convex);
  }, [discordId, convex, fetchPrefix]);

  const updateCommand = useMutation(api.commands.update);
  const deleteCommand = useMutation(api.commands.remove);

  const displayName = user?.name ?? user?.username ?? "User";
  const userInitials = displayName[0]?.toUpperCase() ?? "U";

  // Redirect if guild not found or no bot
  if (guild === null) {
    router.push("/");
    return null;
  }

  // Loading state
  if (guild === undefined || commands === undefined) {
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

  const handleDelete = async (id: string) => {
    // Find the command to get its responses before deletion
    const command = commands?.find((c) => c._id === id);
    const fileUrls =
      command?.responses
        .map((r) => r.content)
        .filter((content) => content.startsWith("http")) ?? [];

    try {
      // Delete from Convex first for fast UI feedback
      await deleteCommand({ id: id as any });

      // Delete associated files from R2 in the background
      if (fileUrls.length > 0) {
        fetch("/api/delete-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: fileUrls })
        }).catch((err) => {
          console.error("Failed to delete files from R2:", err);
        });
      }
    } catch (error) {
      console.error("Failed to delete command:", error);
    }
  };

  const handleToggle = async (command: Command) => {
    try {
      await updateCommand({
        id: command._id as any,
        enabled: !command.enabled
      });
    } catch (error) {
      console.error("Failed to toggle command:", error);
    }
  };

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
          href={`/guild/${discordId}`}
          className="text-muted-foreground hover:text-foreground animate-fade-up mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {guild.name}
        </Link>

        {/* Page header */}
        <div className="animate-fade-up stagger-1 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
              <MessageSquare className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
                Custom Commands
              </h1>
              <p className="text-muted-foreground mt-1">
                Create custom commands for your community
              </p>
            </div>
          </div>

          <Button asChild className="gap-2">
            <Link href={`/guild/${discordId}/commands/new`}>
              <Plus className="size-4" />
              New Command
            </Link>
          </Button>
        </div>

        {/* Commands list */}
        <div className="animate-fade-up stagger-2 space-y-3">
          {commands.length === 0 ? (
            <div className="border-border/50 bg-card/50 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16">
              <div className="bg-secondary text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-xl">
                <MessageSquare className="size-6" />
              </div>
              <p className="text-muted-foreground mb-4">
                No commands yet. Create your first one!
              </p>
              <Button asChild className="gap-2">
                <Link href={`/guild/${discordId}/commands/new`}>
                  <Plus className="size-4" />
                  Create Command
                </Link>
              </Button>
            </div>
          ) : (
            commands.map((command) => (
              <CommandCard
                key={command._id}
                command={command as Command}
                discordId={discordId}
                prefix={prefix}
                onDelete={() => handleDelete(command._id)}
                onToggle={() => handleToggle(command as Command)}
              />
            ))
          )}
        </div>
      </main>

      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
