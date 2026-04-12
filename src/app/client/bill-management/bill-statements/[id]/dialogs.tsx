"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { TransmittalItems } from "@/lib/types";
import { toast } from "sonner";
import { useReceiverItemAction } from "@/hooks/use-receiver";

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
            Are you sure you want to accept these invoices? This action cannot
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

export function RejectTransmittalItemAction({
  item,
  token,
  onUpdated,
  disabled,
}: {
  item: TransmittalItems;
  token: string | null;
  onUpdated: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [latestReason, setLatestReason] = useState<string | null>(null);
  const { execute: itemAction, loading } = useReceiverItemAction();
  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejection_reason: "" },
  });

  async function handleConfirm(values: RejectFormValues) {
    const { error } = await itemAction({
      params: `${item.transmittal_id}/items/${item.id}/action`,
      query: {
        id: item.id,
        action: "return",
        
      },
      body: {
        status: "rejected",
        rejection_reason: values.rejection_reason,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (error) {
      toast.error(error.message || "Failed to update item status");
      return;
    }

    toast.success("Item rejected successfully");
    setLatestReason(values.rejection_reason);
    setOpen(false);
    form.reset();
    onUpdated();
  }

  const isRejected = item.status === "rejected";
  const itemRejectionReason = latestReason ?? item.rejection_reason ?? null;

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setOpen(true)}
          disabled={loading || disabled || isRejected}
        >
          {isRejected ? "Rejected" : "Reject"}
        </Button>

        {isRejected && itemRejectionReason && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotesOpen(true)}
          >
            Notes
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Reject Item
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleConfirm)}
              className="space-y-4"
            >
              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  This will reject only this item and notify the sender.
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
                        placeholder="Please provide a reason for rejecting this item..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleClose(false)}
                >
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

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Item Rejection Notes
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground break-all">
            {itemRejectionReason}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
