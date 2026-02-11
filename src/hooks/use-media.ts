import { useServerAction } from "./use-server";

export type PresignedUrlResponse = {
  url: string;
};

export function useGetPresignedUrl() {
  return useServerAction<PresignedUrlResponse>(`/media/image`, {
    method: "GET",
  });
}
