"use client";

import { useEffect } from "react";
import { useFetchClients } from "@/hooks/use-client";
import ClientComboBox from "./client-combobox";
import { useCurrentUser } from "./providers/auth-provider";
import { useGlobalFilters } from "./providers/global-filter-provider";

export default function ClientProvider() {
  const {
    data: clients,
    loading: loadingClients,
    refetch: refetchClients,
  } = useFetchClients();
  const user = useCurrentUser();
  const {
    selectedClientId,
    setSelectedClientId,
    setSelectedBusinessUnitId,
    hydrated,
  } = useGlobalFilters();

  useEffect(() => {
    refetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (selectedClientId == null && user?.client?.id) {
      setSelectedClientId(user.client.id);
    }
  }, [hydrated, selectedClientId, user?.client?.id, setSelectedClientId]);

  const handleClientChange = (clientId: number | null) => {
    setSelectedClientId(clientId);
    // Reset business-unit filter when switching client scope.
    setSelectedBusinessUnitId(null);
  };

  const isAdmin =
    user?.account_type == "company_account" ||
    user?.account_type == "admin_account";

  return (
    <>
      {isAdmin && (
        <ClientComboBox
          clientData={Array.isArray(clients) ? clients : null}
          value={selectedClientId ?? user?.client?.id ?? null}
          onValueChange={handleClientChange}
          placeholder="Select client..."
          disabled={loadingClients}
        />
      )}
    </>
  );
}
