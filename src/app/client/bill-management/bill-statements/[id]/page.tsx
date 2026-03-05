"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useReceiverAction } from "@/hooks/use-transmittal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import { useGetPresignedUrl } from "@/hooks/use-media";
import { FileViewerModal } from "../../transmittal/[id]/dialogs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFetchTransmittal } from "@/hooks/use-transmittal";

export default function TransmittalViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const transmittalId = params.id;
  const token = searchParams.get("token");
  const {
    data: transmittalData,
    loading,
    error,
    refetch: refetchTransmittal,
  } = useFetchTransmittal();
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
  const { execute: receiverAction, loading: actionLoading } =
    useReceiverAction();

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
    if (transmittalId) {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      refetchTransmittal({
        params: `/receiver/${transmittalId}`,
        query: { include_items: true },
        headers,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccept() {
    const { error } = await receiverAction({
      params: `${transmittalId}/accept`,
      query: { rejection_reason: null },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (error) {
      toast.error("Failed to accept transmittal");
      return;
    }
    toast.success("Transmittal accepted successfully");
    refetchTransmittal({
      params: `/receiver/${transmittalId}`,
      query: { include_items: true },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async function handleReject(reason: string) {
    const { error } = await receiverAction({
      params: `${transmittalId}/reject`,
      query: { rejection_reason: reason },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (error) {
      toast.error("Failed to reject transmittal");
      return;
    }
    toast.success("Transmittal rejected successfully");
    refetchTransmittal({
      params: `/receiver/${transmittalId}`,
      query: { include_items: true },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

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

  if (!transmittalData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Transmittal not found
      </div>
    );
  }

  const isActionDisabled =
    transmittalData.status === "accepted" || transmittalData.status === "rejected";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Transmittal #{transmittalData.transmittal_number}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Transmittal Date</p>
              <p className="font-semibold">
                {new Date(transmittalData.transmittal_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Attached Documents</h3>
            {transmittalData.transmittal_items &&
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
                <p className="text-sm">No documents attached to this transmittal</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-4 justify-end">
            <RejectTransmittalDialog
              onConfirm={handleReject}
              loading={actionLoading}
              disabled={isActionDisabled}
            />
            <AcceptTransmittalDialog
              onConfirm={handleAccept}
              loading={actionLoading}
              disabled={isActionDisabled}
            />
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

export function AcceptTransmittalDialog({
  onConfirm,
  loading,
  disabled,
}: {
  onConfirm: () => void;
  loading?: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="bg-green-600 hover:bg-green-700"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Accept Transmittal
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Accept Transmittal
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to accept these invoices? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, "Rejection reason is required").trim(),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

export function RejectTransmittalDialog({
  onConfirm,
  loading,
  disabled,
}: {
  onConfirm: (reason: string) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejection_reason: "" },
  });

  function handleConfirm(values: RejectFormValues) {
    onConfirm(values.rejection_reason);
    setOpen(false);
    form.reset();
  }

  function handleClose() {
    setOpen(false);
    form.reset();
  }

  return (
    <>
      <Button
        variant="outline"
        className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Reject Transmittal
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Reject Transmittal
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleConfirm)}
              className="space-y-4"
            >
              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  This action cannot be undone. The sender will be notified with
                  your rejection reason.
                </p>
              </div>

              <FormField
                control={form.control}
                name="rejection_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Rejection Reason{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a reason for rejecting this transmittal..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="destructive" type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Reject"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
