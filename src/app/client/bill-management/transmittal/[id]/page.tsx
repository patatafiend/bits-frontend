"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ImageIcon, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/providers/auth-provider";
import {
  EditModal,
  PostTransmittalComponent,
  SendTransmittalComponent,
  HistoryDialog,
} from "./dialogs";
import { useFetchTransmittal, useFetchItems } from "@/hooks/use-transmittal";
import { useFetchUsers } from "@/hooks/use-user";
import { ResubmittModal } from "./resubmit-modal";
import { StatusBadge } from "@/components/status-badge";
import { UploadFile } from "./upload-file";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { TransmittalItems } from "@/lib/types";
import { SearchTransmittalItemsComponent } from "./dialogs";
import Image from "next/image";
import { useGetPresignedUrl } from "@/hooks/use-media";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { TransmittalPDF } from "./export-to-pdf";

const OPERATIONS_ADMIN = 4;
const BILLING_OFFICER = 3;

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
  const { data: operationAdminUserData, refetch: refetchOperationAdminUsers } =
    useFetchUsers();
  const { data: billingOfficerUserData, refetch: refetchBillingOfficerUsers } =
    useFetchUsers();
  const {
    data: items,
    refetch: refetchItems,
    loading: itemLoading,
  } = useFetchItems();

  const [filteredItems, setFilteredItems] = useState<TransmittalItems[]>([]);

  function refetchTransmittals() {
    refetchTransmittal({
      params: `${transmittalId}`,
      query: { include_items: true },
    });
  }

  function refetchTransmittalItems() {
    refetchItems({
      params: `${transmittalData?.id}/items`,
      query: { status: "returned" },
    });
  }

  useEffect(() => {
    if (!transmittalId || !user?.client.id) return;

    refetchTransmittal({
      params: `${transmittalId}`,
      query: { include_items: true },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transmittalId, user?.client.id]);

  useEffect(() => {
    if (!transmittalData || !user?.client.id) return;

    //const businessUnitId = transmittalData.business_unit_id ?? undefined;

    refetchOperationAdminUsers({
      query: {
        client_id: user?.client.id,
        role_id: OPERATIONS_ADMIN,
      },
    });
    refetchBillingOfficerUsers({
      query: {
        client_id: user?.client.id,
        role_id: BILLING_OFFICER,
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transmittalData?.id, transmittalData?.business_unit_id, user?.client.id]);

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

  //const isRejected = transmittalData?.status === "rejected";
  const isDraft = transmittalData?.status === "draft";
  const isReturned =
    transmittalData?.status === "returned" ||
    transmittalData?.status === "partially_returned";
  //const isReturned = transmittalData?.status === "returned";
  const hasHistory =
    transmittalData?.resubmitted_as_id || transmittalData?.resubmitted_from_id;

  return (
    <div className="container mx-auto py-8">
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
                      refetchOperationAdminUsers({
                        query: {
                          client_id: user?.client.id,
                          role_id: OPERATIONS_ADMIN,
                          //business_unit_id: transmittalData.business_unit_id,
                        },
                      });
                      refetchBillingOfficerUsers({
                        query: {
                          client_id: user?.client.id,
                          role_id: BILLING_OFFICER,
                          //business_unit_id: transmittalData.business_unit_id,
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
                  {isDraft && (
                    <EditModal
                      transmittalData={transmittalData}
                      operationAdminUserData={operationAdminUserData}
                      billingOfficerUserData={billingOfficerUserData}
                      onSubmit={() => {
                        refetchOperationAdminUsers({
                          query: {
                            client_id: user?.client.id,
                            role_id: OPERATIONS_ADMIN,
                            //business_unit_id: transmittalData.business_unit_id,
                          },
                        });
                        refetchBillingOfficerUsers({
                          query: {
                            client_id: user?.client.id,
                            role_id: BILLING_OFFICER,
                            //business_unit_id: transmittalData.business_unit_id,
                          },
                        });
                        refetchTransmittals();
                      }}
                    />
                  )}
                  {isReturned && (
                    <>
                      <Button
                        onClick={() => {
                          setModalOpen(true);
                          refetchTransmittalItems();
                        }}
                      >
                        Resubmit
                      </Button>
                      <ResubmittModal
                        client_id={transmittalData.client_id}
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                        onSubmit={refetchTransmittals}
                        transmittalData={transmittalData}
                        itemLoading={itemLoading}
                        items={items}
                      />
                    </>
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
                    Billing Transmittal Number
                  </p>
                  <p className="font-medium">
                    {transmittalData.billing_transmittal_number ?? "-"}
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
              </div>

              <Separator />
              <ProofImageViewer items={transmittalData.transmittal_items} />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Uploaded Files</h3>
                <SearchTransmittalItemsComponent
                  data={filteredItems}
                  loading={transmittalLoading}
                  isDraft={isDraft}
                  transmittalId={Number(transmittalId)}
                  refetchTransmittals={refetchTransmittals}
                  onFilter={handleFilter}
                  transmittalData={transmittalData}
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

function ProofImage({ item }: { item: TransmittalItems }) {
  const { url, loading } = useSignedUrl(item.file_key);

  if (loading)
    return <div className="w-20 h-20 bg-muted animate-pulse rounded-lg" />;
  if (!url) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative w-20 h-20 cursor-pointer rounded-lg overflow-hidden border hover:opacity-80 transition">
          <Image src={url} alt={item.file_name} fill className="object-cover" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="sr-only">Proof image preview</DialogTitle>
        <div className="relative w-full aspect-video">
          <Image
            src={url}
            alt={item.file_name}
            fill
            className="object-contain"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {item.file_name}
        </p>
      </DialogContent>
    </Dialog>
  );
}

export function ProofImageViewer({ items }: { items: TransmittalItems[] }) {
  const proofs = items.filter((i) => i.category === "proof_attachment");

  if (proofs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        <h3 className="text-sm font-medium">Proof Image</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {proofs.map((item) => (
          <ProofImage key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function useSignedUrl(fileKey: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { execute } = useGetPresignedUrl();

  useEffect(() => {
    if (!fileKey) return;
    execute({ params: `/${fileKey}` })
      .then(({ data }) => {
        if (data?.url) setUrl(data.url);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey]);

  return { url, loading };
}
