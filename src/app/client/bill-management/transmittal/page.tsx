"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, RefreshCw, Loader2 } from "lucide-react";
import { useFetchTransmittals } from "@/hooks/use-transmittal";
import { SearchTransmittalComponent, TransmittalModal } from "./dialogs";
import { useCurrentUser } from "@/components/providers/auth-provider";
import { useGlobalFilters } from "@/components/providers/global-filter-provider";

export default function TransmittalListPage() {
  return (
    <Suspense fallback={<Loader2 />}>
      <TransmittalListComponent />
    </Suspense>
  );
}

function TransmittalListComponent() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: transmittals, refetch, loading } = useFetchTransmittals();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useCurrentUser();
  const { selectedClientId, selectedBusinessUnitId } = useGlobalFilters();

  // Extract URL params with defaults
  const currentPage = parseInt(searchParams.get("page") ?? "1");
  const currentLimit = parseInt(searchParams.get("limit") ?? "10");
  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentBusinessUnit = searchParams.get("business_unit");
  const currentOrderBy = searchParams.get("order_by") ?? "recent";
  const currentOpsAdmin = searchParams.get("ops_admin");
  const currentBillingOfficer = searchParams.get("billing_officer");

  function updateUrlParams(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    business_unit?: number | null;
    order_by?: string;
    ops_admin?: number | null;
    billing_officer?: number | null;
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
    if (params.ops_admin) newParams.set("ops_admin", String(params.ops_admin));
    if (params.billing_officer)
      newParams.set("billing_officer", String(params.billing_officer));

    const queryString = newParams.toString();
    router.push(
      `/client/bill-management/transmittal${queryString ? "?" + queryString : ""}`,
    );
  }

  const isAdmin =
    user?.account_type === "company_account" ||
    user?.account_type === "admin_account" ||
    user?.account_type === "super_admin_account";

  function refetchTransmittals(params: {
    search?: string;
    billing_transmittal_number?: string;
    status?: string;
    business_unit_id?: number | null;
    skip?: number;
    limit?: number;
    order_by?: string;
    page?: number;
    assigned_operation_admin?: number | null;
    assigned_billing_officer?: number | null;
  }) {
    const page = params.page ?? currentPage;
    const limit = params.limit ?? currentLimit;
    const skip = params.skip ?? (page - 1) * limit;
    const search = "search" in params ? params.search : currentSearch;
    const status = "status" in params ? params.status : currentStatus;
    const businessUnit =
      "business_unit_id" in params
        ? params.business_unit_id
        : currentBusinessUnit
          ? parseInt(currentBusinessUnit)
          : null;
    const orderBy = "order_by" in params ? params.order_by : currentOrderBy;
    const opsAdmin =
      "assigned_operation_admin" in params
        ? params.assigned_operation_admin
        : currentOpsAdmin
          ? parseInt(currentOpsAdmin)
          : null;
    const billingOfficer =
      "assigned_billing_officer" in params
        ? params.assigned_billing_officer
        : currentBillingOfficer
          ? parseInt(currentBillingOfficer)
          : null;

    // Update URL with new params
    updateUrlParams({
      page,
      limit,
      search: search || undefined,
      status,
      business_unit: businessUnit,
      order_by: orderBy,
      ops_admin: opsAdmin,
      billing_officer: billingOfficer,
    });

    refetch({
      params: `client/`,
      query: {
        skip: skip,
        limit: limit,
        search: search,
        billing_transmittal_number:
          params.billing_transmittal_number || undefined,
        client_id: isAdmin
          ? (selectedClientId ?? user?.client.id)
          : user?.client.id,
        business_unit_id: isAdmin
          ? (businessUnit ?? selectedBusinessUnitId ?? undefined)
          : businessUnit,
        order_by: orderBy,
        status: status === "all" ? undefined : status,
        assigned_operation_admin: opsAdmin ?? undefined,
        assigned_billing_officer: billingOfficer ?? undefined,
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
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Transmittal
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
              client_id={
                isAdmin
                  ? (selectedClientId ?? user?.client.id)
                  : user?.client.id
              }
              initialPage={currentPage}
              initialLimit={currentLimit}
              initialSearch={currentSearch}
              initialStatus={currentStatus}
              initialBusinessUnit={
                currentBusinessUnit ? parseInt(currentBusinessUnit) : null
              }
              initialOrderBy={currentOrderBy}
              initialOpsAdmin={
                currentOpsAdmin ? parseInt(currentOpsAdmin) : null
              }
              initialBillingOfficer={
                currentBillingOfficer ? parseInt(currentBillingOfficer) : null
              }
            />
          )}
        </CardContent>
      </Card>

      <TransmittalModal
        client_id={user?.client.id}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={() => refetchTransmittals({})}
      />
    </div>
  );
}
