import { useState } from "react";
import { useServerAction } from "./use-server";

export type PresignedUrlResponse = {
  url: string;
};

export function useGetPresignedUrl() {
  return useServerAction<PresignedUrlResponse>(`/media/image`, {
    method: "GET",
  });
}

export function useDeleteS3Object() {
  const [loading, setLoading] = useState(false);

  async function deleteObject(fileKey: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/s3/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey }),
      });

      if (!res.ok) {
        const json = await res.json();
        return { error: new Error(json.error || "Failed to delete from S3") };
      }

      return { error: null };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err : new Error("Failed to delete from S3"),
      };
    } finally {
      setLoading(false);
    }
  }

  return { deleteObject, loading };
}
