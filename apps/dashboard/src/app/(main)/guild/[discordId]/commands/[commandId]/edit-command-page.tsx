"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useQuery, useConvex } from "convex/react";
import { api } from "@ignite-bot/convex";
import { useEffect } from "react";
import { useGuild } from "~/stores/guild-store";
import { useGuildPrefix } from "~/stores/guild-prefix-store";

import { CommandEditor } from "~/components/command-editor";

export function EditCommandPage({
  discordId,
  commandId
}: {
  discordId: string;
  commandId: string;
}) {
  const router = useRouter();
  const convex = useConvex();
  const { guild } = useGuild(discordId);
  const command = useQuery(api.commands.get, { id: commandId as any });
  const { prefix, fetchPrefix } = useGuildPrefix(discordId);

  useEffect(() => {
    void fetchPrefix(discordId, convex);
  }, [convex, fetchPrefix, discordId]);

  // Redirect if command not found
  if (command === null) {
    router.push(`/guild/${discordId}/commands`);
    return null;
  }

  if (!guild || command === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading...</div>
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
          <Pencil className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
            Edit Command
          </h1>
          <p className="text-muted-foreground mt-1">
            Modify{" "}
            <code className="bg-secondary rounded px-1.5 py-0.5 text-sm">
              {prefix}{command.name}
            </code>{" "}
            for {guild.name}
          </p>
        </div>
      </div>

      {/* Command editor */}
      <CommandEditor
        discordId={discordId}
        initialData={{
          id: command._id,
          name: command.name,
          description: command.description ?? "",
          responses: command.responses
        }}
        isEditing
        onCancel={() => router.push(`/guild/${discordId}/commands`)}
      />
    </div>
  );
}
