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
  useFetchTransmittalReportSummary,
  useFetchTransmittalReportTrend,
} from "@/hooks/use-report";
import { ReportFormat, TrendGroupBy } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const activeClientId = useMemo(
    () => selectedClientId ?? user?.client?.id ?? null,
    [selectedClientId, user?.client?.id],
  );

  const {
    data: summary,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useFetchTransmittalReportSummary();
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
  const {
    data: downloadData,
    loading: downloadLoading,
    refetch: refetchDownloadUrl,
  } = useFetchReportDownloadUrl();

  const isLoading = summaryLoading || trendLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  function buildFilterQuery() {
    return {
      client_id: activeClientId ?? undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
  }

  function refreshReport() {
    if (!activeClientId) {
      return;
    }

    const filters = buildFilterQuery();
    refetchSummary({ query: filters });
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
      filters: {
        client_id: activeClientId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
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
            View transmittal performance summary and generate export jobs.
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
          View transmittal performance summary and generate export jobs.
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

      {!activeClientId ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Select a client first to load reports.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xl font-semibold">{summary?.total ?? 0}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-xl font-semibold">
                {summary?.pending ?? 0}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Endorsed</div>
              <div className="text-xl font-semibold">
                {summary?.endorsed ?? 0}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Forwarded</div>
              <div className="text-xl font-semibold">
                {summary?.forwarded ?? 0}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Sent</div>
              <div className="text-xl font-semibold">{summary?.sent ?? 0}</div>
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="border-b px-4 py-3 text-sm font-medium">Trend</div>
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading trend
                data...
              </div>
            ) : trend?.items?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left">Bucket</th>
                      <th className="px-3 py-2 text-left">Total</th>
                      <th className="px-3 py-2 text-left">Pending</th>
                      <th className="px-3 py-2 text-left">Endorsed</th>
                      <th className="px-3 py-2 text-left">Forwarded</th>
                      <th className="px-3 py-2 text-left">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trend.items.map((item) => (
                      <tr key={item.bucket} className="border-t">
                        <td className="px-3 py-2">{item.bucket}</td>
                        <td className="px-3 py-2">{item.total}</td>
                        <td className="px-3 py-2">{item.pending}</td>
                        <td className="px-3 py-2">{item.endorsed}</td>
                        <td className="px-3 py-2">{item.forwarded}</td>
                        <td className="px-3 py-2">{item.sent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
