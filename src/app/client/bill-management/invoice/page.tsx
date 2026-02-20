"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";
import { useGetCurrentUser } from "@/components/providers/auth-provider";
import { useFetchInvoices } from "@/hooks/use-invoice";
import { SearchInvoiceComponent, InvoiceModal } from "./dialogs";

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


