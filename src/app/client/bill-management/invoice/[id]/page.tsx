"use client";

import { useParams } from "next/navigation";
import useFileUpload from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAddItemToInvoice, useFetchInvoice } from "@/hooks/use-invoice";
import { useEffect } from "react";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params?.id as string;
  const {
    data: invoiceData,
    refetch: refetchInvoice,
    loading: invoiceLoading,
  } = useFetchInvoice();
  // const { data: invoiceItems, refetch: refetchInvoiceItems } =
  //   useFetchInvoiceItems();
  const { execute: addItemToInvoice, loading: addingItem } =
    useAddItemToInvoice();

  useEffect(() => {
    if (invoiceId) {
      refetchInvoice({
        params: `${invoiceId}`,
        query: { include_items: true },
      });
    }
    // refetchInvoiceItems({ params: `${invoiceId}/items` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    file,
    fileUrl,
    progress,
    error,
    uploading,
    compressing,
    handleFileChange,
    uploadFileToS3,
    reset,
  } = useFileUpload();

  async function handleAddItem() {
    if (!file || !invoiceData) return;

    try {
      // Step 1: Upload to S3
      const url = await uploadFileToS3("billing-statements");

      if (!url) {
        toast.error("Failed to upload file to S3. Please try again.");
        return;
      }

      // Step 2: Save metadata to database
      const s3Key = url.split(".com/")[1];

      const { error: dbError } = await addItemToInvoice({
        body: [
          {
            invoice_id: invoiceData.id,
            file_name: file.name,
            file_key: s3Key,
            file_size: file.size.toString(),
            file_type: file.type,
            s3_bucket: "bits-staging-bucket",
          },
        ],
        params: `/${invoiceId}/items`,
      });

      if (dbError) {
        // File uploaded to S3 but database save failed
        // TODO: Implement S3 cleanup or retry logic
        toast.error(
          `File uploaded but failed to save record: ${dbError.message}. Please contact support.`,
        );
        return;
      }

      // Step 3: Success - refresh and reset
      await refetchInvoice({
        params: `${invoiceId}`,
        query: { include_items: true },
      });
      reset();
      console.log("File uploaded and saved successfully!");
    } catch (err) {
      console.error("Unexpected error during upload:", err);
      toast.error(
        "An unexpected error occurred. Please try again or contact support.",
      );
    }
  }

  const getStatusBadge = (status: string) => {
    if (!status) return null;

    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
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
        {/* Invoice Details */}
        {invoiceData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Details</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(invoiceData?.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchInvoice({
                        params: `${invoiceId}`,
                        query: { include_items: true },
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
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {invoiceData.billing_receiver_id}
                  </p>
                </div>
              </div>

              <Separator />

              {invoiceData?.invoice_items &&
                invoiceData.invoice_items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Uploaded Files</h3>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const fileUrl = `https://${item.s3_bucket}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${item.file_key}`;
                              window.open(fileUrl, "_blank");
                            }}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Show message if no files uploaded yet */}
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

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Billing Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input */}
            <div className="space-y-2">
              <label htmlFor="file-upload" className="text-sm font-medium">
                Select File
              </label>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,.pdf,.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={handleFileChange}
                disabled={uploading || compressing}
              />
            </div>

            {/* Selected File Info */}
            {file && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* Compression Status */}
            {compressing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Compressing image...
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Success Message */}
            {fileUrl && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  File uploaded successfully!
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddItem}
                disabled={
                  !file || uploading || compressing || addingItem || !!fileUrl
                }
                className="flex-1"
              >
                {uploading
                  ? "Uploading..."
                  : addingItem
                    ? "Saving..."
                    : "Upload File"}
              </Button>
              {(file || fileUrl) && (
                <Button
                  onClick={reset}
                  variant="outline"
                  disabled={uploading || compressing || addingItem}
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Public URL (for testing) */}
            {fileUrl && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  File URL:
                </label>
                <p className="text-xs break-all bg-muted p-2 rounded">
                  {fileUrl}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
