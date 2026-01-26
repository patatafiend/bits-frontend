"use client";

import { UserPayload } from "@/lib/types";
import { useServerFetch, useServerAction } from "@/hooks/use-server";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

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

const PUBLIC_ROUTES = [
  "/signin",
  "/signup",
  "/auth/forgot_password",
  "/auth/password_reset",
  "/auth/mfa/verify",
  "/signin/mfa",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, loading } = useGetCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user?.exp) {
      localStorage.setItem("exp", user.exp.toString());
    } else {
      localStorage.removeItem("exp");
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route),
    );

    if (!user && !isPublicRoute) {
      router.push("/signin");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}
