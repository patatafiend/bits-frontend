import { clsx, type ClassValue } from "clsx";
import config from "@/app.config";
import { twMerge } from "tailwind-merge";
import { TokenRefreshManager } from "./refresh-token-manager";
import imageCompression from "browser-image-compression";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function compressImage(file: File) {
  const options = {
    maxSizeMB: 8, // optional, limit output size
    // maxWidthOrHeight: 1920, // optional, resize if needed
    initialQuality: 0.8, // 80% quality (for JPEG/WebP)
    useWebWorker: true, // faster compression off main thread
  };

  const compressedFile = await imageCompression(file, options);
  console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
  );

  return compressedFile;
}

export function parseError(error: { detail: unknown; status?: number }) {
  const detail = error.detail;
  if (Array.isArray(detail)) {
    return JSON.stringify(detail, null, 2).replace(/[\[\]"]+/g, "");
  }
  if (typeof detail === "object" && detail !== null) {
    try {
      return JSON.stringify(detail, null, 2);
    } catch {
      return String(detail);
    }
  }
  if (typeof detail === "string") {
    return detail;
  }
  return `${String(detail || "Unknown error")}${
    error.status ? `: Status ${error.status}` : ""
  }`;
}

const tokenRefreshManager = new TokenRefreshManager();

export const BACKEND = {
  bits_backend: config.NEXT_PUBLIC_BACKEND_URL || "",
};

async function createService<T>(
  baseUrl: string,
  route: string,
  options?: RequestInit | { headers: Headers },
  loadingState?: (loading: boolean) => void,
) {
  try {
    loadingState?.(true);

    await tokenRefreshManager.ensureValidToken();
    // Make the actual API request

    console.log("Request:", {
      url: baseUrl + route,
      credentials: "include",
      cookies: document.cookie,
    });

    const res = await fetch(baseUrl + route, {
      credentials: "include",
      headers: {
        ...options?.headers,
        "Content-type": "application/json",
      },
      ...options,
    });

    console.log("Response:", {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      cookies: document.cookie,
    });

    const data = await res.json();

    if (!res.ok) {
      throw Error(
        JSON.stringify({
          detail: data.detail || "An error occurred",
          status: res.status,
        }),
      );
    }

    loadingState?.(false);
    return { data: data as T, error: null };
  } catch (e) {
    loadingState?.(false);
    return {
      data: null,
      error:
        e instanceof Error
          ? (() => {
              try {
                return JSON.parse(e.message) as {
                  detail: string;
                  status: number;
                };
              } catch {
                return { detail: e.message, status: 500 };
              }
            })()
          : { detail: "An unknown error occurred", status: 500 },
    };
  }
}

export const serverFetch = {
  service: {
    public: <T>(
      route: string,
      options?: RequestInit,
      loadingState?: (loading: boolean) => void,
    ) => createService<T>(BACKEND.bits_backend, route, options, loadingState),
  },
};
