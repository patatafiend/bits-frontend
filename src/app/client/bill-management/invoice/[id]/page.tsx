"use client";

import { useParams } from "next/navigation";
import { useMultiFileUpload } from "@/hooks/use-multi-file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useAddItemToInvoice,
  useFetchInvoice,
  useSendInvoice,
  useUpdateInvoice,
} from "@/hooks/use-invoice";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetPresignedUrl } from "@/hooks/use-media";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import {
  UploadFileProps,
  FileViewerModalProps,
  InvoiceWithItems,
  Receiver,
} from "@/lib/types";
import { useDropzone } from "react-dropzone";
import { useFetchReceivers } from "@/hooks/use-receiver";
import { Edit } from "lucide-react";
import z from "zod";
import { DatePicker } from "@/components/date-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DrawerDialog } from "@/components/drawer-dialog";
import {
  Form,
  FormField,
  FormLabel,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useCurrentUser } from "@/components/providers/auth-provider";
import ReceiverComboBox from "@/components/receiver-combobox";

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
  const {
    data: receiverData,
    refetch: refetchReceiver,
    //loading: receiverLoading,
  } = useFetchReceivers();
  const { execute: getPresignedUrl, loading: loadingUrl } =
    useGetPresignedUrl();
  const [urlCache, setUrlCache] = useState<
    Map<string, { url: string; expires: number }>
  >(new Map());

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
        {invoiceData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Details</CardTitle>
                <div className="flex items-center gap-2">
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
                    {invoiceData.billing_receiver_id}
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

export function FileViewerModal({ file, onClose }: FileViewerModalProps) {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isPDF = file.type == "application/pdf";
  const isSpreadsheet =
    file.type.includes("spreadsheet") ||
    file.type.includes("excels") ||
    file.name.match(/\.(xlsx|xls|csv)$/i);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg truncate pr-4">
              {file.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg">
          {isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  toast.error("Image failed to load. URL may have expired.");
                  e.currentTarget.src = "";
                }}
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={file.url}
              className="w-full h-full border-0"
              title={file.name}
            />
          ) : isSpreadsheet ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Spreadsheet Preview</p>
              <p className="text-sm text-muted-foreground mb-4">
                Download to view in Excel or Google Sheets
              </p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download Spreadsheet
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Preview not available</p>
              <p className="text-sm text-muted-foreground mb-4">
                This file type cannot be previewed in the browser
              </p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ...existing code...

export function UploadFile({
  invoiceData,
  invoiceId,
  refetchInvoice,
}: UploadFileProps) {
  const { execute: addItemToInvoice, loading: addingItem } =
    useAddItemToInvoice();

  const {
    files,
    addFiles,
    removeFile,
    reset,
    uploadAll,
    isAnyUploading,
    isAnyCompressing,
    hasErrors,
    allCompleted,
  } = useMultiFileUpload({ concurrency: 3 });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      addFiles(acceptedFiles);
    },
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    disabled: isAnyUploading || isAnyCompressing,
    multiple: true,
  });

  async function handleAddItems() {
    if (files.length === 0 || !invoiceData) return;

    try {
      const urls = await uploadAll("billing-statements");

      if (!urls || urls.length === 0) {
        toast.error("Failed to upload files to S3. Please try again.");
        return;
      }

      // Prepare items for database
      const items = urls.map((url, index) => {
        const urlObj = new URL(url);
        const s3Key = urlObj.pathname.substring(1);
        const file = files[index].file;

        return {
          invoice_id: invoiceData.id,
          file_name: file.name,
          file_key: s3Key,
          file_size: file.size.toString(),
          file_type: file.type,
          s3_bucket: `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}`,
        };
      });

      const { error: dbError } = await addItemToInvoice({
        body: items,
        params: `/${invoiceId}/items`,
      });

      if (dbError) {
        toast.error(
          `Files uploaded but failed to save records: ${dbError.message}. Please contact support.`,
        );
        return;
      }

      await refetchInvoice({
        params: `${invoiceId}`,
        query: { include_items: true },
      });
      reset();
      toast.success(`Successfully uploaded ${urls.length} file(s)!`);
    } catch (err) {
      console.error("Unexpected error during upload:", err);
      toast.error(
        "An unexpected error occurred. Please try again or contact support.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Billing Statement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          } ${isAnyUploading || isAnyCompressing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm font-medium">Drop files here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drag & drop files here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: Images, PDF, Excel
              </p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.compressing && (
                    <p className="text-xs text-blue-600">Compressing...</p>
                  )}
                  {item.uploading && (
                    <div className="mt-1">
                      <Progress value={item.progress} className="h-1" />
                    </div>
                  )}
                  {item.error && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
                  )}
                  {item.url && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Uploaded
                    </p>
                  )}
                </div>
                {!item.uploading && !item.compressing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(item.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {(isAnyUploading || isAnyCompressing) && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            {isAnyCompressing ? "Compressing images..." : "Uploading files..."}
          </div>
        )}

        {hasErrors && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Some files failed to upload</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleAddItems}
            disabled={
              files.length === 0 ||
              isAnyUploading ||
              isAnyCompressing ||
              addingItem ||
              allCompleted
            }
            className="flex-1"
          >
            {isAnyUploading
              ? "Uploading..."
              : addingItem
                ? "Saving..."
                : `Upload ${files.length} File(s)`}
          </Button>
          {files.length > 0 && (
            <Button
              onClick={reset}
              variant="outline"
              disabled={isAnyUploading || isAnyCompressing || addingItem}
            >
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SendInvoiceComponent({
  invoiceData,
  onSend,
}: {
  invoiceData: InvoiceWithItems;
  onSend: () => void;
}) {
  const { execute: sendInvoice, loading } = useSendInvoice();
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!invoiceData) return;
    const { error } = await sendInvoice({
      body: invoiceData,
      params: `/${invoiceData.id}/send`,
    });
    if (error) {
      toast.error(error.message || "Failed to send invoice");
      return;
    }
    setSent(true);
    onSend();
    toast.success("Invoice sent successfully!");
  };

  return (
    <Button
      variant="default"
      onClick={handleSend}
      disabled={loading || sent || !invoiceData}
    >
      {loading ? "Sending..." : sent ? "Sent" : "Send"}
    </Button>
  );
}

export function EditModal({
  invoiceData,
  receiverData,
  onSubmit,
}: {
  invoiceData: InvoiceWithItems;
  receiverData: Receiver[] | null;
  onSubmit: () => void;
}) {
  const { execute, loading } = useUpdateInvoice();
  const formSchema = z.object({
    invoice_date: z.string().default(new Date().toISOString().split("T")[0]),
    billing_receiver_id: z.number().min(1, "no biller id"),
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_date: invoiceData.invoice_date,
      billing_receiver_id: invoiceData.billing_receiver_id ?? "",
    },
  });

  async function handleSubmit(
    data: z.infer<typeof formSchema>,
    close: () => void,
  ) {
    const { error } = await execute({
      params: `/${invoiceData.id}`,
      body: {
        id: invoiceData.id,
        invoice_date: data.invoice_date,
        billing_receiver_id: data.billing_receiver_id,
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Invoice updated successfully");
    close();
    onSubmit();
  }

  return (
    <div>
      <DrawerDialog
        title="Edit Invoice"
        description="Edit invoice details"
        renderTrigger={
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        }
      >
        {(close) => (
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await handleSubmit(values, close!);
            })}
            className="space-y-6"
          >
            <Form {...form}>
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <DatePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_receiver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receiver</FormLabel>
                    <FormControl>
                      <ReceiverComboBox
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val: string) => {
                          field.onChange(val !== "" ? Number(val) : undefined);
                        }}
                        receiverData={receiverData ?? []}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" loading={loading} className="w-full">
                Update Invoice
              </Button>
            </Form>
          </form>
        )}
      </DrawerDialog>
    </div>
  );
}
