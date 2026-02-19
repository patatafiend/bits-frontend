"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Plus } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
import { useCreateInvoice, useFetchInvoices } from "@/hooks/use-invoice";
import { useGetCurrentUser } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { InvoiceModalProps, PaginatedInvoice } from "@/lib/types";
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

export default function InvoiceListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: invoices, refetch } = useFetchInvoices();
  const { data: user } = useGetCurrentUser();

  function refetchInvoices(params: {
    search?: string;
    status?: string;
    skip?: number;
    limit?: number;
    order_by?: string;
  }) {
    refetch({
      params: `client/${user?.client.id}`,
      query: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 10,
        search: params.search ?? "",
        client_id: user?.client.id,
        order_by: params.order_by ?? "recent",
        status: params.status === "all" ? undefined : params.status,
      },
    });
  }

  useEffect(() => {
    refetchInvoices({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoices
            </CardTitle>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoices && (
            <SearchInvoiceComponent
              data={invoices}
              onFilter={refetchInvoices}
            />
          )}
        </CardContent>
      </Card>

      <InvoiceModal
        client_id={user?.client.id}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={() => refetchInvoices({})}
      />
    </div>
  );
}

export function InvoiceList({
  data,
  page,
  setPage,
  limit,
  total,
}: {
  data: PaginatedInvoice["items"]; // just the inner item, not the wrapper
  page: number;
  setPage: (page: number) => void;
  limit: number;
  total: number;
}) {
  const pageCount = Math.ceil(total / limit);
  const pages = [...Array(pageCount)].map((_, i) => i + 1);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.invoice_number}
              </TableCell>
              <TableCell>{invoice.invoice_date}</TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell className="text-right">
                <Link href={`/client/bill-management/invoice/${invoice.id}`}>
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

export function InvoiceModal({
  client_id,
  open,
  onOpenChange,
  onSubmit,
}: InvoiceModalProps) {
  const { execute } = useCreateInvoice();

  const formSchema = z.object({
    invoice_number: z.string().min(1, "Invoice Number is required"),
    client_id: z.number().min(1, "client id required"),
    status: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_number: "",
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
        invoice_number: data.invoice_number,
        status: "Draft",
        client_id: data.client_id,
      },
    });
    if (!error) {
      onOpenChange(false);
      onSubmit();
    } else {
      toast.error(`Error: ${error.message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup className="grid grid-cols-2 gap-4">
              {/* Invoice Number */}
              <Field>
                <FieldLabel>Invoice Number</FieldLabel>
                <FieldContent>
                  <Input
                    type="text"
                    placeholder="INV-2024-001"
                    {...form.register("invoice_number")}
                  />
                </FieldContent>
                {form.formState.errors.invoice_number && (
                  <FieldError>
                    {form.formState.errors.invoice_number.message}
                  </FieldError>
                )}
              </Field>
            </FieldGroup>

            <FieldSeparator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Invoice</Button>
            </div>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SearchInvoiceComponent({
  data,
  onFilter,
}: {
  data: PaginatedInvoice;
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
    }, 450);
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
          placeholder="Search by invoice number or date..."
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
            <SelectItem value="invoice_number">Invoice Number</SelectItem>
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

      {(data?.items?.length ?? 0) > 0 ? (
        <InvoiceList
          data={data.items}
          page={page}
          setPage={setPage}
          limit={limit}
          total={data.total}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No invoices match your search.
        </p>
      )}
    </div>
  );
}
