"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { useGuild } from "~/hooks/use-guild";
import { CommandEditor } from "~/components/command-editor";

export function NewCommandPage({ discordId }: { discordId: string }) {
  const router = useRouter();
  const { guild } = useGuild(discordId);

  if (!guild) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Back to commands */}
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
    </div>
  );
}
