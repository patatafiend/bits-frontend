"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetPresignedUrl, useDeleteS3Object } from "@/hooks/use-media";
import { useFetchReceivers } from "@/hooks/use-receiver";
import { useCurrentUser } from "@/components/providers/auth-provider";
import {
  EditModal,
  SendInvoiceComponent,
  FileViewerModal,
  UploadFile,
  RejectionReasonDialog,
} from "./dialogs";
import {
  useDeleteTransmittalItem,
  useFetchTransmittal,
} from "@/hooks/use-transmittal";

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
  const { data: receiverData, refetch: refetchReceiver } = useFetchReceivers();
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
    refetchReceiver({
      params: `${user?.client.id}`,
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

  const getStatusBadge = (status: string) => {
    if (!status) return null;

    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "default",
      sent: "secondary",
      rejected: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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
              <div className="flex items-center justify-between">
                <CardTitle>Transmittal Details</CardTitle>
                <div className="flex items-center gap-2">
                  <RejectionReasonDialog transmittalData={transmittalData} />
                  <EditModal
                    transmittalData={transmittalData}
                    receiverData={receiverData}
                    onSubmit={() =>
                      refetchReceiver({
                        params: `${user?.client.id}`,
                      })
                    }
                  />
                  <SendInvoiceComponent
                    transmittalData={transmittalData}
                    onSend={() => {
                      refetchTransmittals();
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Invoice Number
                  </p>
                  <p className="font-medium">
                    {transmittalData.transmittal_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{transmittalData.transmittal_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receiver</p>
                  <p className="font-medium">
                    {transmittalData.billing_receiver?.receiver_name ??
                      "No receiver assigned"}
                  </p>
                  {transmittalData.billing_receiver?.receiver_email && (
                    <p className="text-sm text-muted-foreground">
                      {transmittalData.billing_receiver.receiver_email}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {getStatusBadge(transmittalData?.status)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchTransmittals();
                    refetchReceiver({
                      params: `${user?.client.id}`,
                    });
                    toast.info("Refreshing invoice data...");
                  }}
                  disabled={transmittalLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${transmittalLoading ? "animate-spin" : ""}`}
                  />
                </Button>
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
                          </div>

                          <FileViewerModal
                            file={viewingFile}
                            onClose={() => setViewingFile(null)}
                          />
                        </div>
                      ))}
                    </div>
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
