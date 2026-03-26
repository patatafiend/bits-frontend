import { useServerFetch, useServerAction } from "./use-server";
import {
  ClientDetail,
  CreateClient,
  UpdateClient,
  BusinessUnit,
  CreateBusinessUnit,
  UpdateBusinessUnit,
} from "@/lib/types";

export function useCreateClient() {
  return useServerAction<ClientDetail, CreateClient>(`/clients`, {
    method: "POST",
  });
}

export function useFetchClients() {
  return useServerFetch<ClientDetail[]>(`/clients`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useFetchClient() {
  return useServerFetch<ClientDetail>(`/clients`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useUpdateClient() {
  return useServerAction<ClientDetail, UpdateClient>(`/clients/`, {
    method: "PUT",
  });
}

export function useDeleteClient() {
  return useServerAction<{ detail: string }>(`/clients/`, {
    method: "DELETE",
  });
}

export function useActivateClient() {
  return useServerAction<ClientDetail>(`/clients/`, {
    method: "POST",
  });
}

export function useDeactivateClient() {
  return useServerAction<ClientDetail>(`/clients/`, {
    method: "POST",
  });
}

export function useCreateBusinessUnit() {
  return useServerAction<BusinessUnit, CreateBusinessUnit>(`/clients/`, {
    method: "POST",
  });
}

export function useFetchBusinessUnits() {
  return useServerFetch<BusinessUnit[]>(`/clients/`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useFetchBusinessUnit() {
  return useServerFetch<BusinessUnit>(`/clients/`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useUpdateBusinessUnit() {
  return useServerAction<BusinessUnit, UpdateBusinessUnit>(`/clients/`, {
    method: "PUT",
  });
}

export function useDeleteBusinessUnit() {
  return useServerAction<{ detail: string }>(`/clients/`, {
    method: "DELETE",
  });
}

export function useActivateBusinessUnit() {
  return useServerAction<BusinessUnit>(`/clients/`, {
    method: "POST",
  });
}

export function useDeactivateBusinessUnit() {
  return useServerAction<BusinessUnit>(`/clients/`, {
    method: "POST",
  });
}
