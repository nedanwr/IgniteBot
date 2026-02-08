"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Constants
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_CONCURRENT = 3;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

// Types
export type UploadStatus =
  | "pending"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

export type FileUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number; // 0-100
  publicUrl?: string;
  error?: string;
  retryCount: number;
};

export type UploadProgress = {
  totalFiles: number;
  completedFiles: number;
  totalBytes: number;
  uploadedBytes: number;
  currentFile?: string;
};

export type UseFileUploadOptions = {
  guildId: string;
  maxConcurrent?: number;
  maxRetries?: number;
  chunkSize?: number;
  onProgress?: (progress: UploadProgress) => void;
  onFileComplete?: (id: string, publicUrl: string) => void;
  onError?: (id: string, error: string) => void;
};

export type UseFileUploadReturn = {
  files: Map<string, FileUploadItem>;
  isUploading: boolean;
  progress: UploadProgress;
  addFile: (id: string, file: File) => void;
  removeFile: (id: string) => void;
  startUpload: () => Promise<Map<string, string>>;
  cancelUpload: () => void;
  retryFailed: () => Promise<Map<string, string>>;
  reset: () => void;
};

// Helper to sleep for retry delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Check if error is retryable
function isRetryableError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Don't retry client errors (4xx except 429)
    if (
      message.includes("400") ||
      message.includes("401") ||
      message.includes("403") ||
      message.includes("404")
    ) {
      return false;
    }
    // Retry on network errors, timeouts, 5xx, rate limiting
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      /\b5\d{2}\b/.test(message) ||
      message.includes("429")
    ) {
      return true;
    }
  }

  return true; // Default to retryable
}

