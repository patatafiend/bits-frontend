"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useFetchBusinessUnits,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useActivateBusinessUnit,
  useDeactivateBusinessUnit,
  useUpdateClient,
} from "@/hooks/use-client";
import { BusinessUnit, UpdateBusinessUnit, ClientDetail } from "@/lib/types";

const businessUnitSchema = z.object({
  name: z.string().min(1, "Business unit name is required"),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

type BusinessUnitFormValues = z.infer<typeof businessUnitSchema>;

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      Deactivated
    </span>
  );
}

type BUModalProps = {
  clientId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: BusinessUnit | null;
};

function BusinessUnitModal({
  clientId,
  open,
  onOpenChange,
  onSuccess,
  editData,
}: BUModalProps) {
  const { execute: createBU, loading: creating } = useCreateBusinessUnit();
  const { execute: updateBU, loading: updating } = useUpdateBusinessUnit();

  const isEdit = !!editData;
  const loading = creating || updating;

  const form = useForm<BusinessUnitFormValues>({
    resolver: zodResolver(businessUnitSchema),
    defaultValues: {
      name: "",
      code: null,
      description: null,
    },
  });

  // Reset form whenever the modal opens or editData changes
  useEffect(() => {
    if (open) {
      form.reset(
        editData
          ? {
              name: editData.name,
              code: editData.code ?? null,
              description: editData.description ?? null,
            }
          : { name: "", code: null, description: null },
      );
    }
  }, [open, editData, form]);

  async function onSubmit(values: BusinessUnitFormValues) {
    if (isEdit && editData) {
      const result = await updateBU({
        params: `${clientId}/business_units/${editData.id}`,
        body: values as UpdateBusinessUnit,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to update business unit.");
      } else {
        toast.success("Business unit updated.");
        onOpenChange(false);
        onSuccess();
      }
    } else {
      const result = await createBU({
        params: `${clientId}/business_units`,
        body: values,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to create business unit.");
      } else {
        toast.success("Business unit created.");
        onOpenChange(false);
        onSuccess();
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit business unit" : "Add business unit"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this business unit."
              : "Add a new business unit under this client."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Finance Department" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. FIN"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Save changes" : "Add unit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function BusinessUnitsSection({ clientId }: { clientId: number }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BusinessUnit | null>(null);

  const { data: units, refetch, loading } = useFetchBusinessUnits();
  const { execute: activateBU } = useActivateBusinessUnit();
  const { execute: deactivateBU } = useDeactivateBusinessUnit();

  function refetchUnits() {
    refetch({ params: `${clientId}/business_units` });
  }

  useEffect(() => {
    if (clientId) refetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  function handleEdit(bu: BusinessUnit) {
    setEditTarget(bu);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditTarget(null);
    setModalOpen(true);
  }

  async function handleToggle(bu: BusinessUnit) {
    if (bu.is_active) {
      const result = await deactivateBU({
        params: `${clientId}/business_units/${bu.id}/deactivate`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to deactivate.");
      } else {
        toast.success(`"${bu.name}" deactivated.`);
        refetchUnits();
      }
    } else {
      const result = await activateBU({
        params: `${clientId}/business_units/${bu.id}/activate`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to activate.");
      } else {
        toast.success(`"${bu.name}" activated.`);
        refetchUnits();
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Business units</CardTitle>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add business unit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-y">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Code
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && (!units || units.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No business units yet. Add one to get started.
                  </td>
                </tr>
              )}
              {!loading &&
                units?.map((bu) => (
                  <tr
                    key={bu.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        {bu.name}
                        {bu.is_default && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                            default
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {bu.code ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {bu.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={bu.is_active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(bu)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={
                            bu.is_active
                              ? "text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                              : "text-green-700 border-green-300 hover:bg-green-50"
                          }
                          onClick={() => handleToggle(bu)}
                        >
                          {bu.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <BusinessUnitModal
        clientId={clientId}
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setEditTarget(null);
        }}
        onSuccess={refetchUnits}
        editData={editTarget}
      />
    </>
  );
}

const clientEditSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  client_address: z.string().min(1, "Address is required"),
  client_phone: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => !val || /^\d+$/.test(val),
      "Phone must contain digits only",
    ),
  client_tel: z.string().nullable().optional(),
  client_description: z.string().nullable().optional(),
});

type ClientEditFormValues = z.infer<typeof clientEditSchema>;

type ClientEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  client: ClientDetail;
};

export function ClientEditModal({
  open,
  onOpenChange,
  onSuccess,
  client,
}: ClientEditModalProps) {
  const { execute: updateClient, loading } = useUpdateClient();

  const form = useForm<ClientEditFormValues>({
    resolver: zodResolver(clientEditSchema),
    defaultValues: {
      client_name: "",
      client_email: "",
      client_address: "",
      client_phone: null,
      client_tel: null,
      client_description: null,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        client_name: client.client_name,
        client_email: client.client_email,
        client_address: client.client_address,
        client_phone:
          client.client_phone != null ? String(client.client_phone) : null,
        client_tel: client.client_tel ?? null,
        client_description: client.client_description ?? null,
      });
    }
  }, [open, client, form]);

  async function onSubmit(values: ClientEditFormValues) {
    const result = await updateClient({
      params: String(client.id),
      body: {
        ...values,
        client_phone: values.client_phone || undefined,
      },
    });

    if (result.error) {
      toast.error(result.error.message ?? "Failed to update client.");
    } else {
      toast.success("Client updated successfully.");
      onOpenChange(false);
      onSuccess();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>
            Update the details for{" "}
            <span className="font-medium text-foreground">
              {client.client_name}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 py-2"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g. contact@acme.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="client_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Address <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Main St, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone + Tel side by side */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 09171234567"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_tel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telephone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 028881234"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="client_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
