"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchUsersPaginated } from "@/hooks/use-user";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useEffect, useState } from "react";
import { useGlobalFilters } from "@/components/providers/global-filter-provider";
import { PaginatedUser } from "@/lib/types";
import BusinessUnitComboBox from "@/components/business-units";
import { useFetchBusinessUnits } from "@/hooks/use-client";
import { useFetchRoles } from "@/hooks/use-role-permission";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { getPaginationRange } from "@/lib/utils";

type UserFilterParams = {
  search?: string;
  role_id?: number;
  business_unit_id?: number;
  skip?: number;
  limit?: number;
};

export default function ManageUsers() {
  const { data: usersData, loading, refetch } = useFetchUsersPaginated();
  const { selectedClientId } = useGlobalFilters();

  function refetchUsers(params: {
    search?: string;
    role_id?: number;
    business_unit_id?: number;
    client_id?: number;
    skip?: number;
    limit?: number;
  }) {
    refetch({
      query: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 10,
        search: params.search ?? "",
        role_id: params.role_id,
        business_unit_id: params.business_unit_id,
        client_id: params.client_id ?? selectedClientId,
      },
    });
  }

  return (
    <div>
      <Card className="w-full flex">
        <CardHeader className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
              Manage Users
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchUsers({})}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
          </div>
          <div>
            <Link href="manage-users/create">
              <Button size="sm" className="ml-auto">
                <Plus />
                Create User
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 w-full max-h-[80vh] overflow-y-auto">
          {usersData && (
            <SearchUsersComponent
              data={usersData ?? { users: [], total: 0 }}
              onFilter={refetchUsers}
              loading={loading}
              client_id={selectedClientId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function UsersList({
  data,
  page,
  setPage,
  limit,
  total,
}: {
  data: PaginatedUser["users"];
  setPage: (page: number) => void;
  limit: number;
  page: number;
  total: number;
}) {
  const pageCount = Math.ceil(total / limit);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Business Unit</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data &&
            data.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="whitespace-nowrap">
                  <Avatar>
                    {user.profile_url && (
                      <AvatarImage
                        className="w-8 h-8"
                        src={user.profile_url}
                        alt="User Avatar"
                      />
                    )}
                    <AvatarFallback>
                      {user.username && (
                        <span>
                          {user.username.charAt(0).toLocaleUpperCase() +
                            user.username.charAt(1).toLocaleUpperCase()}
                        </span>
                      )}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {[user.first_name, user.middle_name, user.last_name]
                    .filter((namePart) => namePart?.trim())
                    .join(" ")}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {user.phone_number}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {user.email}
                </TableCell>
                <TableCell className="whitespace-nowrap">{user.role}</TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  {user.business_units?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {user.business_units.map((businessUnit) => (
                        <span
                          key={businessUnit.id}
                          className="rounded bg-muted px-2 py-0.5 text-xs"
                        >
                          {businessUnit.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Link href={`manage-users/${user.id}`}>
                    <Button variant="link" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`manage-users/${user.id}/edit`}>
                    <Button variant="link" size="sm">
                      Edit
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

export function SearchUsersComponent({
  data,
  onFilter,
  loading,
  client_id,
}: {
  data: PaginatedUser;
  onFilter: (params: UserFilterParams) => void;
  loading: boolean;
  client_id?: number | null;
}) {
  const { data: roles } = useFetchRoles();
  const { data: businessUnitData, refetch: refetchBusinessUnits } =
    useFetchBusinessUnits();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [businessUnitFilter, setBusinessUnitFilter] = useState<number | null>(
    null,
  );
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQuery("");
    setRoleFilter("all");
    setBusinessUnitFilter(null);
    setLimit(10);
    setPage(1);

    if (client_id) {
      refetchBusinessUnits({ params: `${client_id}/business_units` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id]);

  useEffect(() => {
    if (!client_id) {
      return;
    }

    const timeout = setTimeout(() => {
      onFilter({
        search: query.trim() || undefined,
        role_id: roleFilter === "all" ? undefined : Number(roleFilter),
        business_unit_id: businessUnitFilter ?? undefined,
        limit,
        skip: (page - 1) * limit,
      });
    }, 350);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessUnitFilter, limit, page, query, roleFilter]);

  function handleQueryChange(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setPage(1);
  }

  function handleRoleChange(value: string) {
    setRoleFilter(value);
    setPage(1);
  }

  function handleBusinessUnitChange(value: number | null) {
    setBusinessUnitFilter(value);
    setPage(1);
  }

  function handleLimitChange(value: string) {
    setLimit(Number(value));
    setPage(1);
  }

  function handleClear() {
    setQuery("");
    setRoleFilter("all");
    setBusinessUnitFilter(null);
    setLimit(10);
    setPage(1);
  }

  const isDirty =
    query ||
    roleFilter !== "all" ||
    businessUnitFilter !== null ||
    limit !== 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search name, email, or phone..."
          value={query}
          onChange={handleQueryChange}
          className="w-full max-w-md"
          disabled={!client_id}
        />

        <Select
          value={roleFilter}
          onValueChange={handleRoleChange}
          disabled={!client_id}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(roles ?? []).map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <BusinessUnitComboBox
          value={businessUnitFilter}
          onValueChange={handleBusinessUnitChange}
          businessUnitData={businessUnitData ?? null}
          allowNull
          nullLabel="All"
          placeholder="Business unit"
          className="w-56"
          disabled={!client_id}
        />

        <Select
          value={String(limit)}
          onValueChange={handleLimitChange}
          disabled={!client_id}
        >
          <SelectTrigger className="w-24">
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
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!client_id}
          >
            Clear
          </Button>
        )}
      </div>
      {loading ? (
        <Loader loading={loading} />
      ) : (data?.users?.length ?? 0) > 0 ? (
        <UsersList
          data={data.users}
          page={page}
          setPage={setPage}
          limit={limit}
          total={data.total}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No Users match your search.
        </p>
      )}
    </div>
  );
}
