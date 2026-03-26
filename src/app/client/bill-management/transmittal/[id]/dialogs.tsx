"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  History,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
} from "@/hooks/use-transmittal";
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
  const [open, setOpen] = useState(false);
  const isDisabled =
    transmittalData.status === "sent" || transmittalData.status === "accepted";
  const hasItems = (transmittalData.transmittal_items?.length ?? 0) > 0;

  const handleSend = async () => {
    const { error } = await sendTransmittal({
      body: transmittalData,
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
              {hasItems
                ? "Confirm Send Transmittal"
                : "Cannot Send Transmittal"}
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
                  onClick={handleSend}
                  disabled={loading}
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
  userData,
  onSubmit,
}: {
  transmittalData: TransmittalWithItems;
  userData: User[] | null;
  onSubmit: () => void;
}) {
  const { execute, loading } = useUpdateTransmittal();
  const formSchema = z.object({
    transmittal_date: z
      .string()
      .default(new Date().toISOString().split("T")[0]),
    billing_receiver_id: z.number().optional(),
    assigned_operation_admin: z.number().nullable().optional(),
    billing_receiver_email: z
      .string()
      .email("Invalid email")
      .optional()
      .or(z.literal("")),
    billing_receiver_name: z.string().min(1, "Billing receiver name required!"),
    billing_receiver_company: z.string().min(1, "Billing company required!"),
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transmittal_date: transmittalData.transmittal_date,
      //billing_receiver_id: transmittalData.billing_receiver_id ?? null,
      assigned_operation_admin:
        transmittalData.assigned_operation_admin ?? undefined,
      billing_receiver_email: transmittalData.billing_receiver_email ?? "",
      billing_receiver_name: transmittalData.billing_receiver_name ?? "",
      billing_receiver_company: transmittalData.billing_receiver_company ?? "",
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
        transmittal_date: data.transmittal_date,
        assigned_operation_admin: data.assigned_operation_admin || null,
        billing_receiver_email: data.billing_receiver_email || null,
        billing_receiver_name: data.billing_receiver_name,
        billing_receiver_company: data.billing_receiver_company,
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
                        userData={userData ?? []}
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
                name="billing_receiver_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="receiver@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_receiver_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Jhon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_receiver_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Company</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="CMI" {...field} />
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
        status: "returned",
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
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No transmittals match your search.
        </p>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          {data.map((item, index) => (
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

              <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
                {isDraft && (
                  <DeleteItemDialog
                    disabled={deletingFile}
                    onConfirm={() => handleDeleteItem(item.id, item.file_key)}
                  />
                )}
                {canReturn && (
                  <ItemAction item={item} onClick={refetchTransmittals} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <FileViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}

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

  const handleAction = async (action: "return" | "undo") => {
    const status = action === "return" ? "returned" : "forwarded";

    const { error } = await itemAction({
      query: {
        id: item.id,
        action: action,
      },
      body: {
        status: status,
      },
    });

    if (!error) {
      onClick();
    } else {
      toast.error(error.message);
    }
  };

  const isReturned = item?.status === "returned";

  return (
    <>
      {isReturned ? (
        <Button onClick={() => handleAction("undo")} disabled={loading}>
          Undo
        </Button>
      ) : (
        <Button onClick={() => handleAction("return")} disabled={loading}>
          Return
        </Button>
      )}
    </>
  );
}
