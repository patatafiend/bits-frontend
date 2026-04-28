"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ImageIcon, RefreshCw, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/providers/auth-provider";
import {
  useFetchTransmittal,
  useForwardTransmittal,
  useReturnTransmittal,
} from "@/hooks/use-transmittal";
import { ForwardTransmittalDialog, ReturnTransmittalDialog } from "./dialogs";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatFullName } from "@/lib/utils";
import { SearchTransmittalItemsComponent } from "@/app/client/operations/transmittal/[id]/dialogs";
import { TransmittalItems } from "@/lib/types";
import { UploadFile } from "@/app/client/bill-management/transmittal/[id]/upload-file";
import Image from "next/image";
import { useGetPresignedUrl } from "@/hooks/use-media";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TransmittalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transmittalId = params.id;
  const user = useCurrentUser();
  const {
    data: transmittalData,
    refetch: refetchTransmittal,
    loading: transmittalLoading,
  } = useFetchTransmittal();
  const { execute: updateStatus, loading: loadingUpdate } =
    useForwardTransmittal();
  const { execute: returnTransmittal, loading: loadingReturn } =
    useReturnTransmittal();
  const [filteredItems, setFilteredItems] = useState<TransmittalItems[]>([]);
  const [showReturnToggle, setShowReturnToggle] = useState(false);

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

  async function handleReturnStatus() {
    const { error } = await returnTransmittal({
      params: `/${transmittalData?.id}`,
      body: { status: "pending" },
    });
    if (error) {
      toast.error(`Failed to return transmittal: ${error.message}`);
    } else {
      toast.success("Transmittal returned successfully!");
    }
    refetchTransmittals();
  }

  const canShowEndorsedActions = transmittalData?.status === "endorsed";
  const canReturnPerItem = transmittalData?.status === "forwarded";

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
                  {canShowEndorsedActions && showReturnToggle && (
                    <ReturnTransmittalDialog
                      onConfirm={() => {
                        handleReturnStatus();
                        router.push("./");
                      }}
                      loading={loadingReturn}
                    />
                  )}
                  {canShowEndorsedActions && (
                    <ForwardTransmittalDialog
                      onConfirm={() => handleUpdateStatus("forwarded")}
                      loading={loadingUpdate}
                    />
                  )}
                  {canShowEndorsedActions && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReturnToggle(!showReturnToggle)}
                      className={showReturnToggle ? "bg-muted" : ""}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showReturnToggle ? "rotate-180" : ""
                        }`}
                      />
                      More Options
                    </Button>
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
                  <p className="text-sm text-muted-foreground">
                    Billing Officer
                  </p>
                  <p className="font-medium">
                    {transmittalData.billing_officer_assigned
                      ? formatFullName(transmittalData.billing_officer_assigned, true)
                      : "No officer assigned"}
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
                  onFilter={handleFilter}
                  forceShowViewButton
                  allowFileDownload={false}
                  enableItemActions
                  itemActionMode="return"
                  onItemActionComplete={refetchTransmittals}
                />
              </div>
            </CardContent>
          </Card>
        )}
        {(transmittalData?.status == "endorsed" || transmittalData?.status == "forwarded") && (
          <UploadFile
            mode="proof_attachment"
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
