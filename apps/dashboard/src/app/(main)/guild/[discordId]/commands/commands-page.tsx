"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  X
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@ignite-bot/convex";

import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

type Command = {
  _id: string;
  name: string;
  description?: string;
  response: string;
  enabled: boolean;
};

function CommandCard({
  command,
  onEdit,
  onDelete,
  onToggle
}: {
  command: Command;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="border-border/50 bg-card group relative overflow-hidden rounded-xl border p-4 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="bg-secondary text-primary rounded px-2 py-0.5 text-sm font-medium">
              !{command.name}
            </code>
            {!command.enabled && (
              <Badge variant="secondary" className="text-xs">
                Disabled
              </Badge>
            )}
          </div>
          {command.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {command.description}
            </p>
          )}
          <p className="text-foreground mt-2 line-clamp-2 text-sm">
            {command.response}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={onToggle}
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
            className="text-muted-foreground hover:text-foreground size-8"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

type CommandFormData = {
  name: string;
  description: string;
  response: string;
};

function CommandModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CommandFormData) => void;
  initialData?: CommandFormData;
  isEditing?: boolean;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [response, setResponse] = useState(initialData?.response ?? "");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Command name is required");
      return;
    }

    if (!response.trim()) {
      setError("Response is required");
      return;
    }

    if (!/^[a-z0-9]+$/i.test(name)) {
      setError("Command name can only contain letters and numbers");
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      response: response.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="border-border/50 bg-card relative w-full max-w-lg rounded-2xl border p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-medium">
            {isEditing ? "Edit Command" : "Create Command"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-8"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">
              Command Name
            </label>
            <div className="flex items-center">
              <span className="bg-secondary text-muted-foreground border-border/50 flex h-10 items-center rounded-l-lg border border-r-0 px-3 text-sm">
                !
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="hello"
                className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/50 h-10 flex-1 rounded-r-lg border px-3 text-sm outline-none focus:ring-2"
                disabled={isEditing}
              />
            </div>
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A friendly greeting"
              className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/50 h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="text-foreground mb-1.5 block text-sm font-medium">
              Response
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Hello! Welcome to the server!"
              rows={4}
              className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-primary/50 w-full resize-none rounded-lg border p-3 text-sm outline-none focus:ring-2"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Save Changes" : "Create Command"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CommandsPage({ discordId }: { discordId: string }) {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);
  const guild = useQuery(api.guilds.getGuild, { discordId });
  const commands = useQuery(api.commands.list, { guildDiscordId: discordId });
  const { signOut } = useAuthActions();

  const createCommand = useMutation(api.commands.create);
  const updateCommand = useMutation(api.commands.update);
  const deleteCommand = useMutation(api.commands.remove);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

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

  const handleCreate = async (data: CommandFormData) => {
    try {
      await createCommand({
        guildDiscordId: discordId,
        name: data.name,
        description: data.description || undefined,
        response: data.response
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create command:", error);
    }
  };

  const handleEdit = async (data: CommandFormData) => {
    if (!editingCommand) return;

    try {
      await updateCommand({
        id: editingCommand._id as any,
        description: data.description || undefined,
        response: data.response
      });
      setEditingCommand(null);
    } catch (error) {
      console.error("Failed to update command:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCommand({ id: id as any });
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

          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="size-4" />
            New Command
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
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="size-4" />
                Create Command
              </Button>
            </div>
          ) : (
            commands.map((command) => (
              <CommandCard
                key={command._id}
                command={command}
                onEdit={() => setEditingCommand(command)}
                onDelete={() => handleDelete(command._id)}
                onToggle={() => handleToggle(command)}
              />
            ))
          )}
        </div>
      </main>

      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />

      {/* Create modal */}
      <CommandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit modal */}
      <CommandModal
        isOpen={!!editingCommand}
        onClose={() => setEditingCommand(null)}
        onSubmit={handleEdit}
        initialData={
          editingCommand
            ? {
                name: editingCommand.name,
                description: editingCommand.description ?? "",
                response: editingCommand.response
              }
            : undefined
        }
        isEditing
      />
    </div>
  );
}
