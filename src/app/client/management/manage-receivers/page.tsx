"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useFetchReceivers } from "@/hooks/use-receiver";
import { useCurrentUser } from "@/components/providers/auth-provider";
import { ReceiverList } from "./dialogs";
import { useGlobalFilters } from "@/components/providers/global-filter-provider";

export default function BillManagementReceiversPage() {
  const { data, loading, refetch } = useFetchReceivers();
  const user = useCurrentUser();
  const { selectedClientId } = useGlobalFilters();

  const [activeClientId, setActiveClientId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setActiveClientId(selectedClientId ?? user?.client.id ?? null);
    setMounted(true);
  }, [selectedClientId, user?.client.id]);

  function refetchReceivers() {
    if (!activeClientId) return;
    refetch({ params: `${activeClientId}` });
  }

  useEffect(() => {
    if (activeClientId) {
      refetchReceivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClientId]);

  if (!mounted) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Bill Receivers</h1>
            <p className="text-sm text-muted-foreground">
              Manage billing receivers by business unit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bill Receivers</h1>
          <p className="text-sm text-muted-foreground">
            Manage billing receivers by business unit.
          </p>
        </div>
        <Button onClick={refetchReceivers} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {!activeClientId ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Select a client first to load receivers.
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" /> Loading receivers...
        </div>
      ) : (
        <ReceiverList
          receivers={data || []}
          onUpdated={refetchReceivers}
          onDeactivated={refetchReceivers}
          user={user}
          clientId={activeClientId}
        />
      )}
    </div>
  );
}