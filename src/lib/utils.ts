import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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