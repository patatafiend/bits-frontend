import { cn } from "@/lib/utils";

const variants: Record<string, { badge: string; dot: string }> = {
  draft: {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  sent: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  pending: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  accepted: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  returned: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  forwarded: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const variant = variants[status] ?? {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        variant.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", variant.dot)} />
      {status}
    </span>
  );
}
