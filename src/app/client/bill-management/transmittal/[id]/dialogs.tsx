"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  History,
  CheckCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import {
  FileViewerModalProps,
  TransmittalWithItems,
  User,
  Transmittal,
  TransmittalItems,
} from "@/lib/types";
import { Edit } from "lucide-react";
import z from "zod";
import { DatePicker } from "@/components/date-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DrawerDialog } from "@/components/drawer-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormLabel,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import UserComboBox from "@/components/user-combobox";
import {
  useFetchHistory,
  useItemAction,
  usePostTransmittal,
  useReturnTransmittal,
  useSendTransmittal,
  useUpdateTransmittal,
  useUpdateTransmittalItemRemarks,
} from "@/hooks/use-transmittal";
import { useFetchReceivers } from "@/hooks/use-receiver";
import ReceiverComboBox from "@/components/receiver-combobox";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import Loader from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetPresignedUrl } from "@/hooks/use-media";
import { useDeleteTransmittalItem } from "@/hooks/use-transmittal";
import { useDeleteS3Object } from "@/hooks/use-media";
import { useCurrentUser } from "@/components/providers/auth-provider";
import { CancelItemButton } from "../dialogs";

export function FileViewerModal({ file, onClose }: FileViewerModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isPDF = file.type == "application/pdf";
  const isSpreadsheet =
    file.type.includes("spreadsheet") ||
    file.type.includes("excels") ||
    file.name.match(/\.(xlsx|xls|csv)$/i);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.name;
      link.click();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error("Download failed. Please try again :" + error);
    } finally {
      setIsDownloading(false);
    }
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                loading={isDownloading}
              >
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

