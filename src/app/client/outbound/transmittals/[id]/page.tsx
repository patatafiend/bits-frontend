"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/providers/auth-provider";
import {
  useFetchTransmittal,
  useForwardTransmittal,
} from "@/hooks/use-transmittal";
import { ForwardTransmittalDialog } from "./dialogs";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { SearchTransmittalItemsComponent } from "@/app/client/operations/transmittal/[id]/dialogs";
import { TransmittalItems } from "@/lib/types";

export default function TransmittalDetailPage() {
  const params = useParams();
  const transmittalId = params.id;
  const user = useCurrentUser();
  const {
    data: transmittalData,
    refetch: refetchTransmittal,
    loading: transmittalLoading,
  } = useFetchTransmittal();
  const { execute: updateStatus, loading: loadingUpdate } =
    useForwardTransmittal();
    const [filteredItems, setFilteredItems] = useState<TransmittalItems[]>([]);

  function refetchTransmittals() {
    refetchTransmittal({
      params: `${transmittalId}`,
      query: { include_items: true },
    });
  }

  useEffect(() => {
    if (!transmittalId && user?.client.id) {
      return;
    }
    refetchTransmittal({
      params: `${transmittalId}`,
      query: { include_items: true },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transmittalId]);

    useEffect(() => {
    setFilteredItems(transmittalData?.transmittal_items ?? []);
  }, [transmittalData]);

    function handleFilter({
    search,
    status,
  }: {
    search?: string;
    status?: string;
  }) {
    const items = transmittalData?.transmittal_items ?? [];

    const result = items.filter((item) => {
      const matchesSearch = search
        ? item.file_name.toLowerCase().includes(search.toLowerCase()) ||
          item.transmittal_item_number?.toString().includes(search) ||
          item.reference_number?.toString().includes(search)
        : true;

      const matchesStatus =
        !status || status === "all" ? true : item.status === status;

      return matchesSearch && matchesStatus;
    });

    setFilteredItems(result);
  }

  async function handleUpdateStatus(status: string) {
    const { error } = await updateStatus({
      params: `/${transmittalData?.id}`,
      body: { status },
    });
    if (error) {
      toast.error(`Failed to forward transmittal: ${error.message}`);
    } else {
      toast.success("Transmittal forwarded successfully!");
    }
    refetchTransmittals();
  }

  const isButtonDisabled = transmittalData?.status === "endorsed";

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href="/client/outbound/transmittals">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transmittals
        </Button>
      </Link>

      <div className="grid gap-6">
        {transmittalData && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>Transmittal Details</CardTitle>
                    <StatusBadge status={transmittalData.status} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchTransmittals();
                    }}
                    disabled={transmittalLoading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${transmittalLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {isButtonDisabled && (
                    <ForwardTransmittalDialog
                      onConfirm={() => handleUpdateStatus("forwarded")}
                      loading={loadingUpdate}
                    />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Transmittal Number
                  </p>
                  <p className="font-medium">
                    {transmittalData.transmittal_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transmittal Date</p>
                  <p className="font-medium">
                    {formatDate(transmittalData.transmittal_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Billing Officer
                  </p>
                  <p className="font-medium">
                    {transmittalData.billing_officer_assigned?.username ??
                      "No officer assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Receiver Email
                  </p>
                  <p className="font-medium">
                    {transmittalData.billing_receiver_email ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receiver Name</p>
                  <p className="font-medium">
                    {transmittalData.billing_receiver_name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Receiver Company
                  </p>
                  <p className="font-medium">
                    {transmittalData.billing_receiver_company ?? "—"}
                  </p>
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Uploaded Files</h3>
                <SearchTransmittalItemsComponent
                  data={filteredItems}
                  loading={transmittalLoading}
                  onFilter={handleFilter}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
