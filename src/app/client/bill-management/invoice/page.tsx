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
import { Invoice, InvoiceModalProps } from "@/lib/types";
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

  useEffect(() => {
    refetch();
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
            <Button
              onClick={() => {
                setModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoices && <SearchInvoiceComponent data={invoices} />}
        </CardContent>
      </Card>

      <InvoiceModal
        client_id={user?.client.id}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={refetch}
      />
    </div>
  );
}

export function InvoiceList({ data, page, setPage }: { 
  data: Invoice[];
  page: number;
  setPage: (page: number) => void;
}) {
  const itemsPerPage = 10;
  const pageCount = Math.ceil(data.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const paginated = data.slice(start, start + itemsPerPage);
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
          {paginated.map((invoice) => (
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
              className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
              className={page >= pageCount ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

export function SearchInvoiceComponent({ data }: { data: Invoice[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = data.filter((invoice) => {
    const q = query.toLowerCase();
    const matchesQuery =
      (invoice.invoice_number?.toLowerCase() ?? "").includes(q) ||
      (invoice.invoice_date?.toLowerCase() ?? "").includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (invoice.status?.toLowerCase() ?? "") === statusFilter;
    return matchesQuery && matchesStatus;
  });

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1); // reset page on filter change
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1); // reset page on filter change
  }

  function handleClear() {
    setQuery("");
    setStatusFilter("all");
    setPage(1);
  }

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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        {(query || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {filtered.length > 0 ? (
        <InvoiceList data={filtered} page={page} setPage={setPage} />
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No invoices match your search.
        </p>
      )}
    </div>
  );
}
