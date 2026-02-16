import { useServerFetch } from "./use-server";

export type Receiver = {
  id: number;
  receiver_name: string;
  receiver_email: string;
  receiver_phone: string;
  receiver_position: string;
  client_id: number;
};

export function useFetchReceivers() {
  return useServerFetch<Receiver[]>(`/receivers/client/`, { method: "GET" });
}