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
  X
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@ignite-bot/convex";
import type { GenericId } from "convex/values";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { UploadProgressIndicator } from "~/components/upload-progress";
import { useFileUpload } from "~/hooks/use-file-upload";
import { useGuildPrefix } from "~/hooks/use-guild-prefix";

type CommandEditorProps = {
  discordId: string;
  initialData?: {
    id: GenericId<"commands">;
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
  return crypto.randomUUID();
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

  const { prefix } = useGuildPrefix(discordId);

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

  // Use the new file upload hook
  const {
    files: uploadFiles,
    isUploading,
    progress,
    addFile,
    removeFile,
    startUpload,
    cancelUpload,
    reset: resetUpload
  } = useFileUpload({
    guildId: discordId,
    maxConcurrent: 3,
    maxRetries: 3,
    onError: (id, errorMsg) => {
      console.error(`Upload failed for ${id}:`, errorMsg);
    }
  });

  const handleAddResponse = () => {
    setResponses([...responses, { id: generateId(), content: "" }]);
  };

  const handleRemoveResponse = (id: string) => {
    if (responses.length <= 1) return;
    // Clean up any pending file for this response
    removeFile(id);
    setResponses(responses.filter((r) => r.id !== id));
  };

  const handleResponseChange = (id: string, content: string) => {
    setResponses(responses.map((r) => (r.id === id ? { ...r, content } : r)));
  };

  const handleUploadClick = (responseId: string) => {
    setActiveResponseId(responseId);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setError("");

    // Add file to upload queue
    addFile(activeResponseId, file);

    // Clear any text content since file replaces text
    handleResponseChange(activeResponseId, "");

    setActiveResponseId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePendingFile = (responseId: string) => {
    removeFile(responseId);
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

    // Check that we have at least one response (text or pending file)
    const hasContent = responses.some(
      (r) => r.content.trim() || uploadFiles.has(r.id)
    );

    if (!hasContent) {
      setError("At least one response is required");
      return;
    }

    setSaving(true);

    // Show loading toast for uploads
    let toastId: string | number | undefined;
    if (uploadFiles.size > 0) {
      toastId = toast.loading(`Uploading ${uploadFiles.size} file(s)...`);
    }

    try {
      // Upload all pending files using the hook
      let uploadedUrls = new Map<string, string>();

      if (uploadFiles.size > 0) {
        uploadedUrls = await startUpload();

        // Update toast on completion
        if (toastId) {
          toast.success(`${uploadedUrls.size} file(s) uploaded`, {
            id: toastId
          });
        }
      }

      // Build final responses, preferring uploaded URLs over text content
      const finalResponses = responses
        .filter((r) => r.content.trim() || uploadedUrls.has(r.id))
        .map((r) => ({
          content: uploadedUrls.get(r.id) || r.content.trim()
        }));

      if (isEditing && initialData?.id) {
        await updateCommand({
          id: initialData.id,
          description: description.trim() || undefined,
          responses: finalResponses
        });
      } else {
        await createCommand({
          guildDiscordId: discordId,
          name: name.trim(),
          description: description.trim() || undefined,
          responses: finalResponses
        });
      }

      // Clean up and redirect
      resetUpload();
      router.push(`/guild/${discordId}/commands`);
    } catch (err) {
      console.error("Failed to save:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to save";
      setError(errorMsg);

      // Update toast to show error
      if (toastId) {
        toast.error("Upload failed", {
          id: toastId,
          description: errorMsg
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isUploading) {
      cancelUpload();
    }
    resetUpload();
    onCancel();
  };

  const handleRetryFailed = async () => {
    // The hook will handle retrying failed uploads on next startUpload call
    // For now, we can trigger a save which will retry
    await handleSave();
  };

  // Get preview URL for a response (from upload hook)
  const getPreviewUrl = (responseId: string): string | null => {
    const file = uploadFiles.get(responseId);
    return file?.previewUrl ?? null;
  };

  const hasFile = (responseId: string): boolean => {
    return uploadFiles.has(responseId);
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
            <label
              htmlFor="command-name"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Command Name
            </label>
            <div className="flex items-center">
              <span className="bg-secondary text-primary border-border/50 flex h-10 items-center rounded-l-lg border border-r-0 px-3 text-sm font-medium">
                {prefix}
              </span>
              <input
                id="command-name"
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
            <label
              htmlFor="command-description"
              className="text-foreground mb-2 block text-sm font-medium"
            >
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              id="command-description"
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
                  {!hasFile(response.id) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Upload file"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleUploadClick(response.id)}
                      disabled={isUploading}
                    >
                      <Upload className="size-3.5" />
                    </Button>
                  )}
                  {responses.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove response"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveResponse(response.id)}
                      disabled={isUploading}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {hasFile(response.id) ? (
                <div className="relative p-4">
                  <img
                    src={getPreviewUrl(response.id)!}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-contain"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    aria-label="Remove file"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemovePendingFile(response.id)}
                    disabled={isUploading}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <textarea
                  value={response.content}
                  onChange={(e) =>
                    handleResponseChange(response.id, e.target.value)
                  }
                  placeholder="Text message or image URL..."
                  rows={2}
                  className="text-foreground placeholder:text-muted-foreground w-full resize-none border-0 bg-transparent p-4 text-sm outline-none"
                  disabled={isUploading}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadFiles.size > 0 && (
        <UploadProgressIndicator
          files={uploadFiles}
          progress={progress}
          isUploading={isUploading}
          onRetry={handleRetryFailed}
          onCancel={cancelUpload}
        />
      )}

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
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || isUploading}
          className="min-w-[100px]"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {isUploading ? "Uploading..." : "Saving..."}
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
