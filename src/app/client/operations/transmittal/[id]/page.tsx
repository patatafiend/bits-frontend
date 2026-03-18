"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetPresignedUrl } from "@/hooks/use-media";
import { useCurrentUser } from "@/components/providers/auth-provider";
import {
  EditModal,
  FileViewerModal,
  EndorseTransmittalComponent,
} from "./dialogs";
import { HistoryDialog } from "@/app/client/bill-management/transmittal/[id]/dialogs";
import { useFetchTransmittal } from "@/hooks/use-transmittal";
import { useFetchUsers } from "@/hooks/use-user";
import { StatusBadge } from "@/components/status-badge";
// import { PDFDownloadLink } from "@react-pdf/renderer";
// import { TransmittalPDF } from "./export-to-pdf";

const BILLING_OFFICER = 3;

export default function TransmittalDetailPage() {
  const params = useParams();
  const transmittalId = params.id;
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const user = useCurrentUser();
  const {
    data: transmittalData,
    refetch: refetchTransmittal,
    loading: transmittalLoading,
  } = useFetchTransmittal();
  const { data: userData, refetch: refetchUsers } = useFetchUsers();
  const { execute: getPresignedUrl, loading: loadingUrl } =
    useGetPresignedUrl();
  const [urlCache, setUrlCache] = useState<
    Map<string, { url: string; expires: number }>
  >(new Map());

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

  async function handleViewFile(
    filekey: string,
    fileName: string,
    fileType: string,
  ) {
    const cached = urlCache.get(filekey);
    if (cached && cached.expires > Date.now()) {
      setViewingFile({ url: cached.url, name: fileName, type: fileType });
      return;
    }
    const { data, error } = await getPresignedUrl({
      params: `/${filekey}`,
    });

    if (error || !data) {
      toast.error("Failed to generate file URL");
      return;
    }

    setUrlCache(
      new Map(
        urlCache.set(filekey, {
          url: data.url,
          expires: Date.now() + 50 * 60 * 1000,
        }),
      ),
    );

    setViewingFile({ url: data.url, name: fileName, type: fileType });
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
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {transmittalData.transmittal_date}
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

              {transmittalData?.transmittal_items &&
                transmittalData.transmittal_items.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Uploaded Files</h3>
                    </div>

                    <div className="divide-y rounded-lg border">
                      {transmittalData.transmittal_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {item.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(
                                  parseInt(item.file_size) /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB •{" "}
                                {new Date(
                                  item.uploaded_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleViewFile(
                                  item.file_key,
                                  item.file_name,
                                  item.file_type,
                                )
                              }
                            >
                              {loadingUrl ? "Loading..." : "View"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FileViewerModal
                      file={viewingFile}
                      onClose={() => setViewingFile(null)}
                    />
                  </div>
                )}

              {(!transmittalData?.transmittal_items ||
                transmittalData.transmittal_items.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No files uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
