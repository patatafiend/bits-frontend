import { useServerFetch, useServerAction } from "./use-server";
import {
  Invoice,
  CreateInvoice,
  InvoiceItems,
  AddInvoiceItemPayload,
  InvoiceWithItems,
  UpdateInvoice,
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
  return useServerFetch<Invoice[]>(`/invoices`, { method: "GET" });
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

export type InvoiceResponse = {
  detail: string;
  sent_to: string;
};

export function useSendInvoice() {
  return useServerAction<InvoiceResponse, Invoice>(`/invoices`, {
    method: "POST",
  });
}
