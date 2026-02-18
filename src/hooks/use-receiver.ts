import { CreateReceiver, Receiver, UpdateReceiver } from "@/lib/types";
import { useServerAction, useServerFetch } from "./use-server";

export function useFetchReceivers() {
  return useServerFetch<Receiver[]>(`/invoices/receivers/client/`, {
    method: "GET",
  });
}

export function useCreateReceiver() {
  return useServerAction<Receiver, CreateReceiver>(
    `/invoices/receivers/create/`,
    {
      method: "POST",
    },
  );
}

export function useUpdateReceiver() {
  return useServerAction<Receiver, UpdateReceiver>(`/invoices/receivers/`, {
    method: "PUT",
  });
}

