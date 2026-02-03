import { compressImage } from "@/lib/utils";
import axios from "axios";
import { useState, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";

export default function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  // NEW: listeners that fire when an upload successfully completes
  const uploadCompleteHandlers = useRef<((url: string) => void)[]>([]);

  // Register a handler. Returns an unsubscribe function.
  function onUploadComplete(handler: (url: string) => void) {
    uploadCompleteHandlers.current.push(handler);
    return () => {
      uploadCompleteHandlers.current = uploadCompleteHandlers.current.filter(
        (h) => h !== handler,
      );
    };
  }

  function reset() {
    setFile(null);
    setFileUrl(null);
    setProgress(0);
    setError(null);
  }

  function handleFileChange(
    e: ChangeEvent<HTMLInputElement> | File | FileList | File[],
    compress: boolean = true,
  ) {
    let selected: File | null = null;

    if (e instanceof File) {
      selected = e;
    } else if (e instanceof FileList) {
      selected = e[0] ?? null;
    } else if (Array.isArray(e)) {
      selected = e[0] ?? null;
    } else {
      const files = e.target?.files;
      if (files && files.length > 0) {
        selected = files[0];
      }
    }

    if (selected) {
      setFile(selected);
    }
    if (compress && selected) {
      // Compress image if larger than 5MB
      // if (selected.size > 5 * 1024 * 1024) {
      //   setCompressing(true);
      //   compressImage(selected).then((compressed) => {
      //     setCompressing(false);
      //     console.log(
      //       `Compressed image from ${(selected!.size / 1024 / 1024).toFixed(
      //         2,
      //       )} MB to ${(compressed.size / 1024 / 1024).toFixed(2)} MB`,
      //     );
      //     setFile(compressed);
      //   });
      // } else {
      //   setFile(selected);
      // }

      setProgress(0);
      setError(null);
      setFileUrl(null);
    }
  }

  async function getPresignedUploadUrl(
    file: File,
    location: string,
  ) {
    try {
      setUploading(true);
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
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  }

  async function uploadFileToS3(
    location: string,
    uploadUrl?: string,
  ) {
    try {
      if (!file) {
        const errorMsg = "No file selected for upload";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Ensure we upload the compressed file (if any) by using a local variable
      let fileToUpload: File = file;

      // Compress image if larger than 5MB
      const isImage = fileToUpload.type.startsWith("image/");
      if (fileToUpload.size > 5 * 1024 * 1024 && !compressing && isImage) {
        setCompressing(true);
        setUploading(true);
        const compressed = await compressImage(fileToUpload);
        setCompressing(false);
        setUploading(false);
        console.log(
          `Compressed image from ${(fileToUpload.size / 1024 / 1024).toFixed(
            2,
          )} MB to ${(compressed.size / 1024 / 1024).toFixed(2)} MB`,
        );
        fileToUpload = compressed; // Use compressed file for upload
        setFile(compressed); // Update state for UI/consumers
      }

      // If no upload URL provided, get one
      if (!uploadUrl)
        uploadUrl = await getPresignedUploadUrl(fileToUpload, location);
      if (!uploadUrl) {
        const errorMsg = "Failed to get upload URL";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      await axios.put(uploadUrl, fileToUpload, {
        headers: {
          "Content-Type": fileToUpload.type || "application/octet-stream",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          setProgress(percentCompleted);
        },
      });

      const publicUrl = uploadUrl.split("?")[0];
      setFileUrl(publicUrl);
      setUploading(false);
      toast.success("File uploaded successfully");

      // Fire all registered completion handlers
      uploadCompleteHandlers.current.forEach((h) => {
        try {
          h(publicUrl);
        } catch (e) {
          console.error("Upload completion handler error:", e);
        }
      });

      return publicUrl;
    } catch (err) {
      console.error("Error uploading file to S3:", err);
      const errorMsg = axios.isAxiosError(err)
        ? err.response?.data?.error || "Error uploading file to S3"
        : err instanceof Error
          ? err.message
          : "Error uploading file to S3";
      setError(errorMsg);
      toast.error(errorMsg);
      setUploading(false);
    }
  }

  return {
    file,
    fileUrl,
    progress,
    error,
    reset,
    handleFileChange,
    uploadFileToS3,
    getPresignedUploadUrl,
    uploading,
    onUploadComplete, // NEW export
    compressing,
  };
}
