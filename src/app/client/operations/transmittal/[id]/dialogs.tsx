"use client";

import { Button } from "@/components/ui/button";
import { FileText, AlertCircle } from "lucide-react";
import { useState } from "react";
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
} from "@/lib/types";
import { Edit } from "lucide-react";
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
import UserComboBox from "@/components/user-combobox";
import {
  useAssignOfficer,
  useEndorseTransmittal,
} from "@/hooks/use-transmittal";

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

export function EndorseTransmittalComponent({
  transmittalData,
  onEndorse,
}: {
  transmittalData: Transmittal;
  onEndorse: () => void;
}) {
  const { execute: endorseTransmittal, loading } = useEndorseTransmittal();
  const [open, setOpen] = useState(false);
  const isDisabled =
    transmittalData.status === "accepted" ||
    transmittalData.status === "endorsed";
  const hasItems = (transmittalData.transmittal_items?.length ?? 0) > 0;

  const handlePost = async () => {
    const { error } = await endorseTransmittal({
      body: {
        status: "endorsed",
      },
      params: `/${transmittalData.id}`,
    });
    if (error) {
      toast.error(error.message || "Failed to endorse transmittal");
      return;
    }
    setOpen(false);
    onEndorse();
    toast.success("Transmittal endorsed successfully!");
  };
  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        disabled={isDisabled}
      >
        {isDisabled ? "Endorsed" : "Endorse"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {hasItems
                ? "Confirm Endorse Transmittal"
                : "Cannot Endorse Transmittal"}
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

export function EditModal({
  transmittalData,
  userData,
  onSubmit,
}: {
  transmittalData: TransmittalWithItems;
  userData: User[] | null;
  onSubmit: () => void;
}) {
  const { execute, loading } = useAssignOfficer();
  const formSchema = z.object({
    assigned_billing_officer: z.number().nullable().optional(),
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assigned_billing_officer:
        transmittalData.assigned_billing_officer ?? undefined,
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
        assigned_billing_officer: data.assigned_billing_officer || null,
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
                name="assigned_billing_officer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Officer</FormLabel>
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
              <Button type="submit" loading={loading} className="w-full">
                Assign
              </Button>
            </Form>
          </form>
        )}
      </DrawerDialog>
    </div>
  );
}
