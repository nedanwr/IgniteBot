"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Save, Check } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@ignite-bot/convex";

import { useGuild } from "~/hooks/use-guild";
import { Button } from "~/components/ui/button";

export function SettingsPage({ discordId }: { discordId: string }) {
  const { guild } = useGuild(discordId);
  const settings = useQuery(api.guildSettings.get, {
    guildDiscordId: discordId
  });

  const updatePrefix = useMutation(api.guildSettings.updatePrefix);

  const [prefix, setPrefix] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Sync prefix from settings
  useEffect(() => {
    if (settings?.prefix) {
      setPrefix(settings.prefix);
    }
  }, [settings?.prefix]);

  if (!guild || settings === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
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
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError("Failed to save prefix");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Page header */}
      <div className="animate-fade-up mb-8 flex items-center gap-4">
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
      <div className="animate-fade-up stagger-1 space-y-6">
        {/* Command Prefix */}
        <div className="border-border/50 bg-card rounded-2xl border p-6">
          <h3 id="prefix-label" className="text-lg font-medium">
            Command Prefix
          </h3>
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
              aria-labelledby="prefix-label"
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
    </div>
  );
}
