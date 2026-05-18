"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/components/providers/auth-provider";
import { useGlobalFilters } from "@/components/providers/global-filter-provider";
import { Button } from "@/components/ui/button";
import {
  useCreateTransmittalReportExportJob,
  useFetchReportDownloadUrl,
  useFetchReportJob,
  useFetchTransmittalReportTrend,
} from "@/hooks/use-report";
import { useFetchUsers } from "@/hooks/use-user";
import { useFetchBusinessUnits } from "@/hooks/use-client";
import { ReportFormat, TrendGroupBy } from "@/lib/types";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePicker } from "@/components/date-picker";

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatRoleDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    billing_officer: "Officer",
    operation_admin: "Admin",
    billing_admin: "Billing",
  };
  return roleMap[role.toLowerCase()] || role;
}

function buildDateDefaults() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  return {
    startDate: toIsoDate(thirtyDaysAgo),
    endDate: toIsoDate(now),
  };
}

export default function ManagementReportsPage() {
  const user = useCurrentUser();
  const { selectedClientId } = useGlobalFilters();

  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState(
    () => buildDateDefaults().startDate,
  );
  const [endDate, setEndDate] = useState(() => buildDateDefaults().endDate);
  const groupBy: TrendGroupBy = "user";
  const [exportFormat, setExportFormat] = useState<ReportFormat>("csv");
  const [jobId, setJobId] = useState<number | null>(null);
  const [businessUnitIds, setBusinessUnitIds] = useState<number[]>([]);
  const [operationAdminIds, setOperationAdminIds] = useState<number[]>([]);
  const [billingOfficerIds, setBillingOfficerIds] = useState<number[]>([]);
  const [billingAdminIds, setBillingAdminIds] = useState<number[]>([]);

  const activeClientId = useMemo(
    () => selectedClientId ?? user?.client?.id ?? null,
    [selectedClientId, user?.client?.id],
  );

  const {
    data: trend,
    loading: trendLoading,
    execute: refetchTrend,
  } = useFetchTransmittalReportTrend();
  const { execute: queueExport, loading: queueingExport } =
    useCreateTransmittalReportExportJob();

  const {
    data: reportJob,
    loading: jobLoading,
    refetch: refetchReportJob,
  } = useFetchReportJob();

  const { data: usersData, refetch: refetchUsers } = useFetchUsers();
  const { data: businessUnitsData, refetch: refetchBusinessUnits } =
    useFetchBusinessUnits();

  const {
    data: downloadData,
    loading: downloadLoading,
    refetch: refetchDownloadUrl,
  } = useFetchReportDownloadUrl();

  const isLoading = trendLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  const operationAdminOptions = useMemo(() => {
    return (usersData ?? []).filter((entry) =>
      (entry.role ?? "").toLowerCase().includes("admin"),
    );
  }, [usersData]);

  const billingOfficerOptions = useMemo(() => {
    return (usersData ?? []).filter((entry) =>
      (entry.role ?? "").toLowerCase().includes("officer"),
    );
  }, [usersData]);

  const billingAdminOptions = useMemo(() => {
    return (usersData ?? []).filter((entry) =>
      (entry.role ?? "").toLowerCase().includes("billing"),
    );
  }, [usersData]);

  const businessUnitMultiOptions = useMemo(
    () =>
      (businessUnitsData ?? []).map((businessUnit) => ({
        value: businessUnit.id.toString(),
        label: businessUnit.name,
      })),
    [businessUnitsData],
  );

  const billingAdminMultiOptions = useMemo(
    () =>
      billingAdminOptions.map((entry) => ({
        value: entry.id.toString(),
        label: `${entry.first_name} ${entry.last_name} (${entry.email})`,
      })),
    [billingAdminOptions],
  );

  const operationAdminMultiOptions = useMemo(
    () =>
      operationAdminOptions.map((entry) => ({
        value: entry.id.toString(),
        label: `${entry.first_name} ${entry.last_name}`,
      })),
    [operationAdminOptions],
  );

  const billingOfficerMultiOptions = useMemo(
    () =>
      billingOfficerOptions.map((entry) => ({
        value: entry.id.toString(),
        label: `${entry.first_name} ${entry.last_name}`,
      })),
    [billingOfficerOptions],
  );

  const activeAdvancedFilterCount =
    businessUnitIds.length +
    operationAdminIds.length +
    billingOfficerIds.length +
    billingAdminIds.length;

  useEffect(() => {
    if (!activeClientId) {
      setBusinessUnitIds([]);
      setOperationAdminIds([]);
      setBillingOfficerIds([]);
      setBillingAdminIds([]);
      return;
    }

    refetchBusinessUnits({ params: `${activeClientId}/business_units` });
    refetchUsers({ query: { client_id: activeClientId } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClientId]);

  function buildFilterQuery() {
    return {
      client_id: activeClientId ?? undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      business_unit_ids: businessUnitIds.length ? businessUnitIds : undefined,
      assigned_operation_admin_ids: operationAdminIds.length
        ? operationAdminIds
        : undefined,
      assigned_billing_officer_ids: billingOfficerIds.length
        ? billingOfficerIds
        : undefined,
      created_by_user_ids: billingAdminIds.length ? billingAdminIds : undefined,
    };
  }

  function refreshReport() {
    if (!activeClientId) {
      return;
    }

    const filters = buildFilterQuery();
    refetchTrend({
      body: {
        group_by: groupBy,
        filters,
      },
    });
  }

  async function onQueueExport() {
    if (!activeClientId) {
      toast.error("Select a client first before exporting.");
      return;
    }

    const payload = {
      format: exportFormat,
      group_by: groupBy,
      filters: buildFilterQuery(),
    };

    const { data, error } = await queueExport({ body: payload });
    if (error || !data) {
      toast.error(error?.message || "Failed to queue export job.");
      return;
    }

    setJobId(data.job_id);
    toast.success(`Export job #${data.job_id} queued.`);
  }

  function onCheckJobStatus() {
    if (!jobId) {
      toast.error("Queue an export job first.");
      return;
    }

    refetchReportJob({ params: `${jobId}` });
  }

  function onDownload() {
    if (!jobId) {
      toast.error("No report job selected.");
      return;
    }

    refetchDownloadUrl({ params: `${jobId}/download` });
  }

  function toNumberArray(values: string[]) {
    return values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  }

  function clearAdvancedFilters() {
    setBusinessUnitIds([]);
    setOperationAdminIds([]);
    setBillingOfficerIds([]);
    setBillingAdminIds([]);
  }

  useEffect(() => {
    refreshReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClientId, groupBy]);

  useEffect(() => {
    if (downloadData?.url) {
      window.open(downloadData.url, "_blank", "noopener,noreferrer");
    }
  }, [downloadData]);

  if (!mounted) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Transmittal Reports</h1>
          <p className="text-sm text-muted-foreground">
            View transmittal performance trend and generate export jobs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Transmittal Reports</h1>
        <p className="text-sm text-muted-foreground">
          View transmittal performance trend and generate export jobs.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 text-sm">
          <span className="text-muted-foreground">Start date</span>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>

        <div className="space-y-1 text-sm">
          <span className="text-muted-foreground">End date</span>
          <DatePicker value={endDate} onChange={setEndDate} />
        </div>

        <div className="flex items-end">
          <Button onClick={refreshReport} className="w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Advanced filters
          {activeAdvancedFilterCount > 0
            ? ` (${activeAdvancedFilterCount} selected)`
            : ""}
        </summary>

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Business Units</span>
              <MultiSelect
                modalPopover
                placeholder="Select business units"
                options={businessUnitMultiOptions}
                defaultValue={businessUnitIds.map(String)}
                onValueChange={(values) =>
                  setBusinessUnitIds(toNumberArray(values))
                }
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Billing</span>
              <MultiSelect
                modalPopover
                placeholder="Select billing admins"
                options={billingAdminMultiOptions}
                defaultValue={billingAdminIds.map(String)}
                onValueChange={(values) =>
                  setBillingAdminIds(toNumberArray(values))
                }
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Admin</span>
              <MultiSelect
                modalPopover
                placeholder="Select operation admins"
                options={operationAdminMultiOptions}
                defaultValue={operationAdminIds.map(String)}
                onValueChange={(values) =>
                  setOperationAdminIds(toNumberArray(values))
                }
                className="w-full"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Officer</span>
              <MultiSelect
                modalPopover
                placeholder="Select billing officers"
                options={billingOfficerMultiOptions}
                defaultValue={billingOfficerIds.map(String)}
                onValueChange={(values) =>
                  setBillingOfficerIds(toNumberArray(values))
                }
                className="w-full"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={clearAdvancedFilters}>
              Clear advanced filters
            </Button>
          </div>
        </div>
      </details>

      {!activeClientId ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Select a client first to load reports.
        </div>
      ) : (
        <>
          {activeAdvancedFilterCount > 0 && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="space-y-3 text-sm">
                {businessUnitIds.length > 0 && (
                  <div>
                    <span className="font-medium">Business Units:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {businessUnitIds.map((id) => {
                        const unit = businessUnitsData?.find(
                          (u) => u.id === id,
                        );
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full bg-background px-3 py-1 text-xs font-medium border"
                          >
                            {unit?.name || `Business Unit #${id}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {billingAdminIds.length > 0 && (
                  <div>
                    <span className="font-medium">Billing:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {billingAdminIds.map((id) => {
                        const user = billingAdminOptions.find(
                          (u) => u.id === id,
                        );
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full bg-background px-3 py-1 text-xs font-medium border"
                          >
                            {user
                              ? `${user.first_name} ${user.last_name}`
                              : `User #${id}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {operationAdminIds.length > 0 && (
                  <div>
                    <span className="font-medium">Admin:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {operationAdminIds.map((id) => {
                        const user = operationAdminOptions.find(
                          (u) => u.id === id,
                        );
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full bg-background px-3 py-1 text-xs font-medium border"
                          >
                            {user
                              ? `${user.first_name} ${user.last_name}`
                              : `User #${id}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {billingOfficerIds.length > 0 && (
                  <div>
                    <span className="font-medium">Officer:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {billingOfficerIds.map((id) => {
                        const user = billingOfficerOptions.find(
                          (u) => u.id === id,
                        );
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full bg-background px-3 py-1 text-xs font-medium border"
                          >
                            {user
                              ? `${user.first_name} ${user.last_name}`
                              : `User #${id}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="rounded-lg border">
            <div className="border-b px-4 py-3 text-sm font-medium">Trend</div>
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading trend
                data...
              </div>
            ) : trend?.items?.length ? (
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="px-3 py-2 text-left">User</TableHead>
                    <TableHead className="px-3 py-2 text-left">Role</TableHead>
                    <TableHead className="px-3 py-2 text-left">Total</TableHead>
                    <TableHead className="px-3 py-2 text-left text-xs">
                      Created At
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left text-xs">
                      Duration
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left text-xs">
                      Submitted At
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left text-xs">
                      Duration
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left text-xs">
                      Endorsed At
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left text-xs">
                      Duration
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left text-xs">
                      Forwarded At
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">Draft</TableHead>
                    <TableHead className="px-3 py-2 text-left">
                      Pending
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">
                      Endorsed
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">
                      Forwarded
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">Sent</TableHead>
                    <TableHead className="px-3 py-2 text-left">
                      Accepted
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">
                      Rejected
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">
                      Returned
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">
                      Partially Returned
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trend.items.map((item, index) => {
                    const userItem = item as typeof item & {
                      user_id: number;
                      user: string;
                      role: string;
                      created_at?: string | null;
                      created_at_to_submitted_duration?: string | null;
                      submitted_at?: string | null;
                      submitted_at_to_endorsed_duration?: string | null;
                      endorsed_at?: string | null;
                      endorsed_at_to_forwarded_duration?: string | null;
                      forwarded_at?: string | null;
                    };

                    const formatDate = (dateStr?: string | null) => {
                      if (!dateStr) return "-";
                      try {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      } catch {
                        return dateStr;
                      }
                    };

                    return (
                      <TableRow
                        key={`${userItem.user_id}-${userItem.role}-${index}`}
                      >
                        <TableCell className="px-3 py-2">
                          {userItem.user}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {formatRoleDisplay(userItem.role)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.total}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs">
                          {formatDate(userItem.created_at)}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs">
                          {userItem.created_at_to_submitted_duration || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs">
                          {formatDate(userItem.submitted_at)}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs">
                          {userItem.submitted_at_to_endorsed_duration || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs">
                          {formatDate(userItem.endorsed_at)}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs">
                          {userItem.endorsed_at_to_forwarded_duration || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs">
                          {formatDate(userItem.forwarded_at)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.draft}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.pending}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.endorsed}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.forwarded}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.sent}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.accepted}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.rejected}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.returned}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {userItem.partially_returned}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No trend data for the selected filters.
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="text-sm font-medium">Export</div>

            <div className="grid gap-3 md:grid-cols-4">
              <label className="space-y-1 text-sm md:col-span-1">
                <span className="text-muted-foreground">Format</span>
                <Select
                  value={exportFormat}
                  onValueChange={(value) =>
                    setExportFormat(value as ReportFormat)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">XLSX</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <div className="md:col-span-3 flex flex-wrap items-end gap-2">
                <Button onClick={onQueueExport} disabled={queueingExport}>
                  {queueingExport ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Queue Export Job
                </Button>

                <Button
                  onClick={onCheckJobStatus}
                  variant="outline"
                  disabled={!jobId || jobLoading}
                >
                  {jobLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Check Job
                </Button>

                <Button
                  onClick={onDownload}
                  variant="outline"
                  disabled={
                    !jobId ||
                    reportJob?.status !== "completed" ||
                    downloadLoading
                  }
                >
                  {downloadLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download
                </Button>
              </div>
            </div>

            {jobId ? (
              <div className="text-sm text-muted-foreground">
                Job #{jobId} status: {reportJob?.status ?? "queued"}
                {reportJob?.error_message
                  ? ` (${reportJob.error_message})`
                  : ""}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
