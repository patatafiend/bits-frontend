import { useServerFetch, useServerAction } from "./use-server";
import {
  Transmittal,
  CreateTransmittal,
  TransmittalItems,
  AddTransmittalItemPayload,
  TransmittalWithItems,
  UpdateTransmittal,
  PaginatedTransmittal,
  ItemActionUpdate,
  TransmittalItemAction,
} from "@/lib/types";

export function useCreateTransmittal() {
  return useServerAction<Transmittal, CreateTransmittal>(
    `/transmittals/create`,
    {
      method: "POST",
    },
  );
}

export function useResubmitTransmittal() {
  return useServerAction<Transmittal, CreateTransmittal>(
    `/transmittals/resubmit`,
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

export function usePostTransmittal() {
  return useServerAction<Transmittal, UpdateTransmittal>(`/transmittals/post`, {
    method: "POST",
  });
}

export function useEndorseTransmittal() {
  return useServerAction<Transmittal, UpdateTransmittal>(
    `/transmittals/endorse`,
    {
      method: "POST",
    },
  );
}

export function useFetchHistory() {
  return useServerFetch<Transmittal[]>(`/transmittals/resubmission-history`, {
    method: "GET",
  });
}

export function useAssignOfficer() {
  return useServerAction<Transmittal, UpdateTransmittal>(
    `/transmittals/assign`,
    {
      method: "POST",
    },
  );
}

export function useForwardTransmittal() {
  return useServerAction<Transmittal, UpdateTransmittal>(
    `/transmittals/forward`,
    {
      method: "POST",
    },
  );
}

export function useReturnTransmittal() {
  return useServerAction<Transmittal, UpdateTransmittal>(
    `/transmittals/return`,
    {
      method: "POST",
    },
  );
}

export function useFetchItems() {
  return useServerFetch<TransmittalItems[]>(`/transmittals`, {
    method: "GET",
  });
}

export function useFetchItem() {
  return useServerFetch<TransmittalItems>(`/transmittals`, {
    method: "GET",
  });
}

export function useItemAction() {
  return useServerAction<TransmittalItemAction, ItemActionUpdate>(
    `/transmittals/item/action`,
    {
      method: "POST",
    },
  );
}
