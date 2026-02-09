import { useServerFetch, useServerAction } from "./use-server";
import { Invoice, CreateInvoice } from "@/lib/types";

export function useCreateInvoice() {
  return useServerAction<Invoice, CreateInvoice>(`/invoices/create`, {
    method: "POST",
  });
}

export function useFetchInvoices() {
  return useServerFetch<Invoice[]>(`/invoices`, { method: "GET" });
}