export function SendTransmittalComponent({
  transmittalData,
  onSend,
}: {
  transmittalData: TransmittalWithItems;
  onSend: () => void;
}) {
  const { execute: sendTransmittal, loading } = useSendTransmittal();
  const {
    data: receivers,
    refetch: refetchReceivers,
    loading: receiversLoading,
  } = useFetchReceivers();
  const [open, setOpen] = useState(false);
  const [billingReceiverId, setBillingReceiverId] = useState<number | null>(
    null,
  );
  const [ccEmails, setCcEmails] = useState("");
  const [receiverError, setReceiverError] = useState("");
  const user = useCurrentUser();

  const isDisabled =
    transmittalData.status === "sent" || transmittalData.status === "accepted";
  const hasItems = (transmittalData.transmittal_items?.length ?? 0) > 0;

  useEffect(() => {
    if (open && hasItems) {
      refetchReceivers({
        params: `${user?.client.id}`,
        query: {
          client_id: `${user?.client.id}`,
          is_active: true,
          receive_invoices: true,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasItems]);

  const handleSend = async () => {
    if (!billingReceiverId) {
      setReceiverError("Please select a billing receiver");
      return;
    }

    const ccList =
      ccEmails
        ?.split(",")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email && email.includes("@")) ?? [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of ccList) {
      if (!emailRegex.test(email)) {
        toast.error(`Invalid email format: ${email}`);
        return;
      }
    }

    const { error } = await sendTransmittal({
      body: {
        billing_receiver_id: billingReceiverId,
        cc_emails: ccList.length > 0 ? ccList : null,
      },
      params: `/${transmittalData.id}/send`,
    });

    if (error) {
      toast.error(error.message || "Failed to send transmittal");
      return;
    }
    setOpen(false);
    onSend();
    toast.success("Transmittal sent successfully!");
  };

  const selectedReceiver = receivers?.find((r) => r.id === billingReceiverId);

  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        disabled={isDisabled}
      >
        {isDisabled ? "Sent" : "Send"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {hasItems ? "Send Transmittal" : "Cannot Send Transmittal"}
            </DialogTitle>
          </DialogHeader>

          {hasItems ? (
            <div className="space-y-4">
              {/* Receiver Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Billing Receiver <span className="text-destructive">*</span>
                </label>
                {receiversLoading ? (
                  <div className="h-10 bg-muted animate-pulse rounded-md" />
                ) : (
                  <ReceiverComboBox
                    value={billingReceiverId ? String(billingReceiverId) : ""}
                    onValueChange={(val) => {
                      setBillingReceiverId(val ? Number(val) : null);
                      setReceiverError("");
                    }}
                    receiverData={receivers ?? []}
                    placeholder="Select a receiver..."
                  />
                )}
                {receiverError && (
                  <p className="text-xs text-destructive">{receiverError}</p>
                )}
              </div>

              {/* CC Emails */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  CC Emails (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple emails with commas
                </p>
              </div>

              {/* Confirmation Details */}
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transmittal</span>
                  <span className="font-medium">
                    {transmittalData.transmittal_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(
                      transmittalData.transmittal_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">
                    {transmittalData.transmittal_items.length} attached
                  </span>
                </div>
                {selectedReceiver && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient</span>
                    <span className="font-medium">
                      {selectedReceiver.receiver_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={loading || receiversLoading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Sending..." : "Confirm Send"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm">
                  No files attached. Please upload at least one billing
                  statement before sending.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PostTransmittalComponent({
  transmittalData,
  onPost,
}: {
  transmittalData: Transmittal;
  onPost: () => void;
}) {
  const { execute: postTransmittal, loading } = usePostTransmittal();
  const [open, setOpen] = useState(false);
  const isDisabled =
    transmittalData.status === "pending" ||
    transmittalData.status === "accepted";
  const hasItems = (transmittalData.transmittal_items?.length ?? 0) > 0;

  const handlePost = async () => {
    const { error } = await postTransmittal({
      body: {
        status: "pending",
      },
      params: `/${transmittalData.id}`,
    });
    if (error) {
      toast.error(error.message || "Failed to post transmittal");
      return;
    }
    setOpen(false);
    onPost();
    toast.success("Transmittal posted successfully!");
  };
  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        disabled={isDisabled}
      >
        {isDisabled ? "Posted" : "Post"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {hasItems
                ? "Confirm Post Transmittal"
                : "Cannot Post Transmittal"}
            </DialogTitle>
          </DialogHeader>

          {hasItems ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transmittal</span>
                  <span className="font-medium">
                    {transmittalData.transmittal_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(
                      transmittalData.transmittal_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">
                    {transmittalData.transmittal_items.length} attached
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePost}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Posting..." : "Confirm Post"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm">
                  No files attached. Please upload at least one billing
                  statement before posting.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditModal({
  transmittalData,
  operationAdminUserData,
  billingOfficerUserData,
  onSubmit,
}: {
  transmittalData: TransmittalWithItems;
  operationAdminUserData: User[] | null;
  billingOfficerUserData: User[] | null;
  onSubmit: () => void;
}) {
  const { execute, loading } = useUpdateTransmittal();
  const formSchema = z.object({
    billing_transmittal_number: z
      .string()
      .min(1, "Billing Transmittal Number is required"),
    transmittal_date: z
      .string()
      .default(new Date().toISOString().split("T")[0]),
    billing_receiver_id: z.number().optional(),
    assigned_operation_admin: z.number().nullable().optional(),
    assigned_billing_officer: z.number().nullable().optional(),
    billing_receiver_email: z
      .string()
      .email("Invalid email")
      .optional()
      .or(z.literal("")),
    billing_receiver_name: z.string().optional(),
    billing_receiver_company: z.string().optional(),
    billing_cutoff: z.string().default(new Date().toISOString().split("T")[0]),
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billing_transmittal_number:
        transmittalData.billing_transmittal_number ?? "",
      transmittal_date: transmittalData.transmittal_date,
      //billing_receiver_id: transmittalData.billing_receiver_id ?? null,
      assigned_operation_admin:
        transmittalData.assigned_operation_admin ?? undefined,
      assigned_billing_officer:
        transmittalData.assigned_billing_officer ?? undefined,
      billing_receiver_email: transmittalData.billing_receiver_email ?? "",
      billing_receiver_name: transmittalData.billing_receiver_name ?? "",
      billing_receiver_company: transmittalData.billing_receiver_company ?? "",
      billing_cutoff: transmittalData.billing_cutoff,
    },
  });

  async function handleSubmit(
    data: z.infer<typeof formSchema>,
    close: () => void,
  ) {
    const { error } = await execute({
      params: `/${transmittalData.id}`,
      body: {
        id: transmittalData.id,
        billing_transmittal_number: data.billing_transmittal_number,
        transmittal_date: data.transmittal_date,
        assigned_operation_admin: data.assigned_operation_admin || null,
        assigned_billing_officer: data.assigned_billing_officer || null,
        billing_receiver_email: data.billing_receiver_email || null,
        billing_receiver_name: data.billing_receiver_name,
        billing_receiver_company: data.billing_receiver_company,
        billing_cutoff: data.billing_cutoff,
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transmittal updated successfully");
    close();
    onSubmit();
  }

  return (
    <div>
      <DrawerDialog
        title="Edit Transmittal"
        description="Edit Transmittal details"
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
                name="billing_transmittal_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Transmittal Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="BTM-2024-001"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transmittal_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmittal Date</FormLabel>
                    <FormControl>
                      <DatePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigned_operation_admin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Admin</FormLabel>
                    <FormControl>
                      <UserComboBox
                        value={field.value ?? null}
                        onValueChange={(val) => field.onChange(val)}
                        userData={operationAdminUserData ?? []}
                        allowNull
                        nullLabel="Unassigned"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assigned_billing_officer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Officer</FormLabel>
                    <FormControl>
                      <UserComboBox
                        value={field.value ?? null}
                        onValueChange={(val) => field.onChange(val)}
                        userData={billingOfficerUserData ?? []}
                        allowNull
                        nullLabel="Unassigned"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_cutoff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing CutOff</FormLabel>
                    <FormControl>
                      <DatePicker {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" loading={loading} className="w-full">
                Update Transmittal
              </Button>
            </Form>
          </form>
        )}
      </DrawerDialog>
    </div>
  );
}

function buildChain(data: Transmittal[]): Transmittal[] {
  const map = new Map(data.map((t) => [t.id, t]));
  const root = data.find((t) => t.resubmitted_from_id === null);
  if (!root) return data;

  const chain: Transmittal[] = [];
  let current: Transmittal | undefined = root;
  while (current) {
    chain.push(current);
    current = current.resubmitted_as_id
      ? map.get(current.resubmitted_as_id)
      : undefined;
  }
  return chain;
}

export function HistoryDialog({ id }: { id: number }) {
  const { data, refetch, loading } = useFetchHistory();
  const user = useCurrentUser();

  async function handleRefresh() {
    refetch({ query: { transmittal_id: id } });
  }

  useEffect(() => {
    if (!id && user?.client.id) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chain = useMemo(() => (data ? buildChain(data) : []), [data]);

  return (
    <DrawerDialog
      title="Resubmission History"
      description=""
      responsive
      className="max-w-2xl"
      renderTrigger={
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      }
    >
      <div className="px-4 sm:px-0 pb-4">
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transmittal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Resubmitted As</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chain.map((transmittal, index) => {
              const isLast = index === chain.length - 1;
              const next = chain[index + 1];
              return (
                <TableRow key={transmittal.id}>
                  <TableCell className="font-medium">
                    {transmittal.transmittal_number}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={transmittal.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {transmittal.created_at
                      ? format(new Date(transmittal.created_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {isLast ? (
                      <span className="text-muted-foreground text-sm">—</span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Link
                          href={`/client/bill-management/transmittal/${next.id}`}
                          className=""
                        >
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-sm md:text-base leading-tight"
                          >
                            {next.transmittal_number}
                          </Button>
                        </Link>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
            Are you sure you want to tag this transmittal as forwarded? This
            action cannot be undone.
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

export function ReturnTransmittalComponent({
  transmittalData,
  onReturn,
}: {
  transmittalData: Transmittal;
  onReturn: () => void;
}) {
  const { execute: returnTransmittal, loading } = useReturnTransmittal();
  const [open, setOpen] = useState(false);
  const isDisabled =
    transmittalData.status === "accepted" ||
    transmittalData.status === "endorsed";
  const hasItems = (transmittalData.transmittal_items?.length ?? 0) > 0;

  const handlePost = async () => {
    const { error } = await returnTransmittal({
      body: {
        status: "draft",
      },
      params: `/${transmittalData.id}`,
    });
    if (error) {
      toast.error(error.message || "Failed to endorse transmittal");
      return;
    }
    setOpen(false);
    onReturn();
    toast.success("Transmittal returned successfully!");
  };
  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        disabled={isDisabled}
      >
        {isDisabled ? "Returned" : "Return"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {hasItems
                ? "Confirm Return Transmittal"
                : "Cannot Return Transmittal"}
            </DialogTitle>
          </DialogHeader>

          {hasItems ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transmittal</span>
                  <span className="font-medium">
                    {transmittalData.transmittal_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(
                      transmittalData.transmittal_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium">
                    {transmittalData.transmittal_items.length} attached
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePost}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Posting..." : "Confirm Post"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm">
                  No files attached. Please upload at least one billing
                  statement before endorsing.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SearchTransmittalItemsComponent({
  data,
  transmittalData,
  onFilter,
  loading,
  isDraft,
  transmittalId,
  refetchTransmittals,
}: {
  data: TransmittalItems[];
  transmittalData: Transmittal;
  loading: boolean;
  isDraft: boolean;
  transmittalId: number;
  refetchTransmittals: () => void;
  onFilter: (params: { search?: string; status?: string }) => void;
}) {
  const user = useCurrentUser();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urlCache, setUrlCache] = useState<
    Map<string, { url: string; expires: number }>
  >(new Map());
  const { execute: getPresignedUrl, loading: loadingUrl } =
    useGetPresignedUrl();
  const { execute: deleteTransmittalItem } = useDeleteTransmittalItem();
  const { deleteObject: deleteS3Object, loading: deletingFile } =
    useDeleteS3Object();
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilter({
        search: query,
        status: statusFilter,
      });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
  }

  function handleClear() {
    setQuery("");
    setStatusFilter("all");
  }

  async function handleDeleteItem(itemId: number, fileKey: string) {
    const { error: s3Error } = await deleteS3Object(fileKey);
    if (s3Error) {
      toast.error("Failed to delete file from storage");
      return;
    }

    const { error: dbError } = await deleteTransmittalItem({
      params: `/${transmittalId}/items/${itemId}`,
    });
    if (dbError) {
      toast.error("File removed from storage but failed to delete record");
      return;
    }

    refetchTransmittals();
    toast.success("File deleted successfully");
  }

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
  const isDirty = query || statusFilter !== "all";
  const canReturn =
    transmittalData.status === "forwarded" ||
    transmittalData.status === "returned" ||
    transmittalData.status === "rejected" ||
    transmittalData.status === "partially_returned";

  const allItems = data;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search by transmittal number or date..."
          value={query}
          onChange={handleQueryChange}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="forwarded">Forwarded</SelectItem>
          </SelectContent>
        </Select>

        {isDirty && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <Loader loading={loading} />
      ) : allItems.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No transmittals match your search.
        </p>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          {allItems.map((item, index) => {
            const isProofAttachment = item.category === "proof_attachment";
            return (
              <div
                key={item.id}
                className={`group flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 ${
                  index !== data.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.reference_number}
                      </span>
                      <p className="text-sm font-medium truncate">
                        {item.file_name}
                      </p>
                      {item.status && <StatusBadge status={item.status} />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(parseInt(item.file_size) / 1024 / 1024).toFixed(2)} MB ·
                      uploaded {new Date(item.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="default"
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
                  {isDraft && (
                    <DeleteItemDialog
                      disabled={deletingFile}
                      onConfirm={() => handleDeleteItem(item.id, item.file_key)}
                    />
                  )}
                  {!isProofAttachment && (
                    <>
                      <RemarksDialog
                        item={item}
                        onSaveComplete={refetchTransmittals}
                      />
                      <ItemRejectionReasonDialog item={item} />
                      {(item.status === "draft" ||
                        item.status === "endorsed") && (
                        <>
                          <ForwardItemButton
                            item={item}
                            onForwardComplete={refetchTransmittals}
                          />
                          {user?.role === "admin" && (
                            <CancelItemButton
                              item={item}
                              onSuccess={refetchTransmittals}
                            />
                          )}
                        </>
                      )}
                      {canReturn && (
                        <ItemAction item={item} onClick={refetchTransmittals} />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <FileViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}

function ItemRejectionReasonDialog({ item }: { item: TransmittalItems }) {
  if (!item.rejection_reason && !item.remarks) {
    return null;
  }

  const isRejected = item.status === "rejected";

  return (
    <DrawerDialog
      title={isRejected ? "Item Rejected" : "Item Notes"}
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
      <div className="space-y-4 px-4 sm:px-0 pb-4">
        {item.rejection_reason && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {isRejected ? "Rejection Reason" : "Return Reason"}
            </h4>
            <p className="text-sm text-muted-foreground break-all">
              {item.rejection_reason}
            </p>
            {item.return_date && (
              <p className="text-xs text-muted-foreground">
                {isRejected ? "Rejected" : "Updated"} on{" "}
                {new Date(item.return_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
        {item.remarks && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Remarks</h4>
            <p className="text-sm text-muted-foreground break-all">
              {item.remarks}
            </p>
          </div>
        )}
      </div>
    </DrawerDialog>
  );
}

function RemarksDialog({
  item,
  onSaveComplete,
}: {
  item: TransmittalItems;
  onSaveComplete?: () => void;
}) {
  const { execute: updateRemarks, loading } = useUpdateTransmittalItemRemarks();
  const [remarks, setRemarks] = useState(item.remarks || "");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const maxLength = 1000;

  const hasRemarks = item.remarks && item.remarks.trim().length > 0;

  const handleSave = async (closeDialog?: () => void) => {
    const { error } = await updateRemarks({
      params: `/${item.id}/remarks`,
      body: { remarks: remarks.trim() || null },
    });

    if (error) {
      toast.error(error.message || "Failed to save remarks");
      return;
    }

    toast.success("Remarks saved successfully");
    closeDialog?.();
    onSaveComplete?.();
  };

  const handleClear = async (closeDialog?: () => void) => {
    const { error } = await updateRemarks({
      params: `/${item.id}`,
      body: { remarks: null },
    });

    if (error) {
      toast.error(error.message || "Failed to clear remarks");
      return;
    }

    toast.success("Remarks cleared");
    setShowClearConfirm(false);
    closeDialog?.();
    onSaveComplete?.();
  };

  return (
    <>
      {showClearConfirm && (
        <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Clear Remarks?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to clear the remarks for this item? This
              cannot be undone.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleClear()}
                disabled={loading}
              >
                {loading ? "Clearing..." : "Clear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DrawerDialog
        title={hasRemarks ? "Edit Remarks" : "Add Remarks"}
        description=""
        responsive
        className="max-w-md"
        renderTrigger={
          <Button variant="outline" size="sm">
            {hasRemarks ? (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Remarks
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Add Notes
              </>
            )}
          </Button>
        }
      >
        {(closeDialog) => (
          <div className="space-y-4 px-4 sm:px-0 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Remarks</label>
                <span className="text-xs text-muted-foreground">
                  {remarks.length} / {maxLength}
                </span>
              </div>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value.slice(0, maxLength))}
                placeholder="Add your remarks here..."
                className="min-h-[120px] resize-none"
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              {hasRemarks && (
                <Button
                  variant="destructive"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={loading}
                >
                  Clear
                </Button>
              )}
              <Button
                onClick={() => handleSave(closeDialog)}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DrawerDialog>
    </>
  );
}

const returnReasonSchema = z.object({
  rejection_reason: z.string().min(1, "Return reason is required").trim(),
});

type ReturnReasonFormValues = z.infer<typeof returnReasonSchema>;

function DeleteItemDialog({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <DrawerDialog
      title="Delete File"
      description="This will permanently delete the file from storage and cannot be undone."
      responsive
      className="max-w-md"
      renderTrigger={
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={disabled}
        >
          Delete
        </Button>
      }
    >
      {(close) => (
        <div className="flex justify-end gap-2 px-4 sm:px-0 pb-4">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              close?.();
            }}
          >
            Delete
          </Button>
        </div>
      )}
    </DrawerDialog>
  );
}

export function ItemAction({
  item,
  onClick,
}: {
  item: TransmittalItems;
  onClick: () => void;
}) {
  const { execute: itemAction, loading } = useItemAction();
  const [open, setOpen] = useState(false);
  const form = useForm<ReturnReasonFormValues>({
    resolver: zodResolver(returnReasonSchema),
    defaultValues: { rejection_reason: item.rejection_reason ?? "" },
  });

  const handleAction = async (action: "return" | "undo", reason?: string) => {
    const status = action === "return" ? "returned" : "forwarded";

    const { error } = await itemAction({
      query: {
        id: item.id,
        action: action,
      },
      body: {
        status: status,
        rejection_reason: action === "return" ? reason : null,
      },
    });

    if (!error) {
      if (action === "return") {
        setOpen(false);
        form.reset();
      }
      onClick();
    } else {
      toast.error(error.message);
    }
  };

  const isReturned = item?.status === "returned";

  return (
    <>
      {isReturned ? (
        <Button
          size="sm"
          onClick={() => handleAction("undo")}
          disabled={loading}
        >
          Undo
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)} disabled={loading}>
          Return
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Return Item
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                handleAction("return", values.rejection_reason),
              )}
              className="space-y-4"
            >
              <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  Provide a return reason. The item will be marked as returned.
                </p>
              </div>

              <FormField
                control={form.control}
                name="rejection_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Return Reason <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a reason for returning this item..."
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
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Return"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
                <p className="text-xs text-muted-foreground">
                  Reference Number
                </p>
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

function ForwardItemButton({
  item,
  onForwardComplete,
}: {
  item: TransmittalItems;
  onForwardComplete: () => void;
}) {
  const { execute: itemAction, loading } = useItemAction();

  const handleForward = async () => {
    const { error } = await itemAction({
      query: {
        id: item.id,
      },
      body: {
        status: "forwarded",
      },
    });

    if (error) {
      toast.error(error.message || "Failed to forward item");
      return;
    }

    toast.success("Item forwarded successfully");
    onForwardComplete();
  };

  return (
    <ForwardItemDialog
      item={item}
      disabled={loading}
      loading={loading}
      onConfirm={handleForward}
    />
  );
}
