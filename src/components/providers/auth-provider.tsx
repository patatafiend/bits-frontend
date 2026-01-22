"use client";

import { UserPayload } from "@/lib/types";
import { useServerFetch, useServerAction } from "@/hooks/use-server";

export function useGetCurrentUser() {
  return useServerFetch<UserPayload>("/user/current_user");
}

export function useSignIn() {
  return useServerAction<
    UserPayload | { mfa_required: boolean },
    { email: string; password: string }
  >("/user/signin", { method: "POST" });
}

export function useSignInFetch() {
  return useServerFetch<UserPayload>("/user/signin", { method: undefined });
}

export function useMfaSignIn() {
  return useServerAction<UserPayload, { mfa_code: string }>(
    "/user/mfa/signin",
    { method: "POST" },
  );
}

export function useSignOut() {
  return useServerAction<void, void>("/user/signout", { method: "POST" });
}

export function usePasswordReset() {
  return useServerAction<
    void,
    { reset_token: string; password: string; confirm_password: string }
  >("/user/password_reset", { method: "POST" });
}

export function useRefreshToken() {
  return useServerAction<UserPayload, void>("/user/refresh_token", {
    method: "POST",
  });
}
