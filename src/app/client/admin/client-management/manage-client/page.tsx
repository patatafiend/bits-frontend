"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import { useFetchTransmittals } from "@/hooks/use-transmittal";
import { ClientModal } from "./modals";
import { useCurrentUser } from "@/components/providers/auth-provider";
import { useFetchClients } from "@/hooks/use-client";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ClientDetail } from "@/lib/types";

export default function ClientListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: clientData, refetch, loading } = useFetchClients();
  const user = useCurrentUser();

  function refetchClients() {
    refetch({
      query: {
        company_id: user?.company.id,
      },
    });
  }

  useEffect(() => {
    if (user) {
      refetchClients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">Clients</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchClients()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Client
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ClientList data={clientData} loading={loading} />
        </CardContent>
      </Card>

      <ClientModal
        client_id={user?.client.id}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={refetchClients}
      />
    </div>
  );
}

export function ClientList({
  data,
  loading,
}: {
  data: ClientDetail[] | null;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = (data ?? []).filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Client name
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                System type
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Business units
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Loading clients...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No clients found.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((client) => (
                <tr
                  key={client.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {client.client_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.client_email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.system_type}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "client" : "clients"}
      </p>
    </div>
  );
}
