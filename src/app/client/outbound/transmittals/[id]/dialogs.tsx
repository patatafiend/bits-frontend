"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import {
  FileViewerModalProps,
  TransmittalWithItems,
} from "@/lib/types";
import z from "zod";
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
import { Textarea } from "@/components/ui/textarea";

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

export function RejectionReasonDialog({ transmittalData }: { transmittalData: TransmittalWithItems }) {
  if (transmittalData.status !== "rejected" || !transmittalData.rejection_reason) {
    return null;
  }

  return (
    <DrawerDialog
      title="Transmittal Rejected"
      description=""
      responsive
      className="max-w-md"
      renderTrigger={
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive hover:text-destructive"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Notes
        </Button>
      }
    >
      <div className="space-y-3 px-4 sm:px-0 pb-4">
        <p className="text-sm text-muted-foreground break-all">{transmittalData.rejection_reason}</p>
        {transmittalData.response_date && (
          <p className="text-xs text-muted-foreground">
            Rejected on {new Date(transmittalData.response_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </DrawerDialog>
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
        Accepted
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
        Rejected
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


