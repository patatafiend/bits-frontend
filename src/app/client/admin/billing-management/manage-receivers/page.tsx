"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useFetchReceivers } from "@/hooks/use-receiver";
import { useCurrentUser } from "@/components/providers/auth-provider";
import { ReceiverList } from "./dialogs";

export default function ReceiversPage() {
  const { data, loading, refetch } = useFetchReceivers();
  const user = useCurrentUser();

  function refetchReceivers() {
    refetch({
      params: `${user?.client.id}`,
    });
  }

  useEffect(() => {
    if (user?.client.id) {
      refetchReceivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Receivers</h1>
        <Button onClick={() => refetchReceivers()} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" /> Loading receivers...
        </div>
      ) : (
        <ReceiverList
          receivers={data || []}
          onUpdated={() => refetchReceivers()}
          onDeactivated={() => refetchReceivers()}
          user={user}
        />
      )}
    </div>
  );
}
