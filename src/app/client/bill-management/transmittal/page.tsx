"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { useFetchTransmittals } from "@/hooks/use-transmittal";
import { SearchTransmittalComponent, TransmittalModal } from "./dialogs";
import { useCurrentUser } from "@/components/providers/auth-provider";

export default function TransmittalListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: transmittals, refetch, loading } = useFetchTransmittals();
  const user = useCurrentUser();

  function refetchTransmittals(params: {
    search?: string;
    status?: string;
    skip?: number;
    limit?: number;
    order_by?: string;
  }) {
    refetch({
      params: `client/`,
      query: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 10,
        search: params.search ?? "",
        client_id: user?.client.id,
        order_by: params.order_by ?? "recent",
        status: params.status === "all" ? undefined : params.status,
      },
    });
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transmittals
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchTransmittals({})}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Transmittal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user && (
            <SearchTransmittalComponent
              data={transmittals ?? { items: [], total: 0 }}
              onFilter={refetchTransmittals}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      <TransmittalModal
        client_id={user?.client.id}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={() => refetchTransmittals({})}
      />
    </div>
  );
}
