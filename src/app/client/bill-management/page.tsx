export default function BillManagementPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Bill Management</h1>
        <p className="text-sm text-muted-foreground">
          Access receiver, transmittal, and statement workflows.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="/client/bill-management/manage-receivers"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Manage Receivers
        </a>
      </div>
    </div>
  );
}
