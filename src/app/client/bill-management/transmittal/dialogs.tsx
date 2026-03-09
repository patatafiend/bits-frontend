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
import { useCreateTransmittal, useGenerateTMN } from "@/hooks/use-transmittal";
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
} from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";

export function TransmittalList({
  data,
  page,
  setPage,
  limit,
  total,
}: {
  data: PaginatedTransmittal["items"];
  page: number;
  setPage: (page: number) => void;
  limit: number;
  total: number;
}) {
  const pageCount = Math.ceil(total / limit);
  const pages = [...Array(pageCount)].map((_, i) => i + 1);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transmittal Number</TableHead>
            <TableHead>Date</TableHead>
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
              <TableCell>{transmittal.transmittal_date}</TableCell>
              <TableCell>{transmittal.created_by}</TableCell>
              <TableCell>
                <StatusBadge status={transmittal.status} />
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/client/bill-management/transmittal/${transmittal.id}`}
                >
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
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

          {pages.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={() => setPage(p)}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

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

  const formSchema = z.object({
    transmittal_number: z.string().min(1, "Transmittal Number is required"),
    resubmitted_from_id: z.number().optional(),
    client_id: z.number().min(1, "client id required"),
    status: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transmittal_number: "",
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

export function SearchTransmittalComponent({
  data,
  onFilter,
  loading,
}: {
  data: PaginatedTransmittal;
  loading: boolean;
  onFilter: (params: {
    search?: string;
    status?: string;
    limit?: number;
    skip?: number;
    order_by?: string;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("recent");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilter({
        search: query,
        status: statusFilter,
        limit: limit,
        skip: (page - 1) * limit,
        order_by: orderBy,
      });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, page, orderBy, limit]);

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

  function handleClear() {
    setQuery("");
    setStatusFilter("all");
    setOrderBy("recent");
    setLimit(10);
    setPage(1);
  }

  const isDirty =
    query || statusFilter !== "all" || orderBy !== "recent" || limit !== 10;

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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

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
        />
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No transmittals match your search.
        </p>
      )}
    </div>
  );
}
