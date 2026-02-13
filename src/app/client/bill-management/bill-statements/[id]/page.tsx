"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useFetchInvoice } from "@/hooks/use-invoice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import { useGetPresignedUrl } from "@/hooks/use-media";
import { FileViewerModal } from "../../invoice/[id]/page";

export default function InvoiceViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params.id;
  const token = searchParams.get("token");
  const {
    data: invoiceData,
    loading,
    error,
    refetch: refetchInvoice,
  } = useFetchInvoice();
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const { execute: getPresignedUrl, loading: loadingUrl } =
    useGetPresignedUrl();
  const [urlCache, setUrlCache] = useState<
    Map<string, { url: string; expires: number }>
  >(new Map());

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

//   const getStatusBadge = (status: string) => {
//     if (!status) return null;

//     const variants: Record<string, "default" | "secondary" | "destructive"> = {
//       paid: "default",
//       pending: "secondary",
//       overdue: "destructive",
//     };
//     return (
//       <Badge variant={variants[status] || "default"}>
//         {status.charAt(0).toUpperCase() + status.slice(1)}
//       </Badge>
//     );
//   };

  useEffect(() => {
    if (invoiceId) {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      refetchInvoice({
        params: `/receiver/${invoiceId}`,
        query: { include_items: true },
        headers,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Invoice not found
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Invoice #{invoiceData.invoice_number}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Client: {invoiceData.billing_receiver_id}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-semibold">
                {new Date(invoiceData.invoice_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-semibold">
                {new Date(invoiceData.invoice_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Attached Documents</h3>
            {invoiceData.invoice_items &&
            invoiceData.invoice_items.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {invoiceData.invoice_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(parseInt(item.file_size) / 1024 / 1024).toFixed(2)}{" "}
                          MB • {new Date(item.uploaded_at).toLocaleDateString()}
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
                      disabled={loadingUrl}
                    >
                      {loadingUrl ? "Loading..." : "View"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents attached to this invoice</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Reject Invoice
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Accept Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      <FileViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}
