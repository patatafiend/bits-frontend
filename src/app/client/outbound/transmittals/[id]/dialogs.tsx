"use client";

import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransmittalWithItems, TransmittalItems } from "@/lib/types";
import { DrawerDialog } from "@/components/drawer-dialog";
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
  disabled?: boolean;
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
              Confirm
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

export function ReturnTransmittalDialog({
  onConfirm,
  loading,
  disabled,
}: {
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Return
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Confirm Return
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to return this transmittal to draft status? 
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ForwardItemDialog({
  item,
  onConfirm,
  loading,
  disabled,
}: {
  item: TransmittalItems;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="success"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Forward
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Forward Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark this item as forwarded?
            </p>
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">File Name</p>
                <p className="text-sm font-medium truncate">{item.file_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reference Number</p>
                <p className="text-sm font-mono">{item.reference_number}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
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
              {loading ? "Processing..." : "Confirm Forward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
