"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { FileViewerModalProps, TransmittalWithItems } from "@/lib/types";
import { DrawerDialog } from "@/components/drawer-dialog";

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

export function RejectionReasonDialog({
  transmittalData,
}: {
  transmittalData: TransmittalWithItems;
}) {
  if (
    transmittalData.status !== "rejected" ||
    !transmittalData.rejection_reason
  ) {
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
        <p className="text-sm text-muted-foreground break-all">
          {transmittalData.rejection_reason}
        </p>
        {transmittalData.response_date && (
          <p className="text-xs text-muted-foreground">
            Rejected on{" "}
            {new Date(transmittalData.response_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </DrawerDialog>
  );
}

export function ForwardTransmittalDialog({
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
        variant="success"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Forwarded
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Confirn
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to tag this transmittal as forwarded? This action cannot
            be undone.
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
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
