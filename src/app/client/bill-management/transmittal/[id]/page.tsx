"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, ArrowLeft, RefreshCw, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetPresignedUrl, useDeleteS3Object } from "@/hooks/use-media";
import { useCurrentUser } from "@/components/providers/auth-provider";
import {
  EditModal,
  FileViewerModal,
  RejectionReasonDialog,
  PostTransmittalComponent,
  SendTransmittalComponent,
  HistoryDialog,
} from "./dialogs";
import {
  useDeleteTransmittalItem,
  useFetchTransmittal,
} from "@/hooks/use-transmittal";
import { useFetchUsers } from "@/hooks/use-user";
import { TransmittalModal } from "./dialogs";
import { StatusBadge } from "@/components/status-badge";
import { UploadFile } from "./upload-file";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { TransmittalPDF } from "./export-to-pdf";

const OPERATIONS_ADMIN = 4;

export default function TransmittalDetailPage() {
  const params = useParams();
  const transmittalId = params.id;
  const [modalOpen, setModalOpen] = useState(false);
  const [isSendMode, setIsSendMode] = useState(false);
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
  const { execute: deleteTransmittalItem } = useDeleteTransmittalItem();
  const { deleteObject: deleteS3Object, loading: deletingFile } =
    useDeleteS3Object();
  const [urlCache, setUrlCache] = useState<
    Map<string, { url: string; expires: number }>
  >(new Map());

  function refetchTransmittals() {
    refetchTransmittal({
      params: `${transmittalId}`,
      query: { include_items: true },
    });
  }

  async function handleDeleteItem(itemId: number, fileKey: string) {
    const { error: s3Error } = await deleteS3Object(fileKey);
    if (s3Error) {
      toast.error("Failed to delete file from storage");
      return;
    }

    const { error: dbError } = await deleteTransmittalItem({
      params: `/${transmittalId}/items/${itemId}`,
    });
    if (dbError) {
      toast.error("File removed from storage but failed to delete record");
      return;
    }

    refetchTransmittals();
    toast.success("File deleted successfully");
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

  const isButtonDisabled =
    transmittalData?.status === "accepted" ||
    transmittalData?.status === "rejected";
  const isRejected = transmittalData?.status === "rejected";
  const isDraft = transmittalData?.status === "draft";
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
                        query: { client_id: user?.client.id },
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
                  <PDFDownloadLink
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
                  </PDFDownloadLink>
                  <RejectionReasonDialog transmittalData={transmittalData} />
                  {hasHistory && <HistoryDialog id={transmittalData.id} />}
                  {!isButtonDisabled && (
                    <EditModal
                      transmittalData={transmittalData}
                      userData={userData}
                      onSubmit={() => {
                        refetchUsers({
                          query: { client_id: user?.client.id },
                        });
                        refetchTransmittals();
                      }}
                    />
                  )}
                  {isRejected && (
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
                  )}
                  {!isRejected && (
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
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {transmittalData.transmittal_date}
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
                            {isDraft && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleDeleteItem(item.id, item.file_key)
                                }
                                disabled={deletingFile}
                              >
                                Delete
                              </Button>
                            )}
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
        <UploadFile
          transmittalData={transmittalData}
          transmittalId={transmittalId ? Number(transmittalId) : undefined}
          refetchTransmittal={refetchTransmittal}
        />
      </div>
    </div>
  );
}
