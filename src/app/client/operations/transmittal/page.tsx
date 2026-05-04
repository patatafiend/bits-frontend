"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, RefreshCw, Loader2 } from "lucide-react";
import { useFetchTransmittals } from "@/hooks/use-transmittal";
import { SearchTransmittalComponent } from "./dialogs";
import { useCurrentUser } from "@/components/providers/auth-provider";

export default function TransmittalListPage() {
  return (
    <Suspense fallback={<Loader2 />}>
      <TransmittalListComponent />
    </Suspense>
  );
}

function TransmittalListComponent() {
  const { data: transmittals, refetch, loading } = useFetchTransmittals();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useCurrentUser();

  // Extract URL params with defaults
  const currentPage = parseInt(searchParams.get("page") ?? "1");
  const currentLimit = parseInt(searchParams.get("limit") ?? "10");
  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentBusinessUnit = searchParams.get("business_unit");
  const currentOrderBy = searchParams.get("order_by") ?? "recent";

  function updateUrlParams(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    business_unit?: number | null;
    order_by?: string;
  }) {
    const newParams = new URLSearchParams();

    // Only add params that differ from defaults
    if (params.page && params.page !== 1)
      newParams.set("page", String(params.page));
    if (params.limit && params.limit !== 10)
      newParams.set("limit", String(params.limit));
    if (params.search) newParams.set("search", params.search);
    if (params.status && params.status !== "all")
      newParams.set("status", params.status);
    if (params.business_unit)
      newParams.set("business_unit", String(params.business_unit));
    if (params.order_by && params.order_by !== "recent")
      newParams.set("order_by", params.order_by);

    const queryString = newParams.toString();
    router.push(
      `/client/operations/transmittal${queryString ? "?" + queryString : ""}`,
    );
  }

  function refetchTransmittals(params: {
    search?: string;
    billing_transmittal_number?: string;
    status?: string;
    skip?: number;
    limit?: number;
    order_by?: string;
    page?: number;
    business_unit_id?: number | null;
  }) {
    const page = params.page ?? currentPage;
    const limit = params.limit ?? currentLimit;
    const skip = params.skip ?? (page - 1) * limit;
    const search = params.search ?? currentSearch;
    const status = params.status ?? currentStatus;
    const businessUnit =
      params.business_unit_id ??
      (currentBusinessUnit ? parseInt(currentBusinessUnit) : null);
    const orderBy = params.order_by ?? currentOrderBy;

    // Update URL with new params
    updateUrlParams({
      page,
      limit,
      search: search || undefined,
      status,
      business_unit: businessUnit,
      order_by: orderBy,
    });

    refetch({
      params: `client/operations`,
      query: {
        skip: skip,
        limit: limit,
        search: search,
        billing_transmittal_number:
          params.billing_transmittal_number || undefined,
        client_id: user?.client.id,
        order_by: orderBy,
        status: status === "all" ? undefined : status,
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
              initialPage={currentPage}
              initialLimit={currentLimit}
              initialSearch={currentSearch}
              initialStatus={currentStatus}
              initialBusinessUnit={
                currentBusinessUnit ? parseInt(currentBusinessUnit) : null
              }
              initialOrderBy={currentOrderBy}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
