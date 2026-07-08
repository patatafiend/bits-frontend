"use client";

import { useCurrentUser } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Send, Wrench } from "lucide-react";
import ArrowLink from "@/components/arrow-link";
import Loader from "@/components/ui/loader";
import { useFetchTransmittalStats } from "@/hooks/use-transmittal";
import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";

type StatCardProps = {
  title: string;
  value?: string | number;
};

type DateQuery = {
  date_from?: string;
  date_to?: string;
};

const toISODate = (d?: Date) => (d ? d.toISOString().split("T")[0] : undefined);

function useDateRangeFilter() {
  const [dateQuery, setDateQuery] = useState<DateQuery>({});

  function handleUpdate({ range }: { range: { from: Date; to?: Date } }) {
    setDateQuery({
      date_from: toISODate(range.from),
      date_to: toISODate(range.to ?? range.from),
    });
  }

  return { dateQuery, handleUpdate };
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value ?? "-"}</p>
      </CardContent>
    </Card>
  );
}

type ActionCardProps = {
  title: string;
  description: string;
  href: string;
};

function ActionCard({ title, description, href }: ActionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <ArrowLink url={href} label={description} className="" />
      </CardContent>
    </Card>
  );
}

function DashboardShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-md border p-2 text-muted-foreground">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function HomePage() {
  const user = useCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              <Loader loading={!user} />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (user.account_type === "admin_account" || user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "billing officer") {
    return <BillingOfficerDashboard />;
  }

  if (
    user.role === "operations admin" ||
    user.role === "operations admin MWFL"
  ) {
    return <OperationsDashboard />;
  }

  if (user.role === "billing admin" || user.role === "billing admin MWFL") {
    return <BillingAdminDashboard />;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your role does not have a dedicated dashboard yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminDashboard() {
  const { data, refetch } = useFetchTransmittalStats();
  const user = useCurrentUser();
  const { dateQuery, handleUpdate } = useDateRangeFilter();

  function refetchStats() {
    refetch({
      query: { ...dateQuery },
    });
  }

  useEffect(() => {
    if (user) {
      refetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateQuery]);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Manage users and user roles"
      icon={<Shield className="w-5 h-5" />}
    >
      <div className="flex justify-end">
        <DateRangePicker
          onUpdate={handleUpdate}
          initialDateFrom={
            new Date(new Date().setDate(new Date().getDate() - 30))
          }
          initialDateTo={new Date()}
          align="end"
          showCompare={false}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Transmittals" value={data?.total} />
        <StatCard title="Pending" value={data?.pending} />
        <StatCard title="Endorsed" value={data?.endorsed} />
        <StatCard title="Forwarded" value={data?.forwarded} />
        <StatCard title="Sent" value={data?.sent} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard
          title="User Management"
          description="Create users and manage role assignments."
          href="/client/admin/user-management/manage-users"
        />
        <ActionCard
          title="Role Management"
          description="Configure and manage user roles."
          href="/client/admin/user-management/manage-user-roles"
        />
      </div>
    </DashboardShell>
  );
}

export function BillingAdminDashboard() {
  const { data, refetch } = useFetchTransmittalStats();
  const user = useCurrentUser();
  const { dateQuery, handleUpdate } = useDateRangeFilter();

  function refetchStats() {
    refetch({
      query: { client_id: user?.client.id, ...dateQuery },
    });
  }
  useEffect(() => {
    if (user) {
      refetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateQuery]);
  return (
    <DashboardShell
      title="Billing Dashboard"
      subtitle="Track and process outbound transmittals"
      icon={<Send className="w-5 h-5" />}
    >
      <div className="flex justify-end">
        <DateRangePicker
          onUpdate={handleUpdate}
          initialDateFrom={
            new Date(new Date().setDate(new Date().getDate() - 30))
          }
          initialDateTo={new Date()}
          align="end"
          showCompare={false}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Transmittals" value={data?.total} />
        <StatCard title="Pending" value={data?.pending} />
        <StatCard title="Endorsed" value={data?.endorsed} />
        <StatCard title="Forwarded" value={data?.forwarded} />
        <StatCard title="Sent" value={data?.sent} />
      </div>
      <ActionCard
        title="Billing Management"
        description="Configure and maintain receiver records."
        href="/client/bill-management/transmittal"
      />
    </DashboardShell>
  );
}

export function BillingOfficerDashboard() {
  const { data, refetch } = useFetchTransmittalStats();
  const user = useCurrentUser();
  const { dateQuery, handleUpdate } = useDateRangeFilter();

  function refetchStats() {
    refetch({
      query: {
        client_id: user?.client.id,
        assigned_billing_officer: user?.id,
        ...dateQuery,
      },
    });
  }

  useEffect(() => {
    if (user) {
      refetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateQuery]);

  return (
    <DashboardShell
      title="Billing Officer Dashboard"
      subtitle="Track and process outbound transmittals"
      icon={<Send className="w-5 h-5" />}
    >
      <div className="flex justify-end">
        <DateRangePicker
          onUpdate={handleUpdate}
          initialDateFrom={
            new Date(new Date().setDate(new Date().getDate() - 30))
          }
          initialDateTo={new Date()}
          align="end"
          showCompare={false}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard title="Assigned" value={data?.endorsed} />
        <StatCard title="Forwarded" value={data?.forwarded} />
      </div>
      <ActionCard
        title="Outbound Transmittals"
        description="Open your assigned outbound transmittals and continue work."
        href="/client/outbound/transmittals"
      />
    </DashboardShell>
  );
}

export function OperationsDashboard() {
  const { data, refetch } = useFetchTransmittalStats();
  const user = useCurrentUser();
  const { dateQuery, handleUpdate } = useDateRangeFilter();

  function refetchStats() {
    refetch({
      query: {
        client_id: user?.client.id,
        assigned_operation_admin: user?.id,
        ...dateQuery,
      },
    });
  }
  useEffect(() => {
    if (user) {
      refetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dateQuery]);

  return (
    <DashboardShell
      title="Operations Dashboard"
      subtitle="Monitor and process operations transmittals"
      icon={<Wrench className="w-5 h-5" />}
    >
      <div className="flex justify-end">
        <DateRangePicker
          onUpdate={handleUpdate}
          initialDateFrom={
            new Date(new Date().setDate(new Date().getDate() - 30))
          }
          initialDateTo={new Date()}
          align="end"
          showCompare={false}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard title="Assigned" value={data?.pending} />
        <StatCard title="Endorsed" value={data?.endorsed} />
      </div>
      <ActionCard
        title="Operations Transmittals"
        description="Review and process operations-side transmittals."
        href="/client/operations/transmittal"
      />
    </DashboardShell>
  );
}
