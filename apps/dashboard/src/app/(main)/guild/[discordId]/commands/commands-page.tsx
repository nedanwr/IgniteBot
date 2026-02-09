"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MessageSquare
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@ignite-bot/convex";
import type { Doc } from "@ignite-bot/convex/dataModel";
import { toast } from "sonner";

import { useGuild } from "~/hooks/use-guild";
import { useGuildPrefix } from "~/hooks/use-guild-prefix";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "~/components/ui/alert-dialog";

type Command = Doc<"commands">;

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
              {prefix}
              {command.name}
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
            aria-label={command.enabled ? "Disable command" : "Enable command"}
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle();
            }}
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
            aria-label="Delete command"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

export function CommandsPage({ discordId }: { discordId: string }) {
  const { guild } = useGuild(discordId);
  const commands = useQuery(api.commands.list, { guildDiscordId: discordId });
  const { prefix } = useGuildPrefix(discordId);

  const updateCommand = useMutation(api.commands.update);
  const deleteCommand = useMutation(api.commands.remove);

  const [deleteTarget, setDeleteTarget] = useState<Command | null>(null);

  if (!guild || commands === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleDelete = async (command: Command) => {
    const fileUrls = command.responses
      .map((r) => r.content)
      .filter((content) => content.startsWith("http"));

    try {
      await deleteCommand({ id: command._id });
      toast.success(`Deleted command "${command.name}"`);

      if (fileUrls.length > 0) {
        const res = await fetch("/api/delete-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: fileUrls })
        });
        if (!res.ok) {
          console.error("Failed to delete files from R2:", res.status);
          toast.error("Command deleted but some files could not be cleaned up");
        }
      }
    } catch (error) {
      console.error("Failed to delete command:", error);
      toast.error("Failed to delete command");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggle = async (command: Command) => {
    try {
      await updateCommand({
        id: command._id,
        enabled: !command.enabled
      });
      toast.success(
        command.enabled
          ? `Disabled "${command.name}"`
          : `Enabled "${command.name}"`
      );
    } catch (error) {
      console.error("Failed to toggle command:", error);
      toast.error("Failed to toggle command");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Page header */}
      <div className="animate-fade-up mb-8 flex items-center justify-between">
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
      <div className="animate-fade-up stagger-1 space-y-3">
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
              onDelete={() => setDeleteTarget(command as Command)}
              onToggle={() => handleToggle(command as Command)}
            />
          ))
        )}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete command</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <code className="bg-secondary rounded px-1.5 py-0.5 text-sm">
                {prefix}
                {deleteTarget?.name}
              </code>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
