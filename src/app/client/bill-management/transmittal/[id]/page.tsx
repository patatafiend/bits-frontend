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
  EditModal,
  RejectionReasonDialog,
  PostTransmittalComponent,
  SendTransmittalComponent,
  HistoryDialog,
  ReturnTransmittalComponent,
} from "./dialogs";
import {
  useFetchTransmittal,
} from "@/hooks/use-transmittal";
import { useFetchUsers } from "@/hooks/use-user";
import { TransmittalModal } from "./dialogs";
import { StatusBadge } from "@/components/status-badge";
import { UploadFile } from "./upload-file";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { TransmittalItems } from "@/lib/types";
import { SearchTransmittalItemsComponent } from "./dialogs";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { TransmittalPDF } from "./export-to-pdf";

const OPERATIONS_ADMIN = 4;

export default function TransmittalDetailPage() {
  const params = useParams();
  const transmittalId = params.id;
  const [modalOpen, setModalOpen] = useState(false);
  const [isSendMode, setIsSendMode] = useState(false);

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
      query: { client_id: user?.client.id, role_id: OPERATIONS_ADMIN },
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
        ? item.file_name.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesStatus =
        !status || status === "all" ? true : item.status === status;

      return matchesSearch && matchesStatus;
    });

    setFilteredItems(result);
  }

  const isRejected = transmittalData?.status === "rejected";
  const isDraft = transmittalData?.status === "draft";
  const isForwarded = transmittalData?.status === "forwarded";
  const isReturned = transmittalData?.status === "returned";
  const hasHistory =
    transmittalData?.resubmitted_as_id || transmittalData?.resubmitted_from_id;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Link href="/client/bill-management/transmittal">
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
                          role_id: OPERATIONS_ADMIN,
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
                  <RejectionReasonDialog transmittalData={transmittalData} />
                  {hasHistory && <HistoryDialog id={transmittalData.id} />}
                  {isDraft && (
                    <EditModal
                      transmittalData={transmittalData}
                      userData={userData}
                      onSubmit={() => {
                        refetchUsers({
                          query: {
                            client_id: user?.client.id,
                            role_id: OPERATIONS_ADMIN,
                          },
                        });
                        refetchTransmittals();
                      }}
                    />
                  )}
                  {isRejected ||
                    (isReturned && (
                      <>
                        <Button onClick={() => setModalOpen(true)}>
                          Resubmit
                        </Button>
                        <TransmittalModal
                          client_id={transmittalData.client_id}
                          open={modalOpen}
                          onOpenChange={setModalOpen}
                          onSubmit={refetchTransmittals}
                          transmittalData={transmittalData}
                        />
                      </>
                    ))}
                  {isForwarded && (
                    <ReturnTransmittalComponent
                      transmittalData={transmittalData}
                      onReturn={refetchTransmittals}
                    />
                  )}
                  {isDraft && (
                    <>
                      <div className="flex items-center gap-2 ml-auto">
                        <Switch
                          id="send-mode"
                          checked={isSendMode}
                          onCheckedChange={setIsSendMode}
                        />
                        <Label
                          htmlFor="send-mode"
                          className="cursor-pointer text-sm"
                        >
                          {isSendMode ? "Email" : "Operations"}
                        </Label>
                      </div>
                      {isSendMode ? (
                        <SendTransmittalComponent
                          transmittalData={transmittalData}
                          onSend={refetchTransmittals}
                        />
                      ) : (
                        <PostTransmittalComponent
                          transmittalData={transmittalData}
                          onPost={refetchTransmittals}
                        />
                      )}
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
                  <p className="text-sm text-muted-foreground">Endorsed Date</p>
                  <p className="font-medium">
                    {formatDate(transmittalData.endorsed_date) ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Forwarded Date
                  </p>
                  <p className="font-medium">
                    {formatDate(transmittalData.forwarded_date) ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Operation Admin
                  </p>
                  <p className="font-medium">
                    {transmittalData.operation_admin_assigned?.username ??
                      "No Admin assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Officer</p>
                  <p className="font-medium">
                    {transmittalData.billing_officer_assigned?.username ??
                      "No Officer assigned"}
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
                  isDraft={isDraft}
                  transmittalId={Number(transmittalId)}
                  refetchTransmittals={refetchTransmittals}
                  onFilter={handleFilter}
                />
              </div>
            </CardContent>
          </Card>
        )}
        {isDraft && (
          <UploadFile
            transmittalData={transmittalData}
            transmittalId={transmittalId ? Number(transmittalId) : undefined}
            refetchTransmittal={refetchTransmittal}
          />
        )}
      </div>
    </div>
  );
}
