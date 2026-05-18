import {
  ReportDownloadResponse,
  ReportExportRequest,
  ReportJob,
  ReportJobCreateResponse,
  ReportTrendRequest,
  TransmittalReportSummary,
  TransmittalReportTrendResponse,
} from "@/lib/types";

import { useServerAction, useServerFetch } from "./use-server";

export function useFetchTransmittalReportSummary() {
  return useServerFetch<TransmittalReportSummary>(
    "/reports/transmittals/summary",
    {
      fetchImmediately: false,
      method: "GET",
    },
  );
}

export function useFetchTransmittalReportTrend() {
  return useServerAction<TransmittalReportTrendResponse, ReportTrendRequest>(
    "/reports/transmittals/trend",
    {
      method: "POST",
    },
  );
}

export function useCreateTransmittalReportExportJob() {
  return useServerAction<ReportJobCreateResponse, ReportExportRequest>(
    "/reports/transmittals/export",
    {
      method: "POST",
    },
  );
}

export function useFetchReportJob() {
  return useServerFetch<ReportJob>("/reports/jobs", {
    fetchImmediately: false,
    method: "GET",
  });
}

export function useFetchReportDownloadUrl() {
  return useServerFetch<ReportDownloadResponse>("/reports/jobs", {
    fetchImmediately: false,
    method: "GET",
  });
}
