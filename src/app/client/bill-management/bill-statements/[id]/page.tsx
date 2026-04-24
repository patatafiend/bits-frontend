"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import { useGetPresignedUrl } from "@/hooks/use-media";
import { FileViewerModal } from "../../transmittal/[id]/dialogs";
import { useFetchReceiverTransmittal } from "@/hooks/use-receiver";
import { RejectTransmittalItemAction } from "./dialogs";
import { StatusBadge } from "@/components/status-badge";

export default function TransmittalViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const transmittalId = params.id;
  const token = searchParams.get("token");
  const { data: transmittalData, refetch: refetchTransmittal } =
    useFetchReceiverTransmittal();
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

  useEffect(() => {
    if (transmittalId && token) {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      refetchTransmittal({
        params: `/${transmittalId}`,
        query: { include_items: true },
        headers,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActionDisabled =
    transmittalData?.status === "accepted" ||
    transmittalData?.status === "rejected";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2">
                <StatusBadge status={transmittalData?.status || ""} />
              </div>
              <div>Transmittal #{transmittalData?.transmittal_number}</div>
              <div>Invoice # {transmittalData?.billing_transmittal_number}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Transmittal Date</p>
              <p className="font-semibold">
                {transmittalData?.transmittal_date
                  ? new Date(
                      transmittalData.transmittal_date,
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Attached Documents</h3>
            {transmittalData?.transmittal_items &&
            transmittalData.transmittal_items.length > 0 ? (
              <div className="divide-y rounded-lg border">
                {transmittalData.transmittal_items.map((item) => (
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
                    <div className="flex items-center gap-2">
                      {item.status && <StatusBadge status={item.status} />}
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
                      <RejectTransmittalItemAction
                        item={item}
                        token={token}
                        disabled={isActionDisabled}
                        onUpdated={() =>
                          refetchTransmittal({
                            params: `/${transmittalId}`,
                            query: { include_items: true },
                            headers: token
                              ? { Authorization: `Bearer ${token}` }
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  No documents attached to this transmittal
                </p>
              </div>
            )}
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
