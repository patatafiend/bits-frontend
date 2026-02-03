import { useServerFetch, useServerAction } from "@/hooks/use-server";
import { Role, RoleWithUserPermissions, Permission } from "@/lib/types";

export function useFetchRoles() {
  return useServerFetch<RoleWithUserPermissions>("/role_permission/roles", { method: "GET" });
}

export function useUpdateRole(){
    return useServerAction<Role, Partial<Role>>("/roles", {method: "PUT"});
}

export function useCreateRole(){
  return useServerAction<Role, RoleWithUserPermissions>("/roles/create", {method: "POST"});
}

export function useFetchPermissions(){
  return useServerFetch<Permission[]>
}