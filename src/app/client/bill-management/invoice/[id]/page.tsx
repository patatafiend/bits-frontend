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
} from "lucide-react";
import Link from "next/link";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params?.id as string;

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

  // Mock invoice data - replace with actual API call
  const invoice = {
    id: invoiceId,
    invoiceNumber: `INV-2024-${invoiceId.padStart(3, "0")}`,
    customerName: "Acme Corp",
    customerEmail: "contact@acmecorp.com",
    amount: 1250.0,
    status: "pending",
    date: "2024-01-15",
    dueDate: "2024-02-15",
    items: [
      { description: "Service Fee", quantity: 1, price: 1000.0 },
      { description: "Additional Charges", quantity: 1, price: 250.0 },
    ],
  };

  const handleUpload = async () => {
    if (!file) return;
    const url = await uploadFileToS3("billing-statements");
    if (url) {
      console.log("File uploaded successfully for invoice:", invoiceId, url);
    }
  };

  const getStatusBadge = (status: string) => {
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Details</CardTitle>
              {getStatusBadge(invoice.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{invoice.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{invoice.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{invoice.dueDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{invoice.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium text-lg">
                  ${invoice.amount.toFixed(2)}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Line Items</h3>
              <div className="space-y-2">
                {invoice.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between p-2 bg-muted rounded"
                  >
                    <span>{item.description}</span>
                    <span className="font-medium">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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
                onClick={handleUpload}
                disabled={!file || uploading || compressing || !!fileUrl}
                className="flex-1"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </Button>
              {(file || fileUrl) && (
                <Button
                  onClick={reset}
                  variant="outline"
                  disabled={uploading || compressing}
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
