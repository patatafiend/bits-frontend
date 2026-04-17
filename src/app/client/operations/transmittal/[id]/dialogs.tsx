"use client";

import { Button } from "@/components/ui/button";
import { FileText, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
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
import BusinessUnitComboBox from "@/components/business-units";
import UserComboBox from "@/components/user-combobox";
import {
  useAssignOfficer,
  useEndorseTransmittal,
  useReturnTransmittal,
} from "@/hooks/use-transmittal";
import { useFetchBusinessUnits } from "@/hooks/use-client";
import { Input } from "@/components/ui/input";
import { useGetPresignedUrl } from "@/hooks/use-media";
import Loader from "@/components/ui/loader";
import { StatusBadge } from "@/components/status-badge";
import { useCurrentUser } from "@/components/providers/auth-provider";

export function FileViewerModal({
  file,
  onClose,
  allowDownload = true,
}: FileViewerModalProps) {
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
            {allowDownload && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
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
                {allowDownload
                  ? "Download to view in Excel or Google Sheets"
                  : "Preview is not available for spreadsheet files in the browser"}
              </p>
              {allowDownload && (
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Spreadsheet
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Preview not available</p>
              <p className="text-sm text-muted-foreground mb-4">
                This file type cannot be previewed in the browser
              </p>
              {allowDownload && (
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              )}
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
  onBusinessUnitChange,
}: {
  transmittalData: TransmittalWithItems;
  userData: User[] | null;
  onSubmit: () => void;
  onBusinessUnitChange?: (value: number | null) => void;
}) {
  const { execute, loading } = useAssignOfficer();
  const { data: businessUnitData, refetch: refetchBusinessUnits } =
    useFetchBusinessUnits();
  const formSchema = z.object({
    billing_transmittal_number: z
      .string()
      .min(1, "Billing Transmittal Number is required"),
    assigned_billing_officer: z.number().nullable().optional(),
    business_unit_id: z.number().nullable().optional(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      billing_transmittal_number:
        transmittalData.billing_transmittal_number ?? "",
      assigned_billing_officer:
        transmittalData.assigned_billing_officer ?? undefined,
      business_unit_id: transmittalData.business_unit_id ?? undefined,
    },
  });

  useEffect(() => {
    if (transmittalData.client_id) {
      refetchBusinessUnits({
        params: `${transmittalData.client_id}/business_units`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transmittalData.client_id]);

  async function handleSubmit(
    data: z.infer<typeof formSchema>,
    close: () => void,
  ) {
    const { error } = await execute({
      params: `/${transmittalData.id}`,
      body: {
        id: transmittalData.id,
        billing_transmittal_number: data.billing_transmittal_number,
        assigned_billing_officer: data.assigned_billing_officer || null,
        business_unit_id: data.business_unit_id ?? undefined,
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
                name="business_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Unit</FormLabel>
                    <FormControl>
                      <BusinessUnitComboBox
                        value={field.value ?? null}
                        onValueChange={(value) => {
                          field.onChange(value);
                          onBusinessUnitChange?.(value);
                        }}
                        businessUnitData={businessUnitData ?? null}
                        allowNull
                        nullLabel="Unassigned"
                        placeholder="Select business unit"
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

export function SearchTransmittalItemsComponent({
  data,
  onFilter,
  loading,
  forceShowViewButton = false,
  allowFileDownload = true,
}: {
  data: TransmittalItems[];
  loading: boolean;
  onFilter: (params: { search?: string; status?: string }) => void;
  forceShowViewButton?: boolean;
  allowFileDownload?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [urlCache, setUrlCache] = useState<
    Map<string, { url: string; expires: number }>
  >(new Map());
  const { execute: getPresignedUrl, loading: loadingUrl } =
    useGetPresignedUrl();
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const user = useCurrentUser();

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilter({
        search: query,
      });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  function handleClear() {
    setQuery("");
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
  const isDirty = query;
  const proofItems = data.filter(
    (item) => item.category === "proof_attachment",
  );
  const transmittalItems = data.filter(
    (item) => item.category !== "proof_attachment",
  );
  const canViewFiles = forceShowViewButton || user?.role == "operations admin";

  function renderItemRows(items: TransmittalItems[]) {
    return items.map((item, index) => (
      <div
        key={item.id}
        className={`group flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 ${
          index !== items.length - 1 ? "border-b" : ""
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
              <p className="text-sm font-medium truncate">{item.file_name}</p>
              {item.status && <StatusBadge status={item.status} />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(parseInt(item.file_size) / 1024 / 1024).toFixed(2)} MB ·
              uploaded {new Date(item.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {canViewFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleViewFile(item.file_key, item.file_name, item.file_type)
              }
              disabled={loadingUrl}
            >
              {loadingUrl ? "Loading..." : "View"}
            </Button>
          )}
        </div>
      </div>
    ));
  }

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
        <div className="space-y-4">
          {proofItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Proof Images</h3>
              <div className="rounded-xl border bg-card overflow-hidden">
                {renderItemRows(proofItems)}
              </div>
            </div>
          )}

          {transmittalItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Transmittal Items</h3>
              <div className="rounded-xl border bg-card overflow-hidden">
                {renderItemRows(transmittalItems)}
              </div>
            </div>
          )}
        </div>
      )}
      <FileViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
        allowDownload={allowFileDownload}
      />
    </div>
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

  const handleReturn = async () => {
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
        variant="destructive"
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
                  onClick={handleReturn}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? "Returning..." : "Confirm Return"}
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
