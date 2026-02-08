"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, LogOut, Plus } from "lucide-react";
import { useConvex } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

import { useCurrentUser } from "~/stores/current-user-store";
import { useGuild } from "~/stores/guild-store";

import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { CommandEditor } from "~/components/command-editor";

export function NewCommandPage({ discordId }: { discordId: string }) {
  const router = useRouter();
  const convex = useConvex();
  const { user, fetchUser, displayName, userInitials } = useCurrentUser();
  const { guild, fetchGuild } = useGuild(discordId);
  const { signOut } = useAuthActions();

  useEffect(() => {
    void fetchUser(convex);
    void fetchGuild(discordId, convex);
  }, [convex, fetchUser, fetchGuild, discordId]);

  // Redirect if guild not found
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

      <main className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Back button */}
        <Link
          href={`/guild/${discordId}/commands`}
          className="text-muted-foreground hover:text-foreground animate-fade-up mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Commands
        </Link>

        {/* Page header */}
        <div className="animate-fade-up stagger-1 mb-8 flex items-center gap-4">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <Plus className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              Create Command
            </h1>
            <p className="text-muted-foreground mt-1">
              Add a new custom command for {guild.name}
            </p>
          </div>
        </div>

        {/* Command editor */}
        <CommandEditor
          discordId={discordId}
          onCancel={() => router.push(`/guild/${discordId}/commands`)}
        />
      </main>

      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
