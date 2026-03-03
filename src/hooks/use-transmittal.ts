import { useServerFetch, useServerAction } from "./use-server";
import {
  Transmittal,
  CreateTransmittal,
  TransmittalItems,
  AddTransmittalItemPayload,
  TransmittalWithItems,
  UpdateTransmittal,
  PaginatedTransmittal,
} from "@/lib/types";

export function useCreateTransmittal() {
  return useServerAction<Transmittal, CreateTransmittal>(
    `/transmittals/create`,
    {
      method: "POST",
    },
  );
}

export function useUpdateTransmittal() {
  return useServerAction<Transmittal, UpdateTransmittal>(`/transmittals/`, {
    method: "PUT",
  });
}

export function useFetchTransmittals() {
  return useServerFetch<PaginatedTransmittal>(`/transmittals`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useFetchTransmittal() {
  return useServerFetch<TransmittalWithItems>(`/transmittals`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useFetchTransmittalItems() {
  return useServerFetch<TransmittalWithItems>(`/transmittals`, {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useAddItemToTransmittal() {
  return useServerAction<TransmittalItems, AddTransmittalItemPayload[]>(
    `/transmittals`,
    {
      method: "POST",
    },
  );
}

export function useDeleteTransmittalItem() {
  return useServerAction<TransmittalItems>(`/transmittals`, {
    method: "DELETE",
  });
}

export type TransmittalResponse = {
  detail: string;
  sent_to: string;
};

export function useSendTransmittal() {
  return useServerAction<TransmittalResponse, Transmittal>(`/transmittals`, {
    method: "POST",
  });
}

export type ReceiverResponse = {
  transmittal_id: number;
  action: string;
};

export function useReceiverAction() {
  return useServerAction<ReceiverResponse>(`/transmittals/receiver/`, {
    method: "PUT",
  });
}

export function useGenerateTMN() {
  return useServerAction<{ transmittal_number: string }>(
    `/transmittals/generate_tm_no`,
    { method: "GET" },
  );
}
