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
import { EditModal, EndorseTransmittalComponent } from "./dialogs";
import { HistoryDialog } from "@/app/client/bill-management/transmittal/[id]/dialogs";
import { useFetchTransmittal } from "@/hooks/use-transmittal";
import { useFetchUsers } from "@/hooks/use-user";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { SearchTransmittalItemsComponent } from "./dialogs";
import { TransmittalItems } from "@/lib/types";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { TransmittalPDF } from "./export-to-pdf";

const BILLING_OFFICER = 3;

export default function TransmittalDetailPage() {
  const params = useParams();
  const transmittalId = params.id;
  const user = useCurrentUser();
  const {
    data: transmittalData,
    refetch: refetchTransmittal,
    loading: transmittalLoading,
  } = useFetchTransmittal();
  const { data: userData, refetch: refetchUsers } = useFetchUsers();
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
    refetchUsers({
      query: { client_id: user?.client.id, role_id: BILLING_OFFICER },
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

  const isPending = transmittalData?.status === "pending";
  const hasHistory =
    transmittalData?.resubmitted_as_id || transmittalData?.resubmitted_from_id;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href="/client/operations/transmittal">
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
                      refetchUsers({
                        query: {
                          client_id: user?.client.id,
                          role_id: BILLING_OFFICER,
                        },
                      });
                      toast.info("Refreshing transmittal data...");
                    }}
                    disabled={transmittalLoading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${transmittalLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* <PDFDownloadLink
                    document={
                      <TransmittalPDF transmittalData={transmittalData} />
                    }
                    fileName={`transmittal-${transmittalData.transmittal_number}.pdf`}
                  >
                    {({ loading: pdfLoading }) => (
                      <Button variant="outline" size="sm" disabled={pdfLoading}>
                        <Download className="w-4 h-4 mr-2" />
                        {pdfLoading ? "Generating..." : "Export PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink> */}
                  {hasHistory && <HistoryDialog id={transmittalData.id} />}
                  {isPending && (
                    <>
                      <EditModal
                        transmittalData={transmittalData}
                        userData={userData}
                        onBusinessUnitChange={(selectedBusinessUnitId) => {
                          refetchUsers({
                            query: {
                              client_id: user?.client.id,
                              role_id: BILLING_OFFICER,
                              business_unit_id:
                                selectedBusinessUnitId ?? undefined,
                            },
                          });
                        }}
                        onSubmit={() => {
                          refetchUsers({
                            query: {
                              client_id: user?.client.id,
                              role_id: BILLING_OFFICER,
                            },
                          });
                          refetchTransmittals();
                        }}
                      />
                      <EndorseTransmittalComponent
                        transmittalData={transmittalData}
                        onEndorse={refetchTransmittals}
                      />
                    </>
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
                  <p className="text-sm text-muted-foreground">
                    Transmittal Date
                  </p>
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
