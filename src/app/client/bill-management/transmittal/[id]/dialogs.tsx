"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  History,
  CheckCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import {
  FileViewerModalProps,
  TransmittalWithItems,
  User,
  Transmittal,
  TransmittalModalProps,
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
  useGenerateTMN,
  usePostTransmittal,
  useResubmitTransmittal,
  useSendTransmittal,
  useUpdateTransmittal,
} from "@/hooks/use-transmittal";
import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldSeparator,
} from "@/components/ui/field";
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
      assigned_operation_admin: transmittalData.assigned_operation_admin ?? undefined,
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

export function TransmittalModal({
  client_id,
  open,
  onOpenChange,
  onSubmit,
  transmittalData,
}: TransmittalModalProps) {
  const { execute } = useResubmitTransmittal();
  const { execute: generateTMN } = useGenerateTMN();

  const formSchema = z.object({
    transmittal_number: z.string().min(1, "Transmittal Number is required"),
    resubmitted_as_id: z.number().optional(),
    resubmitted_from_id: z.number().optional(),
    client_id: z.number().min(1, "client id required"),
    status: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transmittal_number: "",
      resubmitted_as_id: undefined,
      resubmitted_from_id: undefined,
      client_id: client_id,
      status: "Draft",
    },
  });

  useEffect(() => {
    if (client_id) {
      form.setValue("client_id", client_id);
    }
  }, [client_id, form]);

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    const { error } = await execute({
      body: {
        transmittal_number: data.transmittal_number,
        status: "Draft",
        client_id: data.client_id,
        resubmitted_from_id: Number(transmittalData?.id) ?? null,
      },
    });
    if (!error) {
      onOpenChange(false);
      onSubmit();
      toast.success("Transmittal Created Successfully!");
    } else {
      toast.error(`Error: ${error.message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transmittal Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup className="grid">
              <Field>
                <FieldLabel>Transmittal Number</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder="INV-2024-001"
                      {...form.register("transmittal_number")}
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        const { data, error } = await generateTMN();
                        if (error) {
                          toast.error(error.message);
                        }
                        if (data) {
                          form.setValue(
                            "transmittal_number",
                            data.transmittal_number,
                          );
                        }
                      }}
                    >
                      <RefreshCcw />
                      Autogenerate
                    </Button>
                  </div>
                </FieldContent>
                {form.formState.errors.transmittal_number && (
                  <FieldError>
                    {form.formState.errors.transmittal_number.message}
                  </FieldError>
                )}
              </Field>
            </FieldGroup>

            <FieldSeparator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Transmittal</Button>
            </div>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
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
  const { data, refetch } = useFetchHistory();

  useEffect(() => {
    refetch({ query: { transmittal_id: id } });
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
                    {transmittal.transmittal_date
                      ? format(
                          new Date(transmittal.transmittal_date),
                          "MMM d, yyyy",
                        )
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

export function ReturnedTransmittalDialog({
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
        Returned
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
            Are you sure you want to tag this transmittal as returned? This action cannot
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

