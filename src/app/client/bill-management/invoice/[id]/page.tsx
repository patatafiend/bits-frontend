"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useDeleteInvoiceItem, useFetchInvoice } from "@/hooks/use-invoice";
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
  RejectionReasonDialog
} from "./dialogs";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id;
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const user = useCurrentUser();
  const {
    data: invoiceData,
    refetch: refetchInvoice,
    loading: invoiceLoading,
  } = useFetchInvoice();
  const { data: receiverData, refetch: refetchReceiver } = useFetchReceivers();
  const { execute: getPresignedUrl, loading: loadingUrl } =
    useGetPresignedUrl();
  const { execute: deleteInvoiceItem } = useDeleteInvoiceItem();
  const { deleteObject: deleteS3Object, loading: deletingFile } =
    useDeleteS3Object();
  const [urlCache, setUrlCache] = useState<
    Map<string, { url: string; expires: number }>
  >(new Map());

  async function handleDeleteItem(itemId: number, fileKey: string) {
    const { error: s3Error } = await deleteS3Object(fileKey);
    if (s3Error) {
      toast.error("Failed to delete file from storage");
      return;
    }

    const { error: dbError } = await deleteInvoiceItem({
      params: `/${invoiceId}/items/${itemId}`,
    });
    if (dbError) {
      toast.error("File removed from storage but failed to delete record");
      return;
    }

    refetchInvoices();
    toast.success("File deleted successfully");
  }

  function refetchInvoices() {
    refetchInvoice({
      params: `${invoiceId}`,
      query: { include_items: true },
    });
  }

  useEffect(() => {
    if (!invoiceId && user?.client.id) {
      return;
    }
    refetchInvoice({
      params: `${invoiceId}`,
      query: { include_items: true },
    });
    refetchReceiver({
      params: `${user?.client.id}`,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

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
      <Link href="/client/bill-management/invoice">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
      </Link>

      <div className="grid gap-6">
        {invoiceData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Details</CardTitle>
                <div className="flex items-center gap-2">
                  <RejectionReasonDialog invoiceData={invoiceData}/>
                  <EditModal
                    invoiceData={invoiceData}
                    receiverData={receiverData}
                    onSubmit={() =>
                      refetchReceiver({
                        params: `${user?.client.id}`,
                      })
                    }
                  />
                  <SendInvoiceComponent
                    invoiceData={invoiceData}
                    onSend={() => {
                      refetchInvoices();
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
                  <p className="font-medium">{invoiceData.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{invoiceData.invoice_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receiver</p>
                  <p className="font-medium">
                    {invoiceData.billing_receivers
                      .map((r) => r.receiver_name)
                      .join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {getStatusBadge(invoiceData?.status)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchInvoices();
                    refetchReceiver({
                      params: `${user?.client.id}`,
                    });
                    toast.info("Refreshing invoice data...");
                  }}
                  disabled={invoiceLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${invoiceLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              <Separator />

              {invoiceData?.invoice_items &&
                invoiceData.invoice_items.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">Uploaded Files</h3>
                    </div>

                    <div className="divide-y rounded-lg border">
                      {invoiceData.invoice_items.map((item) => (
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

              {(!invoiceData?.invoice_items ||
                invoiceData.invoice_items.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No files uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <UploadFile
          invoiceData={invoiceData}
          invoiceId={invoiceId ? Number(invoiceId) : undefined}
          refetchInvoice={refetchInvoice}
        />
      </div>
    </div>
  );
}


