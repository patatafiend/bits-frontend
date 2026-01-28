import { useServerFetch, useServerAction } from "@/hooks/use-server";
import { Role } from "@/lib/types";

export function UseFetchRoles() {
  return useServerFetch<Role>("/roles", { method: "GET" });
}

export function UseUpdateRole(){
    return useServerAction<Role, Partial<Role>>("/roles", {method: "PUT"});
}

export function Use