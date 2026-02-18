"use client";

import { UserPayload } from "@/lib/types";
import { useServerFetch, useServerAction } from "@/hooks/use-server";
import { ReactNode, useContext, useEffect, createContext } from "react";

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
  return useServerFetch<UserPayload>("/user/signin", { method: "GET" });
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

export type AuthContextType = {
  user: UserPayload | null;
};
const AuthContext = createContext<AuthContextType>({ user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, loading } = useGetCurrentUser();

  useEffect(() => {
    if (user?.exp) {
      localStorage.setItem("exp", user.exp.toString());
    } else {
      localStorage.removeItem("exp");
    }
  }, [user]);

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(AuthContext).user;
}
