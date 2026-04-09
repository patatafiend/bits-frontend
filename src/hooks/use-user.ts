import { useServerFetch, useServerAction } from "@/hooks/use-server";
import { User, CreateUser } from "@/lib/types";

export function useFetchUsers() {
  return useServerFetch<User[]>("/user", {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useFetchUser() {
  return useServerFetch<User>(`/user/`, {
    fetchImmediately: true,
    method: "GET",
  });
}

export function useUpdateUser() {
  return useServerAction<User, Partial<User>>(`/user/`, { method: "PUT" });
}

export function useDeactivateUser() {
  return useServerAction<User, Partial<User>>(`/user/`, { method: "POST" });
}

export function useCreateUser() {
  return useServerAction<User, CreateUser>(`/user/create`, { method: "POST" });
}

export function useForgotPassword() {
  return useServerAction<void, { email: string }>(`/user/forgot_password`, {
    method: "POST",
  });
}
