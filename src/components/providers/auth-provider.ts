"use client";

import { UserPayload } from "@/lib/types";
import { useServerFetch, useServerAction } from "@/hooks/use-server";

// Auth API Hooks
export function useGetCurrentUser() {
  return useServerFetch<UserPayload>("/api/user/current_user");
}

export function useSignIn() {
  return useServerAction<
    UserPayload | { mfa_required: boolean },
    { email: string; password: string }
  >("/api/user/signin", { method: "POST" });
}

export function useMfaSignIn() {
  return useServerAction<UserPayload, { mfa_code: string }>(
    "/api/user/mfa/signin",
    { method: "POST" },
  );
}

export function useSignOut() {
  return useServerAction<void, void>("/api/user/signout", { method: "POST" });
}

export function usePasswordReset() {
  return useServerAction<
    void,
    { reset_token: string; password: string; confirm_password: string }
  >("/api/user/password_reset", { method: "POST" });
}

export function useRefreshToken() {
  return useServerAction<UserPayload, void>("/api/user/refresh_token", {
    method: "POST",
  });
}
