import { clsx, type ClassValue } from "clsx";
import config from "@/app.config";
import { twMerge } from "tailwind-merge";
import { TokenRefreshManager } from "./refresh-token-manager";
import imageCompression from "browser-image-compression";
import { formatInTimeZone } from "date-fns-tz";
import { User } from "./types";

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

export function formatNum(
  num: number | string,
  decimalPlace: number = 2,
  includeSign: boolean = false,
): string {
  const type = config.numberFormat.type || "short";
  decimalPlace = decimalPlace || config.numberFormat.decimalPlaces || 2;

  if (num === null || num === undefined) return "0";
  if (typeof num === "string") {
    num = parseFloat(num);
  }
  if (isNaN(num)) return "0";

  const units = ["", "K", "M", "B", "T"];
  let unitIndex = 0;

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  let workingNum = absNum;

  let formattedNum = "";

  if (type === "short") {
    while (workingNum >= 1000 && unitIndex < units.length - 1) {
      workingNum /= 1000;
      unitIndex++;
    }
    formattedNum = `${isNegative ? "-" : ""}${workingNum.toFixed(
      decimalPlace,
    )}${units[unitIndex]}`;
  } else {
    formattedNum = num.toLocaleString("en-US", {
      minimumFractionDigits: decimalPlace,
      maximumFractionDigits: decimalPlace,
    });
  }
  // remove trailing .00 if trail is all zeros
  if (decimalPlace > 0) {
    const regex = new RegExp(`(\\.\\d{${decimalPlace}})0+$`);
    formattedNum = formattedNum.replace(regex, "$1");
    formattedNum = formattedNum.replace(/\.0+$/, ""); // remove .0 if nothing follows
  }
  return includeSign
    ? `${config.numberFormat.currency}${formattedNum}`
    : formattedNum;
}

export function formatDate(
  date: string | Date,
  includeTime: boolean = true,
): string {
  if (!date) return "N/A";

  const dateFormat = config.dateFormat + (includeTime ? config.timeFormat : "");

  let parsedDate: Date;

  if (typeof date === "string") {
    // Check if it's a date-only string (YYYY-MM-DD format)
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOnlyPattern.test(date.trim())) {
      // Add time component before timezone for date-only strings
      date = date + "T00:00:00+00:00";
    } else if (
      !date.includes("+") &&
      !date.includes("Z") &&
      !date.endsWith("+00:00")
    ) {
      // Only add +00:00 if no timezone info exists
      date = date + "+00:00";
    }
    parsedDate = new Date(date);
  } else {
    parsedDate = date;
  }

  // Validate the parsed date before formatting
  if (isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return formatInTimeZone(parsedDate, "Asia/Manila", dateFormat);
}

export function formatDateISO(date: Date | string | number): string {
  const formattedDate = formatInTimeZone(
    date,
    "Asia/Singapore",
    "yyyy-MM-dd'T'HH:mm",
  );

  return formattedDate;
}

export function parseDateStrSafe(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function formatFullName(
  user:
    | User
    | { first_name?: string; middle_name?: string; last_name?: string },
  long: boolean = false,
) {
  const firstName = user.first_name?.trim() ?? "";
  const middleNameRaw = user.middle_name?.trim() ?? "";
  const lastName = user.last_name?.trim() ?? "";

  let middleFormatted = "";
  if (middleNameRaw) {
    middleFormatted = long
      ? middleNameRaw
      : `${middleNameRaw.charAt(0).toUpperCase()}.`;
  }

  const fullName = [firstName, middleFormatted, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "N/A";
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

    const res = await fetch(baseUrl + route, {
      credentials: "include",
      headers: {
        ...options?.headers,
        "Content-type": "application/json",
      },
      ...options,
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
