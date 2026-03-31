import { TransmittalModalProps } from "@/lib/types";
import {
  useResubmitTransmittal,
  useGenerateTMN,
} from "@/hooks/use-transmittal";
import { useMultiFileUpload } from "@/hooks/use-multi-file-upload";
import { useAddItemToTransmittal } from "@/hooks/use-transmittal";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  RefreshCcw,
  FileText,
  Loader2,
  Upload,
  X,
  CheckCircle,
} from "lucide-react";
import { TransmittalItems } from "@/lib/types";
import BusinessUnitComboBox from "@/components/business-units";
import { useFetchBusinessUnits } from "@/hooks/use-client";

type ReplacementFile = {
  file: File;
  uploaded: boolean;
  url?: string;
  error?: string;
};

export function ResubmittModal({
  client_id,
  open,
  onOpenChange,
  onSubmit,
  transmittalData,
  itemLoading,
  items,
}: TransmittalModalProps) {
  const { execute } = useResubmitTransmittal();
  const { execute: generateTMN } = useGenerateTMN();
  const { execute: addItemToTransmittal } = useAddItemToTransmittal();
  const { data: businessUnitData, refetch: refetchBusinessUnits } =
    useFetchBusinessUnits();
  const { uploadFiles, reset: resetUploads } = useMultiFileUpload({
    concurrency: 3,
  });

  const [replacements, setReplacements] = useState<
    Record<number, ReplacementFile>
  >({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const formSchema = z.object({
    transmittal_number: z.string().min(1, "Transmittal Number is required"),
    resubmitted_as_id: z.number().optional(),
    resubmitted_from_id: z.number().optional(),
    client_id: z.number().min(1, "client id required"),
    business_unit_id: z.number().min(1, "Business Unit is required"),
    status: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transmittal_number: "",
      resubmitted_as_id: undefined,
      resubmitted_from_id: undefined,
      client_id: client_id,
      business_unit_id: transmittalData?.business_unit_id,
      status: "Resubmitted",
    },
  });

  useEffect(() => {
    if (!open || !client_id) return;
    form.setValue("client_id", client_id);
    form.setValue(
      "business_unit_id",
      transmittalData?.business_unit_id as number,
      { shouldValidate: true },
    );
    refetchBusinessUnits({ params: `${client_id}/business_units` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id, open, transmittalData?.business_unit_id]);

  function handleOpenChange(value: boolean) {
    if (!value) {
      setReplacements({});
      resetUploads();
    }
    onOpenChange(value);
  }

  function handleFileSelect(itemId: number, file: File) {
    setReplacements((prev) => ({
      ...prev,
      [itemId]: { file, uploaded: false },
    }));
  }

  function removeReplacement(itemId: number) {
    setReplacements((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    const missingReplacements = returnedItems?.filter(
      (item) => !replacements[item.id],
    );

    if (missingReplacements?.length) {
      toast.error(
        `Please upload replacement files for all returned items (${missingReplacements.length} missing)`,
      );
      return;
    }
    const { data: newTransmittal, error } = await execute({
      body: {
        transmittal_number: data.transmittal_number,
        status: "Draft",
        client_id: data.client_id,
        business_unit_id: data.business_unit_id,
        resubmitted_from_id: Number(transmittalData?.id) ?? null,
      },
    });

    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    const replacementEntries = Object.entries(replacements);
    if (replacementEntries.length > 0 && newTransmittal?.id) {
      const filesToUpload = replacementEntries.map(([, r]) => r.file);

      const urls = await uploadFiles(filesToUpload, "billing-statements");
      if (!urls || urls.length === 0) {
        toast.error(
          "Transmittal created but failed to upload replacement files.",
        );
      } else {
        const itemPayload = replacementEntries.map(([itemIdStr, r], index) => {
          const itemId = Number(itemIdStr);
          const urlObj = new URL(urls[index]);
          const s3Key = urlObj.pathname.substring(1);

          const originalItem = (items as TransmittalItems[])?.find(
            (item) =>
              item.id === itemId && item.category === "billing_statement",
          );

          return {
            transmittal_id: newTransmittal.id,
            transmittal_item_number: null,
            reference_number: originalItem?.reference_number,
            return_date: null,
            status: "resubmitted",
            category: "billing_statement",
            file_name: r.file.name,
            file_key: s3Key,
            file_size: r.file.size.toString(),
            file_type: r.file.type,
            s3_bucket: `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}`,
            resubmitted_from_item_id: itemId,
          };
        });

        const { error: dbError } = await addItemToTransmittal({
          body: itemPayload,
          params: `/${newTransmittal.id}/items`,
        });

        if (dbError) {
          toast.error(
            `Files uploaded but failed to save records: ${dbError.message}`,
          );
          return;
        }
      }
    }

    handleOpenChange(false);
    onSubmit();
    toast.success("Transmittal Resubmitted Successfully!");
  }

  const returnedItems = (items as TransmittalItems[])?.filter(
    (item) =>
      item.status?.toLowerCase() === "returned" &&
      item.category === "billing_statement",
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <Input
                      type="text"
                      placeholder="INV-2024-001"
                      {...form.register("transmittal_number")}
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        const { data, error } = await generateTMN();
                        if (!error) toast.success("Number Generated!");
                        else toast.error(error.message);
                        if (data)
                          form.setValue(
                            "transmittal_number",
                            data.transmittal_number,
                          );
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

              <Field>
                <FieldLabel>Business Unit</FieldLabel>
                <FieldContent>
                  <BusinessUnitComboBox
                    value={form.watch("business_unit_id") ?? null}
                    onValueChange={(val) =>
                      form.setValue("business_unit_id", val as number, {
                        shouldValidate: true,
                      })
                    }
                    businessUnitData={businessUnitData ?? null}
                    placeholder="Select business unit..."
                  />
                </FieldContent>
                {form.formState.errors.business_unit_id && (
                  <FieldError>
                    {form.formState.errors.business_unit_id.message}
                  </FieldError>
                )}
              </Field>
            </FieldGroup>

            <FieldSeparator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Returned Items
              </h3>

              {itemLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading items...</span>
                </div>
              ) : !returnedItems?.length ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No returned items found.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Replace File</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnedItems.map((item) => {
                        const replacement = replacements[item.id];
                        return (
                          <TableRow
                            key={item.id}
                            className={
                              !replacement
                                ? "bg-red-50/50 dark:bg-red-950/20"
                                : ""
                            }
                          >
                            <TableCell className="text-muted-foreground text-xs">
                              {item.reference_number}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate max-w-[180px] text-sm font-medium">
                                  {item.file_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="file"
                                className="hidden"
                                ref={(el) => {
                                  fileInputRefs.current[item.id] = el;
                                }}
                                accept="image/*,.pdf,.xlsx,.xls,.csv"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelect(item.id, file);
                                  e.target.value = "";
                                }}
                              />

                              {replacement ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                  <span
                                    className="text-xs truncate max-w-[120px] text-green-700"
                                    title={replacement.file.name}
                                  >
                                    {replacement.file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeReplacement(item.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5"
                                  onClick={() =>
                                    fileInputRefs.current[item.id]?.click()
                                  }
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  Upload
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <FieldSeparator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Resubmit</Button>
            </div>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}
