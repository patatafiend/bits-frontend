import { useServerFetch, useServerAction } from "@/hooks/use-server";
import {
  Role,
  RoleWithUserPermissions,
  Permission,
  CreateRole,
} from "@/lib/types";

export function useFetchRoles() {
  return useServerFetch<RoleWithUserPermissions[]>("/role_permission/roles", {
    method: "GET",
  });
}

export function useUpdateRole() {
  return useServerAction<Role, Partial<Role>>("/role_permission/roles", {
    method: "PUT",
  });
}

export function useCreateRole() {
  return useServerAction<Role, CreateRole>("/role_permission/roles/create", {
    method: "POST",
  });
}

export function useDeleteRole() {
  return useServerAction("/role_permission/roles/", { method: "DELETE" });
}

export function useFetchPermissions() {
  return useServerFetch<Permission[]>("/role_permission/roles/persmissions", {
    method: "GET",
  });
}
