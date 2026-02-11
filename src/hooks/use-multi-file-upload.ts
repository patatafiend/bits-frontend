import { compressImage } from "@/lib/utils";
import axios from "axios";
import { useState, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";

export type UploadItem = {
  id: string;
  file: File;
  progress: number;
  uploading: boolean;
  compressing: boolean;
  error?: string;
  url?: string;
};

type Options = {
  concurrency?: number;
};

export function useMultiFileUpload(options?: Options) {
  const concurrency = options?.concurrency ?? 3;

  const [files, setFiles] = useState<UploadItem[]>([]);

  // Listeners that fire when all uploads complete
  const uploadCompleteHandlers = useRef<((urls: string[]) => void)[]>([]);

  // Register a handler. Returns an unsubscribe function.
  function onUploadComplete(handler: (urls: string[]) => void) {
    uploadCompleteHandlers.current.push(handler);
    return () => {
      uploadCompleteHandlers.current = uploadCompleteHandlers.current.filter(
        (h) => h !== handler,
      );
    };
  }

  function addFiles(newFiles: File[] | FileList | ChangeEvent<HTMLInputElement>) {
    let filesToAdd: File[] = [];

    if (newFiles instanceof FileList) {
      filesToAdd = Array.from(newFiles);
    } else if (Array.isArray(newFiles)) {
      filesToAdd = newFiles;
    } else {
      const inputFiles = newFiles.target?.files;
      if (inputFiles) {
        filesToAdd = Array.from(inputFiles);
      }
    }

    const mapped: UploadItem[] = filesToAdd.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      uploading: false,
      compressing: false,
    }));

    setFiles((prev) => [...prev, ...mapped]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function reset() {
    setFiles([]);
  }

  function updateFile(id: string, updates: Partial<UploadItem>) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  }

  async function getPresignedUploadUrl(file: File, location: string) {
    try {
      const res = await axios.post<{ uploadUrl: string }>(
        `/api/s3/upload/signed-url/${location}`,
        {
          fileName: file.name,
          fileType: file.type,
        },
      );
      return res.data.uploadUrl;
    } catch (err) {
      console.error("Error getting presigned URL:", err);
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.error || "Error getting presigned URL"
        : "Error getting presigned URL";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  async function uploadSingleFile(
    id: string,
    location: string,
    uploadUrl?: string,
  ) {
    const item = files.find((f) => f.id === id);
    if (!item) return;

    // Skip if already uploaded
    if (item.url) return item.url;

    // Skip if currently processing
    if (item.uploading || item.compressing) return;

    try {
      updateFile(id, { uploading: true, error: undefined, progress: 0 });

      let fileToUpload = item.file;

      // Compress large images
      const isImage = fileToUpload.type.startsWith("image/");
      if (fileToUpload.size > 5 * 1024 * 1024 && isImage) {
        updateFile(id, { compressing: true });
        const compressed = await compressImage(fileToUpload);
        console.log(
          `[${item.file.name}] Compressed from ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB to ${(compressed.size / 1024 / 1024).toFixed(2)} MB`,
        );
        fileToUpload = compressed;
        updateFile(id, { compressing: false, file: compressed });
      }

      // Get presigned URL if not provided
      if (!uploadUrl) {
        uploadUrl = await getPresignedUploadUrl(fileToUpload, location);
      }

      if (!uploadUrl) {
        throw new Error("Failed to get upload URL");
      }

      // Upload to S3
      await axios.put(uploadUrl, fileToUpload, {
        headers: {
          "Content-Type": fileToUpload.type || "application/octet-stream",
        },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / (e.total || 1));
          updateFile(id, { progress: percent });
        },
      });

      const publicUrl = uploadUrl.split("?")[0];

      updateFile(id, {
        uploading: false,
        progress: 100,
        url: publicUrl,
      });

      return publicUrl;
    } catch (err) {
      console.error(`Error uploading file [${item.file.name}]:`, err);
      const message =
        axios.isAxiosError(err)
          ? err.response?.data?.error || "Upload failed"
          : err instanceof Error
            ? err.message
            : "Upload failed";

      updateFile(id, {
        uploading: false,
        compressing: false,
        error: message,
      });

      toast.error(`Failed to upload ${item.file.name}: ${message}`);
      throw err;
    }
  }

  async function uploadAll(location: string) {
    // Filter files that need uploading (not already uploaded, not currently processing)
    const filesToUpload = files.filter(
      (f) => !f.url && !f.uploading && !f.compressing,
    );

    if (filesToUpload.length === 0) {
      // Return already uploaded URLs
      const existingUrls = files.filter((f) => f.url).map((f) => f.url!);
      return existingUrls;
    }

    const queue = [...filesToUpload];
    const results: string[] = [];
    const errors: string[] = [];

    async function worker() {
      while (queue.length) {
        const next = queue.shift();
        if (!next) return;

        try {
          const url = await uploadSingleFile(next.id, location);
          if (url) results.push(url);
        } catch (err) {
          console.log(err);
          errors.push(next.file.name);
        }
      }
    }

    // Create workers (limit to queue length if smaller than concurrency)
    const workerCount = Math.min(concurrency, filesToUpload.length);
    const workers = Array.from({ length: workerCount }, () => worker());

    await Promise.all(workers);

    // Include already-uploaded files
    const existingUrls = files.filter((f) => f.url && !filesToUpload.includes(f)).map((f) => f.url!);
    const allUrls = [...existingUrls, ...results];

    // Show summary toast
    if (errors.length === 0) {
      toast.success(`Successfully uploaded ${results.length} file(s)`);
    } else {
      toast.error(
        `Uploaded ${results.length} file(s), ${errors.length} failed`,
      );
    }

    // Fire all registered completion handlers
    uploadCompleteHandlers.current.forEach((h) => {
      try {
        h(allUrls);
      } catch (e) {
        console.error("Upload completion handler error:", e);
      }
    });

    return allUrls;
  }

  function retryFile(id: string, location: string) {
    // Reset error state before retrying
    updateFile(id, { error: undefined });
    return uploadSingleFile(id, location);
  }

  // Computed states
  const isAnyUploading = files.some((f) => f.uploading);
  const isAnyCompressing = files.some((f) => f.compressing);
  const hasErrors = files.some((f) => f.error);
  const allCompleted = files.length > 0 && files.every((f) => f.url);
  const totalProgress = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  return {
    files,
    addFiles,
    removeFile,
    reset,
    uploadAll,
    retryFile,
    getPresignedUploadUrl,
    onUploadComplete,
    // Computed states
    isAnyUploading,
    isAnyCompressing,
    hasErrors,
    allCompleted,
    totalProgress,
  };
}