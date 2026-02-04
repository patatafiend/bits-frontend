import { useServerFetch, useServerAction } from "@/hooks/use-server";
import { User, CreateUser } from "@/lib/types";

export function useFetchUsers() {
  return useServerFetch<User[]>("/user", { method: "GET" });
}

export function useFetchUserById(userId: string) {
  return useServerFetch<User>(`/user/${userId}`, { method: "GET" });
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
