"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useFetchClient,
  useActivateClient,
  useDeactivateClient,
} from "@/hooks/use-client";
import { BusinessUnitsSection, ClientEditModal } from "./modals";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = Number(params.id);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: client, refetch, loading } = useFetchClient();
  const { execute: activateClient, loading: activating } = useActivateClient();
  const { execute: deactivateClient, loading: deactivating } =
    useDeactivateClient();

  function refetchClient() {
    refetch({ params: `${clientId}` });
  }

  useEffect(() => {
    if (clientId) refetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleToggleStatus() {
    if (!client) return;
    const isActive = client.status === "active";

    if (isActive) {
      const result = await deactivateClient({
        params: `${clientId}/deactivate`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to deactivate client.");
      } else {
        toast.success("Client deactivated.");
        refetchClient();
      }
    } else {
      const result = await activateClient({
        params: `${clientId}/activate`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to activate client.");
      } else {
        toast.success("Client activated.");
        refetchClient();
      }
    }
  }

  return (
    <div className="container mx-auto py-4 flex flex-col gap-2">
      <Link href={"./"}>
        <Button variant="ghost" className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to clients
        </Button>
      </Link>

      {client && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Client details</CardTitle>
                  <StatusBadge status={client.status} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetchClient}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      client.status === "active"
                        ? "text-destructive border-destructive hover:bg-destructive/10"
                        : "text-green-700 border-green-700 hover:bg-green-50"
                    }
                    onClick={handleToggleStatus}
                    disabled={activating || deactivating}
                  >
                    {client.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client name</p>
                  <p className="font-medium">{client.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.client_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.client_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telephone</p>
                  <p className="font-medium">{client.client_tel ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{client.client_address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">System type</p>
                  <p className="font-medium">{client.system_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">
                    {client.client_description ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <BusinessUnitsSection clientId={clientId} />

          {client && (
            <ClientEditModal
              open={editModalOpen}
              onOpenChange={setEditModalOpen}
              onSuccess={refetchClient}
              client={client}
            />
          )}
        </>
      )}

      {!client && !loading && (
        <p className="text-muted-foreground text-sm">Client not found.</p>
      )}
    </div>
  );
}
