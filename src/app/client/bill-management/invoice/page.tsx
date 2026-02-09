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

export default function InvoiceListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: invoices, refetch } = useFetchInvoices();
  const { data: user } = useGetCurrentUser();

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
              {invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>{invoice.invoice_date}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/client/bill-management/invoice/${invoice.id}`}
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

export type InvoiceModalProps = {
  client_id?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

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
