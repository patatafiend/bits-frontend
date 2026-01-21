import { parseError } from "@/lib/utils";
import React from "react";

export default function Loader(props: {
  loading: boolean;
  error?: string | string[] | null;
  children?: React.ReactNode;
}) {
  if (props.loading) {
    return (
      <div className="relative min-h-20">
        {/* Children rendered below */}
        <div className="opacity-50 pointer-events-none">{props.children}</div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm"
          aria-busy="true"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (Array.isArray(props.error)) {
    return (
      <div className="p-4 bg-destructive/15 border border-destructive/20 rounded-lg">
        <p className="text-destructive text-sm font-medium">
          Error: {parseError({ detail: props.error })}
        </p>
      </div>
    );
  }

  if (props.error) {
    return (
      <div className="p-4 bg-destructive/15 border border-destructive/20 rounded-lg">
        <p className="text-destructive text-sm font-medium">
          Error: {props.error}
        </p>
      </div>
    );
  }

  return <>{props.children}</>;
}
