"use client";

import { UserPayload } from "@/lib/types";
import { useServerFetch, useServerAction } from "@/hooks/use-server";
import { ReactNode, useContext, useEffect, createContext } from "react";

export function useGetCurrentUser() {
  return useServerFetch<UserPayload>("/user/current_user", {
    fetchImmediately: false,
    method: "GET",
  });
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
  loading: boolean;
  refetchUser: () => Promise<void>;
};
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, refetch, loading } = useGetCurrentUser();

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.exp) {
      localStorage.setItem("exp", user.exp.toString());
    } else {
      localStorage.removeItem("exp");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, refetchUser: refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(AuthContext).user;
}

export function useRefetchUser() {
  return useContext(AuthContext).refetchUser;
}

