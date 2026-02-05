"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Upload,
  Loader2,
  Sparkles,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@ignite-bot/convex";

import { Button } from "~/components/ui/button";

type CommandEditorProps = {
  discordId: string;
  initialData?: {
    id: string;
    name: string;
    description: string;
    responses: { content: string }[];
  };
  isEditing?: boolean;
  onCancel: () => void;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function CommandEditor({
  discordId,
  initialData,
  isEditing = false,
  onCancel
}: CommandEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createCommand = useMutation(api.commands.create);
  const updateCommand = useMutation(api.commands.update);

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [responses, setResponses] = useState<{ id: string; content: string }[]>(
    () =>
      initialData?.responses.map((r) => ({
        id: generateId(),
        content: r.content
      })) ?? [{ id: generateId(), content: "" }]
  );
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAddResponse = () => {
    setResponses([...responses, { id: generateId(), content: "" }]);
  };

  const handleRemoveResponse = (id: string) => {
    if (responses.length <= 1) return;
    setResponses(responses.filter((r) => r.id !== id));
  };

  const handleResponseChange = (id: string, content: string) => {
    setResponses(responses.map((r) => (r.id === id ? { ...r, content } : r)));
  };

  const handleUploadClick = (responseId: string) => {
    setActiveResponseId(responseId);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeResponseId) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Use JPG, PNG, WebP, or GIF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Max 10MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Get presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          guildId: discordId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { uploadUrl, publicUrl } = await res.json();

      // Upload to R2
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      // Insert URL into the response
      handleResponseChange(activeResponseId, publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setActiveResponseId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setError("");

    if (!name.trim()) {
      setError("Command name is required");
      return;
    }

    if (!/^[a-z0-9]+$/i.test(name)) {
      setError("Command name can only contain letters and numbers");
      return;
    }

    const validResponses = responses
      .filter((r) => r.content.trim())
      .map((r) => ({ content: r.content.trim() }));

    if (validResponses.length === 0) {
      setError("At least one response is required");
      return;
    }

    setSaving(true);

    try {
      if (isEditing && initialData?.id) {
        await updateCommand({
          id: initialData.id as any,
          description: description.trim() || undefined,
          responses: validResponses
        });
      } else {
        await createCommand({
          guildDiscordId: discordId,
          name: name.trim(),
          description: description.trim() || undefined,
          responses: validResponses
        });
      }

      router.push(`/guild/${discordId}/commands`);
    } catch (err) {
      console.error("Failed to save:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Command info */}
      <div className="border-border/50 bg-card/50 overflow-hidden rounded-xl border">
        <div className="border-border/50 flex items-center gap-3 border-b px-5 py-4">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </div>
          <h2 className="font-medium">Command Details</h2>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">
              Command Name
            </label>
            <div className="flex items-center">
              <span className="bg-secondary text-primary border-border/50 flex h-10 items-center rounded-l-lg border border-r-0 px-3 text-sm font-medium">
                !
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="hello"
                disabled={isEditing}
                className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-10 flex-1 rounded-r-lg border px-3 text-sm transition-all outline-none focus:ring-2 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description"
              className="bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all outline-none focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* Responses */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-foreground font-medium">Responses</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              One will be selected randomly. Can be text or image URL.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddResponse}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {responses.map((response, index) => (
            <div
              key={response.id}
              className="border-border/50 bg-card/50 overflow-hidden rounded-xl border"
            >
              <div className="border-border/50 flex items-center justify-between border-b px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded text-xs font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => handleUploadClick(response.id)}
                    disabled={uploading}
                  >
                    {uploading && activeResponseId === response.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                  </Button>
                  {responses.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveResponse(response.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <textarea
                value={response.content}
                onChange={(e) =>
                  handleResponseChange(response.id, e.target.value)
                }
                placeholder="Text message or image URL..."
                rows={2}
                className="text-foreground placeholder:text-muted-foreground w-full resize-none border-0 bg-transparent p-4 text-sm outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <AlertCircle className="size-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="border-border/50 flex items-center justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || uploading}
          className="min-w-[100px]"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Save"
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}
