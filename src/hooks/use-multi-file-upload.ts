import { compressImage } from "@/lib/utils";
import axios from "axios";
import { useState } from "react";
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

  function addFiles(newFiles: File[]) {
    const mapped: UploadItem[] = newFiles.map((file) => ({
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
    const res = await axios.post<{ uploadUrl: string }>(
      `/api/s3/upload/signed-url/${location}`,
      {
        fileName: file.name,
        fileType: file.type,
      },
    );

    return res.data.uploadUrl;
  }

  async function uploadSingleFile(id: string, location: string) {
    const item = files.find((f) => f.id === id);
    if (!item) return;

    try {
      updateFile(id, { uploading: true, error: undefined });

      let fileToUpload = item.file;

      // Compress large images
      if (
        fileToUpload.size > 5 * 1024 * 1024 &&
        fileToUpload.type.startsWith("image/")
      ) {
        updateFile(id, { compressing: true });
        fileToUpload = await compressImage(fileToUpload);
        updateFile(id, { compressing: false });
      }

      const uploadUrl = await getPresignedUploadUrl(
        fileToUpload,
        location,
      );

      await axios.put(uploadUrl, fileToUpload, {
        headers: {
          "Content-Type":
            fileToUpload.type || "application/octet-stream",
        },
        onUploadProgress: (e) => {
          const percent = Math.round(
            (e.loaded * 100) / (e.total || 1),
          );
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
      const message =
        axios.isAxiosError(err)
          ? err.response?.data?.error || "Upload failed"
          : "Upload failed";

      updateFile(id, {
        uploading: false,
        compressing: false,
        error: message,
      });

      toast.error(message);
    }
  }

  async function uploadAll(location: string) {
    const queue = [...files];
    const results: string[] = [];

    async function worker() {
      while (queue.length) {
        const next = queue.shift();
        if (!next) return;

        const url = await uploadSingleFile(next.id, location);
        if (url) results.push(url);
      }
    }

    const workers = Array.from(
      { length: concurrency },
      () => worker(),
    );

    await Promise.all(workers);

    return results;
  }

  function retryFile(id: string, location: string) {
    return uploadSingleFile(id, location);
  }

  return {
    files,
    addFiles,
    removeFile,
    reset,
    uploadAll,
    retryFile,
  };
}
