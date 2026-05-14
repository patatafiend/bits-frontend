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
  const [groupBy, setGroupBy] = useState<TrendGroupBy>("day");
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
    refetch: refetchTrend,
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
      (entry.role ?? "").toLowerCase().includes("operations admin"),
    );
  }, [usersData]);

  const billingOfficerOptions = useMemo(() => {
    return (usersData ?? []).filter((entry) =>
      (entry.role ?? "").toLowerCase().includes("billing officer"),
    );
  }, [usersData]);

  const billingAdminOptions = useMemo(() => {
    return (usersData ?? []).filter((entry) =>
      (entry.role ?? "").toLowerCase().includes("billing admin"),
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
    refetchTrend({ query: { ...filters, group_by: groupBy } });
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

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1 text-sm">
          <span className="text-muted-foreground">Start date</span>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>

        <div className="space-y-1 text-sm">
          <span className="text-muted-foreground">End date</span>
          <DatePicker value={endDate} onChange={setEndDate} />
        </div>

        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Group by</span>
          <Select
            value={groupBy}
            onValueChange={(value) => setGroupBy(value as TrendGroupBy)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select grouping" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </label>

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
              <span className="text-muted-foreground">Billing Admin</span>
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
              <span className="text-muted-foreground">
                Assigned Operation Admin
              </span>
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
              <span className="text-muted-foreground">Billing Officer</span>
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
                    <span className="font-medium">Billing Admin(s):</span>
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
                    <span className="font-medium">Operation Admin(s):</span>
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
                    <span className="font-medium">Billing Officer(s):</span>
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
                    <TableHead className="px-3 py-2 text-left">
                      Bucket Range
                    </TableHead>
                    <TableHead className="px-3 py-2 text-left">Total</TableHead>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trend.items.map((item) => (
                    <TableRow key={item.bucket}>
                      <TableCell className="px-3 py-2">
                        {item.bucket_label}
                      </TableCell>
                      <TableCell className="px-3 py-2">{item.total}</TableCell>
                      <TableCell className="px-3 py-2">
                        {item.pending}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {item.endorsed}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {item.forwarded}
                      </TableCell>
                      <TableCell className="px-3 py-2">{item.sent}</TableCell>
                    </TableRow>
                  ))}
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
