"use client";

import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import type { FileUploadItem, UploadProgress } from "~/hooks/use-file-upload";

type UploadProgressIndicatorProps = {
  files: Map<string, FileUploadItem>;
  progress: UploadProgress;
  isUploading: boolean;
  onRetry?: () => void;
  onCancel?: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadProgressIndicator({
  files,
  progress,
  isUploading,
  onRetry,
  onCancel
}: UploadProgressIndicatorProps) {
  if (files.size === 0) return null;

  const fileArray = Array.from(files.values());
  const hasErrors = fileArray.some((f) => f.status === "error");
  const allComplete = fileArray.every((f) => f.status === "success");
  const hasCancelled = fileArray.some((f) => f.status === "cancelled");

  const progressPercent =
    progress.totalBytes > 0
      ? Math.round((progress.uploadedBytes / progress.totalBytes) * 100)
      : 0;

  return (
    <div className="border-border/50 bg-card/50 space-y-3 rounded-xl border p-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUploading && (
            <Loader2 className="text-primary size-4 animate-spin" />
          )}
          {allComplete && !isUploading && (
            <CheckCircle className="size-4 text-green-500" />
          )}
          {hasErrors && !isUploading && (
            <XCircle className="size-4 text-red-500" />
          )}
          {hasCancelled && !hasErrors && !isUploading && !allComplete && (
            <AlertCircle className="size-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            {isUploading
              ? `Uploading ${progress.completedFiles + 1} of ${progress.totalFiles}...`
              : allComplete
                ? "All files uploaded"
                : hasErrors
                  ? "Some uploads failed"
                  : hasCancelled
                    ? "Upload cancelled"
                    : "Ready to upload"}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">
          {formatBytes(progress.uploadedBytes)} /{" "}
          {formatBytes(progress.totalBytes)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-secondary h-1.5 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full transition-all duration-300",
            hasErrors && !isUploading ? "bg-red-500" : "bg-primary"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Per-file status */}
      {fileArray.length > 0 && (
        <div className="space-y-1 text-xs">
          {fileArray.slice(0, 3).map((file) => (
            <div key={file.id} className="flex items-center justify-between">
              <span className="text-muted-foreground max-w-[200px] truncate">
                {file.file.name}
              </span>
              <span
                className={cn(
                  file.status === "success" && "text-green-500",
                  file.status === "error" && "text-red-500",
                  file.status === "uploading" && "text-primary",
                  file.status === "cancelled" && "text-yellow-500",
                  file.status === "pending" && "text-muted-foreground"
                )}
              >
                {file.status === "uploading"
                  ? `${file.progress}%`
                  : file.status === "error"
                    ? file.error || "Failed"
                    : file.status}
              </span>
            </div>
          ))}
          {fileArray.length > 3 && (
            <span className="text-muted-foreground">
              +{fileArray.length - 3} more files
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {(hasErrors || isUploading) && (
        <div className="flex items-center gap-2 pt-1">
          {hasErrors && !isUploading && onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry Failed
            </Button>
          )}
          {isUploading && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
