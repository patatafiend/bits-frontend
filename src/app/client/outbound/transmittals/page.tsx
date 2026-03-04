"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useFetchTransmittals } from "@/hooks/use-transmittal";
import { SearchTransmittalComponent } from "./dialogs";
import { useCurrentUser } from "@/components/providers/auth-provider";
export default function TransmittalListPage() {
  const { data: transmittals, refetch } = useFetchTransmittals();
  const user = useCurrentUser();

  function refetchTransmittals(params: {
    search?: string;
    status?: string;
    skip?: number;
    limit?: number;
    order_by?: string;
  }) {
    refetch({
      params: `client/user`,
      query: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 10,
        search: params.search ?? "",
        client_id: user?.client.id,
        order_by: params.order_by ?? "recent",
        status: params.status ?? "posted",
        assigned_user: user?.id,
      },
    });
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transmittals
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {user && (
            <SearchTransmittalComponent
              data={transmittals ?? { items: [], total: 0 }}
              onFilter={refetchTransmittals}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
