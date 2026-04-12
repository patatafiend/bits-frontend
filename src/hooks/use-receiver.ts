import { CreateReceiver, Receiver, UpdateReceiver, TransmittalWithItems, TransmittalItemAction, ItemActionUpdate } from "@/lib/types";
import { useServerAction, useServerFetch } from "./use-server";

export function useFetchReceivers() {
  return useServerFetch<Receiver[]>(`/transmittals/receivers/client`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useCreateReceiver() {
  return useServerAction<Receiver, CreateReceiver>(
    `/transmittals/receivers/create`,
    {
      method: "POST",
    },
  );
}

export function useUpdateReceiver() {
  return useServerAction<Receiver, UpdateReceiver>(`/transmittals/receivers/`, {
    method: "PUT",
  });
}

export function useFetchReceiverTransmittal() {
  return useServerFetch<TransmittalWithItems>(`/transmittals/receiver`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useReceiverItemAction() {
  return useServerAction<TransmittalItemAction, ItemActionUpdate>(
    `/transmittals/receiver/`,
    {
      method: "PUT",
    },
  );
}