export function useFileUpload(
  options: UseFileUploadOptions
): UseFileUploadReturn {
  const {
    guildId,
    maxConcurrent = DEFAULT_MAX_CONCURRENT,
    maxRetries = DEFAULT_MAX_RETRIES,
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
    onFileComplete,
    onError
  } = options;

  const [files, setFiles] = useState<Map<string, FileUploadItem>>(
    () => new Map()
  );
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    totalFiles: 0,
    completedFiles: 0,
    totalBytes: 0,
    uploadedBytes: 0
  });

  // Refs for stable access to latest values
  const filesRef = useRef<Map<string, FileUploadItem>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadedBytesRef = useRef<Map<string, number>>(new Map());

  // Store callbacks in refs to avoid re-memoization cascades
  const onProgressRef = useRef(onProgress);
  const onFileCompleteRef = useRef(onFileComplete);
  const onErrorRef = useRef(onError);
  onProgressRef.current = onProgress;
  onFileCompleteRef.current = onFileComplete;
  onErrorRef.current = onError;

  // Wrapper to update both state and ref
  const updateFiles = useCallback(
    (
      updater: (
        prev: Map<string, FileUploadItem>
      ) => Map<string, FileUploadItem>
    ) => {
      setFiles((prev) => {
        const next = updater(prev);
        filesRef.current = next;
        return next;
      });
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      filesRef.current.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    };
  }, []);

  // Update a single file's status
  const updateFileStatus = useCallback(
    (id: string, updates: Partial<FileUploadItem>) => {
      updateFiles((prev) => {
        const next = new Map(prev);
        const existing = next.get(id);
        if (existing) {
          next.set(id, { ...existing, ...updates });
        }
        return next;
      });
    },
    [updateFiles]
  );

  // Recalculate overall progress
  const recalculateProgress = useCallback(() => {
    const fileArray = Array.from(filesRef.current.values());
    const totalBytes = fileArray.reduce((sum, f) => sum + f.file.size, 0);
    const uploadedBytes = Array.from(uploadedBytesRef.current.values()).reduce(
      (sum, bytes) => sum + bytes,
      0
    );
    const completedFiles = fileArray.filter(
      (f) => f.status === "success"
    ).length;
    const uploadingFile = fileArray.find((f) => f.status === "uploading");

    const newProgress: UploadProgress = {
      totalFiles: fileArray.length,
      completedFiles,
      totalBytes,
      uploadedBytes,
      currentFile: uploadingFile?.file.name
    };

    setProgress(newProgress);
    onProgressRef.current?.(newProgress);
  }, []);

  // Add a file
  const addFile = useCallback(
    (id: string, file: File) => {
      updateFiles((prev) => {
        const existing = prev.get(id);
        if (existing) {
          URL.revokeObjectURL(existing.previewUrl);
        }

        const next = new Map(prev);
        next.set(id, {
          id,
          file,
          previewUrl: URL.createObjectURL(file),
          status: "pending",
          progress: 0,
          retryCount: 0
        });
        return next;
      });
    },
    [updateFiles]
  );

  // Remove a file
  const removeFile = useCallback(
    (id: string) => {
      updateFiles((prev) => {
        const existing = prev.get(id);
        if (existing) {
          URL.revokeObjectURL(existing.previewUrl);
        }
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      uploadedBytesRef.current.delete(id);
    },
    [updateFiles]
  );

  // Upload a single file using XHR for progress tracking
  const uploadFile = useCallback(
    async (item: FileUploadItem, signal: AbortSignal): Promise<string> => {
      // Get presigned URL
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: item.file.name,
          contentType: item.file.type,
          size: item.file.size,
          guildId
        }),
        signal
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || `Upload failed: ${presignRes.status}`);
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      // Upload using XHR for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Handle abort signal
        const abortHandler = () => {
          xhr.abort();
          reject(new DOMException("Aborted", "AbortError"));
        };
        signal.addEventListener("abort", abortHandler);

        const cleanup = () => {
          signal.removeEventListener("abort", abortHandler);
        };

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const fileProgress = Math.round(
              (event.loaded / event.total) * 100
            );
            updateFileStatus(item.id, { progress: fileProgress });
            uploadedBytesRef.current.set(item.id, event.loaded);
            recalculateProgress();
          }
        };

        xhr.onload = () => {
          cleanup();
          if (xhr.status >= 200 && xhr.status < 300) {
            uploadedBytesRef.current.set(item.id, item.file.size);
            recalculateProgress();
            resolve(publicUrl);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          cleanup();
          reject(new Error("Network error during upload"));
        };

        xhr.ontimeout = () => {
          cleanup();
          reject(new Error("Upload timeout"));
        };

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", item.file.type);
        xhr.send(item.file);
      });
    },
    [guildId, updateFileStatus, recalculateProgress]
  );

  // Upload a large file using multipart upload
  const uploadMultipart = useCallback(
    async (item: FileUploadItem, signal: AbortSignal): Promise<string> => {
      // Initiate multipart upload
      const initRes = await fetch("/api/upload/multipart/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: item.file.name,
          contentType: item.file.type,
          size: item.file.size,
          guildId
        }),
        signal
      });

      if (!initRes.ok) {
        const data = await initRes.json();
        throw new Error(data.error || "Failed to initiate multipart upload");
      }

      const { uploadId, key } = await initRes.json();

      try {
        const chunks = Math.ceil(item.file.size / chunkSize);
        const parts: { ETag: string; PartNumber: number }[] = [];
        let totalUploaded = 0;

        for (let partNumber = 1; partNumber <= chunks; partNumber++) {
          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          const start = (partNumber - 1) * chunkSize;
          const end = Math.min(start + chunkSize, item.file.size);
          const chunk = item.file.slice(start, end);

          // Get presigned URL for this part
          const partRes = await fetch("/api/upload/multipart/part", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadId, key, partNumber }),
            signal
          });

          if (!partRes.ok) {
            throw new Error(`Failed to get part ${partNumber} URL`);
          }

          const { uploadUrl } = await partRes.json();

          // Upload the chunk
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: chunk,
            signal
          });

          if (!uploadRes.ok) {
            throw new Error(`Failed to upload part ${partNumber}`);
          }

          const etag =
            uploadRes.headers.get("ETag") || `"part-${partNumber}"`;
          parts.push({ ETag: etag, PartNumber: partNumber });

          totalUploaded += chunk.size;
          const fileProgress = Math.round(
            (totalUploaded / item.file.size) * 100
          );
          updateFileStatus(item.id, { progress: fileProgress });
          uploadedBytesRef.current.set(item.id, totalUploaded);
          recalculateProgress();
        }

        // Complete multipart upload
        const completeRes = await fetch("/api/upload/multipart/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId, key, parts }),
          signal
        });

        if (!completeRes.ok) {
          throw new Error("Failed to complete multipart upload");
        }

        const { publicUrl } = await completeRes.json();
        return publicUrl;
      } catch (error) {
        // Abort multipart upload on failure
        if (uploadId && key) {
          fetch("/api/upload/multipart/abort", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uploadId, key })
          }).catch(() => {
            // Ignore abort errors
          });
        }
        throw error;
      }
    },
    [guildId, chunkSize, updateFileStatus, recalculateProgress]
  );

  // Upload with retry logic
  const uploadWithRetry = useCallback(
    async (item: FileUploadItem, signal: AbortSignal): Promise<string> => {
      const useMultipart = item.file.size > MULTIPART_THRESHOLD;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }

        if (attempt > 0) {
          const delay =
            RETRY_DELAYS[attempt - 1] ??
            RETRY_DELAYS[RETRY_DELAYS.length - 1] ??
            4000;
          await sleep(delay);
          updateFileStatus(item.id, { retryCount: attempt });
        }

        try {
          updateFileStatus(item.id, { status: "uploading", progress: 0 });

          if (useMultipart) {
            return await uploadMultipart(item, signal);
          } else {
            return await uploadFile(item, signal);
          }
        } catch (error) {
          if (signal.aborted) {
            throw error;
          }

          if (!isRetryableError(error) || attempt === maxRetries) {
            throw error;
          }

          // Will retry on next iteration
        }
      }

      throw new Error("Max retries exceeded");
    },
    [maxRetries, uploadFile, uploadMultipart, updateFileStatus]
  );

  // Start uploading all pending files
  const startUpload = useCallback(async (): Promise<Map<string, string>> => {
    const pendingFiles = Array.from(filesRef.current.values()).filter(
      (f) => f.status === "pending" || f.status === "error"
    );

    if (pendingFiles.length === 0) {
      return new Map();
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Reset progress tracking
    uploadedBytesRef.current.clear();
    recalculateProgress();

    const results = new Map<string, string>();
    const errors: string[] = [];

    // Process in batches with concurrency limit
    for (let i = 0; i < pendingFiles.length; i += maxConcurrent) {
      if (signal.aborted) break;

      const batch = pendingFiles.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map((item) => uploadWithRetry(item, signal))
      );

      batchResults.forEach((result, idx) => {
        const item = batch[idx];
        if (!item) return;

        if (result.status === "fulfilled") {
          results.set(item.id, result.value);
          updateFileStatus(item.id, {
            status: "success",
            publicUrl: result.value,
            progress: 100
          });
          onFileCompleteRef.current?.(item.id, result.value);
        } else {
          const errorMsg =
            result.reason instanceof Error
              ? result.reason.message
              : "Upload failed";

          if (
            result.reason instanceof DOMException &&
            result.reason.name === "AbortError"
          ) {
            updateFileStatus(item.id, { status: "cancelled" });
          } else {
            updateFileStatus(item.id, { status: "error", error: errorMsg });
            errors.push(`${item.file.name}: ${errorMsg}`);
            onErrorRef.current?.(item.id, errorMsg);
          }
        }
      });
    }

    setIsUploading(false);
    abortControllerRef.current = null;

    if (errors.length > 0 && results.size === 0) {
      throw new Error(`All uploads failed: ${errors.join(", ")}`);
    }

    return results;
  }, [
    maxConcurrent,
    uploadWithRetry,
    updateFileStatus,
    recalculateProgress
  ]);

  // Cancel all in-progress uploads
  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsUploading(false);

    updateFiles((prev) => {
      const next = new Map(prev);
      next.forEach((file, id) => {
        if (file.status === "uploading") {
          next.set(id, { ...file, status: "cancelled" });
        }
      });
      return next;
    });
  }, [updateFiles]);

  // Retry failed uploads
  const retryFailed = useCallback(async (): Promise<Map<string, string>> => {
    // Reset failed files to pending via ref so startUpload sees latest state
    updateFiles((prev) => {
      const next = new Map(prev);
      next.forEach((file, id) => {
        if (file.status === "error") {
          next.set(id, {
            ...file,
            status: "pending",
            progress: 0,
            retryCount: 0,
            error: undefined
          });
        }
      });
      return next;
    });

    // filesRef is now updated synchronously by updateFiles
    return startUpload();
  }, [updateFiles, startUpload]);

  // Reset all state
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    filesRef.current.forEach((file) => URL.revokeObjectURL(file.previewUrl));

    updateFiles(() => new Map());
    setIsUploading(false);
    setProgress({
      totalFiles: 0,
      completedFiles: 0,
      totalBytes: 0,
      uploadedBytes: 0
    });
    uploadedBytesRef.current.clear();
  }, [updateFiles]);

  return {
    files,
    isUploading,
    progress,
    addFile,
    removeFile,
    startUpload,
    cancelUpload,
    retryFailed,
    reset
  };
}
