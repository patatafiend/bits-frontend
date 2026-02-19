import { useServerFetch, useServerAction } from "./use-server";
import {
  Invoice,
  CreateInvoice,
  InvoiceItems,
  AddInvoiceItemPayload,
  InvoiceWithItems,
  UpdateInvoice,
  PaginatedInvoice,
} from "@/lib/types";

export function useCreateInvoice() {
  return useServerAction<Invoice, CreateInvoice>(`/invoices/create`, {
    method: "POST",
  });
}

export function useUpdateInvoice() {
  return useServerAction<Invoice, UpdateInvoice>(`/invoices/`, {
    method: "PUT",
  });
}

export function useFetchInvoices() {
  return useServerFetch<PaginatedInvoice>(`/invoices`, { method: "GET" });
}

export function useFetchInvoice() {
  return useServerFetch<InvoiceWithItems>(`/invoices`, { method: "GET" });
}

export function useFetchInvoiceItems() {
  return useServerFetch<InvoiceWithItems>(`/invoices`, { method: "GET" });
}

export function useAddItemToInvoice() {
  return useServerAction<InvoiceItems, AddInvoiceItemPayload[]>(`/invoices`, {
    method: "POST",
  });
}

export function useDeleteInvoiceItem() {
  return useServerAction<InvoiceItems>(`/invoices`, {
    method: "DELETE",
  });
}

export type InvoiceResponse = {
  detail: string;
  sent_to: string;
};

export function useSendInvoice() {
  return useServerAction<InvoiceResponse, Invoice>(`/invoices`, {
    method: "POST",
  });
}
