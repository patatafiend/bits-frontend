"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, RefreshCcw } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";

import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateTransmittal,
  useGenerateTMN,
  useCancelTransmittal,
} from "@/hooks/use-transmittal";
import { toast } from "sonner";
import { PaginatedTransmittal, TransmittalModalProps } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import BusinessUnitComboBox from "@/components/business-units";
import { useFetchBusinessUnits } from "@/hooks/use-client";
import { formatDate, getPaginationRange } from "@/lib/utils";

function CancelTransmittalDialog({
  transmittal,
  onSuccess,
}: {
  transmittal: PaginatedTransmittal["items"][0];
  onSuccess: () => void;
}) {
  const { execute, loading } = useCancelTransmittal();
  const [open, setOpen] = useState(false);

  async function handleCancel() {
    const { error } = await execute({
      body: {
        status: "cancelled",
      },
      params: `${transmittal.id}`,
    });

    if (!error) {
      setOpen(false);
      onSuccess();
      toast.success(
        `Transmittal ${transmittal.transmittal_number} cancelled successfully`,
      );
    } else {
      toast.error(`Error: ${error.message}`);
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Cancel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Cancel Transmittal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transmittal</span>
                <span className="font-medium">
                  {transmittal.transmittal_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing TM</span>
                <span className="font-medium">
                  {transmittal.billing_transmittal_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created Date</span>
                <span className="font-medium">
                  {formatDate(transmittal.created_at)}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this transmittal? This action
              cannot be undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto"
              >
                Keep
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Cancelling..." : "Cancel Transmittal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TransmittalList({
  data,
  page,
  setPage,
  limit,
  total,
  onSuccess,
}: {
  data: PaginatedTransmittal["items"];
  page: number;
  setPage: (page: number) => void;
  limit: number;
  total: number;
  onSuccess: () => void;
}) {
  const pageCount = Math.ceil(total / limit);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transmittal Number</TableHead>
            <TableHead>Billing TM Number</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transmittal) => (
            <TableRow key={transmittal.id}>
              <TableCell className="font-medium">
                {transmittal.transmittal_number}
              </TableCell>
              <TableCell>
                {transmittal.billing_transmittal_number ?? "-"}
              </TableCell>
              <TableCell>{formatDate(transmittal.created_at)}</TableCell>
              <TableCell>{transmittal.created_by}</TableCell>
              <TableCell>
                <StatusBadge status={transmittal.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end items-center">
                  <Button variant="ghost" size="sm">
                    <Link
                      href={`/client/bill-management/transmittal/${transmittal.id}`}
                      className="flex items-center"
                    >
                      <Eye className="w-2 h-2 mr-1.5" />
                      View
                    </Link>
                  </Button>
                  {transmittal.status === "draft" && (
                    <CancelTransmittalDialog
                      transmittal={transmittal}
                      onSuccess={onSuccess}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination className="my-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(page - 1, 1))}
              className={
                page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {getPaginationRange(page, pageCount).map((p, i) =>
            p === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(page + 1, pageCount))}
              className={
                page >= pageCount
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}

export function TransmittalModal({
  client_id,
  open,
  onOpenChange,
  onSubmit,
}: TransmittalModalProps) {
  const { execute } = useCreateTransmittal();
  const { execute: generateTMN } = useGenerateTMN();
  const { data: businessUnitData, refetch: refetchBusinessUnits } =
    useFetchBusinessUnits();

  const formSchema = z.object({
    transmittal_number: z.string().min(1, "Transmittal Number is required"),
    billing_transmittal_number: z
      .string()
      .min(1, "Billing Transmittal Number is required"),
    resubmitted_from_id: z.number().optional(),
    client_id: z.number().min(1, "Client ID is required"),
    business_unit_id: z.number().min(1, "Business Unit is required"),
    status: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transmittal_number: "",
      billing_transmittal_number: "",
      resubmitted_from_id: undefined,
      client_id: client_id,
      business_unit_id: undefined,
      status: "Draft",
    },
  });

  // Fetch business units only when the modal is open for the active client.
  useEffect(() => {
    if (open && client_id) {
      form.setValue("client_id", client_id);
      form.setValue("business_unit_id", undefined as unknown as number);
      refetchBusinessUnits({ params: `${client_id}/business_units` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id, open]);

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    const { error } = await execute({
      body: {
        transmittal_number: data.transmittal_number,
        billing_transmittal_number: data.billing_transmittal_number,
        status: "Draft",
        client_id: data.client_id,
        business_unit_id: data.business_unit_id,
        resubmitted_from_id: data.resubmitted_from_id ?? null,
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
                    <Input
                      type="text"
                      placeholder="INV-2024-001"
                      {...form.register("transmittal_number")}
                    />
                    <Button
                      type="button"
                      onClick={async () => {
                        const { data, error } = await generateTMN();
                        if (!error) {
                          toast.success("Number Generated!");
                        } else {
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

              <Field>
                <FieldLabel>Billing Transmittal Number</FieldLabel>
                <FieldContent>
                  <Input
                    type="text"
                    placeholder="BTM-2024-001"
                    {...form.register("billing_transmittal_number")}
                  />
                </FieldContent>
                {form.formState.errors.billing_transmittal_number && (
                  <FieldError>
                    {form.formState.errors.billing_transmittal_number.message}
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

export function SearchTransmittalComponent({
  data,
  onFilter,
  loading,
  client_id,
  initialPage = 1,
  initialLimit = 10,
  initialSearch = "",
  initialStatus = "all",
  initialBusinessUnit = null,
  initialOrderBy = "recent",
}: {
  data: PaginatedTransmittal;
  loading: boolean;
  client_id?: number;
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialStatus?: string;
  initialBusinessUnit?: number | null;
  initialOrderBy?: string;
  onFilter: (params: {
    search?: string;
    billing_transmittal_number?: string;
    status?: string;
    business_unit_id?: number | null;
    limit?: number;
    skip?: number;
    order_by?: string;
    page?: number;
  }) => void;
}) {
  const { data: businessUnitData, refetch: refetchBusinessUnits } =
    useFetchBusinessUnits();
  const [query, setQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [businessUnitFilter, setBusinessUnitFilter] = useState<number | null>(
    initialBusinessUnit,
  );
  const [orderBy, setOrderBy] = useState(initialOrderBy);
  const [limit, setLimit] = useState(initialLimit);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    if (client_id) {
      refetchBusinessUnits({ params: `${client_id}/business_units` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const normalizedQuery = query.trim();
      const isBillingQuery = /^btm/i.test(normalizedQuery);

      onFilter({
        search: isBillingQuery ? undefined : normalizedQuery || undefined,
        billing_transmittal_number: isBillingQuery
          ? normalizedQuery
          : undefined,
        status: statusFilter,
        business_unit_id: businessUnitFilter,
        limit: limit,
        skip: (page - 1) * limit,
        order_by: orderBy,
        page: page,
      });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, businessUnitFilter, page, orderBy, limit]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  function handleLimitChange(value: number) {
    setLimit(value);
    setPage(1);
  }

  function handleOrderByChange(value: string) {
    setOrderBy(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleBusinessUnitChange(value: number | null) {
    setBusinessUnitFilter(value);
    setPage(1);
  }

  function handleClear() {
    setQuery("");
    setStatusFilter("all");
    setBusinessUnitFilter(null);
    setOrderBy("recent");
    setLimit(10);
    setPage(1);
  }

  const isDirty =
    query ||
    statusFilter !== "all" ||
    businessUnitFilter !== null ||
    orderBy !== "recent" ||
    limit !== 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search transmittal, billing TM, or date..."
          value={query}
          onChange={handleQueryChange}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="endorsed">Endorsed</SelectItem>
            <SelectItem value="forwarded">Forwarded</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="partially_returned">
              Partially Returned
            </SelectItem>
            <SelectItem value="resubmitted">Resubmitted</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <BusinessUnitComboBox
          value={businessUnitFilter}
          onValueChange={handleBusinessUnitChange}
          businessUnitData={businessUnitData ?? null}
          allowNull
          nullLabel="All"
          placeholder="Business unit"
          className="w-56"
        />

        <Select value={orderBy} onValueChange={handleOrderByChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Order by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(value) => handleLimitChange(Number(value))}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
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
      ) : (data?.items?.length ?? 0) > 0 ? (
        <TransmittalList
          data={data.items}
          page={page}
          setPage={setPage}
          limit={limit}
          total={data.total}
          onSuccess={() => {
            const normalizedQuery = query.trim();
            const isBillingQuery = /^btm/i.test(normalizedQuery);

            onFilter({
              search: isBillingQuery ? undefined : normalizedQuery || undefined,
              billing_transmittal_number: isBillingQuery
                ? normalizedQuery
                : undefined,
              status: statusFilter,
              business_unit_id: businessUnitFilter,
              limit: limit,
              skip: (page - 1) * limit,
              order_by: orderBy,
              page: page,
            });
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No transmittals match your search.
        </p>
      )}
    </div>
  );
}
