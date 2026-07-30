"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";

import { PaginatedTransmittal } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import BusinessUnitComboBox from "@/components/business-units";
import { useFetchBusinessUnits } from "@/hooks/use-client";
import { getPaginationRange } from "@/lib/utils";

export function TransmittalList({
  data,
  page,
  setPage,
  limit,
  total,
}: {
  data: PaginatedTransmittal["items"];
  page: number;
  setPage: (page: number) => void;
  limit: number;
  total: number;
}) {
  const pageCount = Math.ceil(total / limit);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transmittal Number</TableHead>
            <TableHead className="max-w-[160px]">Billing TM Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((transmittal) => (
            <TableRow key={transmittal.id}>
              <TableCell className="font-medium">
                {transmittal.transmittal_number}
              </TableCell>
              <TableCell className="max-w-[160px] whitespace-normal break-words">
                {transmittal.billing_transmittal_number ?? "-"}
              </TableCell>
              <TableCell>{transmittal.transmittal_date}</TableCell>
              <TableCell>{transmittal.created_by}</TableCell>
              <TableCell>
                <StatusBadge status={transmittal.status} />
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/client/operations/transmittal/${transmittal.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination className="my-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage(Math.max(page - 1, 1))}
              className={
                page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {getPaginationRange(page, pageCount).map((p, i) =>
            p === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(Math.min(page + 1, pageCount))}
              className={
                page >= pageCount
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}

export function SearchTransmittalComponent({
  data,
  onFilter,
  loading,
  client_id,
  initialPage = 1,
  initialLimit = 10,
  initialSearch = "",
  initialStatus = "all",
  initialBusinessUnit = null,
  initialOrderBy = "recent",
}: {
  data: PaginatedTransmittal;
  loading: boolean;
  client_id?: number;
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialStatus?: string;
  initialBusinessUnit?: number | null;
  initialOrderBy?: string;
  onFilter: (params: {
    search?: string;
    billing_transmittal_number?: string;
    status?: string;
    business_unit_id?: number | null;
    limit?: number;
    skip?: number;
    order_by?: string;
    page?: number;
  }) => void;
}) {
  const { data: businessUnitData, refetch: refetchBusinessUnits } =
    useFetchBusinessUnits();
  const [query, setQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [businessUnitFilter, setBusinessUnitFilter] = useState<number | null>(
    initialBusinessUnit,
  );
  const [orderBy, setOrderBy] = useState(initialOrderBy);
  const [limit, setLimit] = useState(initialLimit);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    if (client_id) {
      refetchBusinessUnits({ params: `${client_id}/business_units` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const normalizedQuery = query.trim();
      const isBillingQuery = /^btm/i.test(normalizedQuery);

      onFilter({
        search: isBillingQuery ? undefined : normalizedQuery || undefined,
        billing_transmittal_number: isBillingQuery
          ? normalizedQuery
          : undefined,
        status: statusFilter,
        business_unit_id: businessUnitFilter,
        limit: limit,
        skip: (page - 1) * limit,
        order_by: orderBy,
        page: page,
      });
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, businessUnitFilter, page, orderBy, limit]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  function handleLimitChange(value: number) {
    setLimit(value);
    setPage(1);
  }

  function handleOrderByChange(value: string) {
    setOrderBy(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleBusinessUnitChange(value: number | null) {
    setBusinessUnitFilter(value);
    setPage(1);
  }

  function handleClear() {
    setQuery("");
    setStatusFilter("all");
    setBusinessUnitFilter(null);
    setOrderBy("recent");
    setLimit(10);
    setPage(1);
  }

  const isDirty =
    query ||
    statusFilter !== "all" ||
    businessUnitFilter !== null ||
    orderBy !== "recent" ||
    limit !== 10;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Search transmittal, billing TM, or date..."
          value={query}
          onChange={handleQueryChange}
          className="w-full sm:w-auto sm:max-w-md sm:flex-1"
        />
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="endorsed">Endorsed</SelectItem>
            <SelectItem value="forwarded">Forwarded</SelectItem>
          </SelectContent>
        </Select>

        <BusinessUnitComboBox
          value={businessUnitFilter}
          onValueChange={handleBusinessUnitChange}
          businessUnitData={businessUnitData ?? null}
          placeholder="Business unit"
          className="w-full sm:w-56"
        />

        <Select value={orderBy} onValueChange={handleOrderByChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Order by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(value) => handleLimitChange(Number(value))}
        >
          <SelectTrigger className="sm:-24">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>

        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="w-full sm:w-auto"
          >
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <Loader loading={loading} />
      ) : (data?.items?.length ?? 0) > 0 ? (
        <div className="overflow-x-auto">
          {" "}
          <TransmittalList
            data={data.items}
            page={page}
            setPage={setPage}
            limit={limit}
            total={data.total}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No transmittals match your search.
        </p>
      )}
    </div>
  );
}
