"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  LogOut,
  Settings,
  Save,
  Check
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@ignite-bot/convex";

import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

export function SettingsPage({ discordId }: { discordId: string }) {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);
  const guild = useQuery(api.guilds.getGuild, { discordId });
  const settings = useQuery(api.guildSettings.get, {
    guildDiscordId: discordId
  });
  const { signOut } = useAuthActions();

  const updatePrefix = useMutation(api.guildSettings.updatePrefix);

  const [prefix, setPrefix] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const displayName = user?.name ?? user?.username ?? "User";
  const userInitials = displayName[0]?.toUpperCase() ?? "U";

  // Sync prefix from settings
  useEffect(() => {
    if (settings?.prefix) {
      setPrefix(settings.prefix);
    }
  }, [settings?.prefix]);

  // Redirect if guild not found or no bot
  if (guild === null) {
    router.push("/");
    return null;
  }

  // Loading state
  if (guild === undefined || settings === undefined) {
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

  const handleSavePrefix = async () => {
    setError("");
    setSaved(false);

    if (!prefix.trim()) {
      setError("Prefix cannot be empty");
      return;
    }

    if (prefix.length > 5) {
      setError("Prefix must be 5 characters or less");
      return;
    }

    try {
      await updatePrefix({ guildDiscordId: discordId, prefix: prefix.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError("Failed to save prefix");
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
        <div className="animate-fade-up stagger-1 mb-8 flex items-center gap-4">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <Settings className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              Server Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure Ignite for {guild.name}
            </p>
          </div>
        </div>

        {/* Settings sections */}
        <div className="animate-fade-up stagger-2 space-y-6">
          {/* Command Prefix */}
          <div className="border-border/50 bg-card rounded-2xl border p-6">
            <h3 className="text-lg font-medium">Command Prefix</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              The character(s) that trigger custom commands. Default is{" "}
              <code className="bg-secondary rounded px-1.5 py-0.5">!</code>
            </p>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="!"
                maxLength={5}
                className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/50 h-10 w-24 rounded-lg border px-3 text-center text-sm font-medium outline-none focus:ring-2"
              />
              <Button
                onClick={handleSavePrefix}
                disabled={prefix === settings.prefix}
                className="gap-2"
              >
                {saved ? (
                  <>
                    <Check className="size-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save
                  </>
                )}
              </Button>
            </div>

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <p className="text-muted-foreground mt-4 text-xs">
              Example: With prefix{" "}
              <code className="bg-secondary rounded px-1 py-0.5">
                {prefix || "!"}
              </code>
              , use{" "}
              <code className="bg-secondary rounded px-1 py-0.5">
                {prefix || "!"}hello
              </code>{" "}
              to trigger a command named &quot;hello&quot;
            </p>
          </div>
        </div>
      </main>

      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
