"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, RefreshCw } from "lucide-react";
import { useFetchTransmittals } from "@/hooks/use-transmittal";
import { SearchTransmittalComponent } from "./dialogs";
import { useCurrentUser } from "@/components/providers/auth-provider";
import { useGlobalFilters } from "@/components/providers/global-filter-provider";

export default function TransmittalListPage() {
  const { data: transmittals, refetch, loading } = useFetchTransmittals();
  const { selectedBusinessUnitId } = useGlobalFilters();
  const user = useCurrentUser();

  function refetchTransmittals(params: {
    search?: string;
    billing_transmittal_number?: string;
    status?: string;
    business_unit_id?: number;
    skip?: number;
    limit?: number;
    order_by?: string;
  }) {
    refetch({
      params: `client/operations`,
      query: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 10,
        search: params.search ?? "",
        billing_transmittal_number:
          params.billing_transmittal_number || undefined,
        client_id: user?.client.id,
        order_by: params.order_by ?? "recent",
        status: params.status === "all" ? undefined : params.status,
        business_unit_id: params.business_unit_id,
        assigned_operation_admin: user?.id,
        exclude_statuses: ["draft", "resubmitted", "partially_returned"],
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchTransmittals({})}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user && (
            <SearchTransmittalComponent
              data={transmittals ?? { items: [], total: 0 }}
              onFilter={refetchTransmittals}
              loading={loading}
              client_id={user.client.id ?? undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
