"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ControlledDialog from "@/components/controlled-dialog";
import BusinessUnitComboBox from "@/components/business-units";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useCreateReceiver, useUpdateReceiver } from "@/hooks/use-receiver";
import { useFetchBusinessUnits } from "@/hooks/use-client";
import { Receiver, UpdateReceiver, UserPayload } from "@/lib/types";

export function ReceiverList({
  receivers,
  onUpdated,
  onDeactivated,
  user,
  clientId,
}: {
  receivers?: Receiver[];
  onUpdated: () => void;
  onDeactivated: () => void;
  user: UserPayload | null;
  clientId: number | null;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Bill Receiver List</CardTitle>
          <div className="flex items-center gap-2">
            <AddReceiverDialog
              onAdd={onUpdated}
              user={user}
              clientId={clientId}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Business Unit</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivers?.map((receiver, index) => (
              <TableRow key={index}>
                <TableCell>{receiver.id}</TableCell>
                <TableCell>{receiver.receiver_name}</TableCell>
                <TableCell>{receiver.business_unit_id ?? "-"}</TableCell>
                <TableCell>{receiver.receiver_email}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <UpdateReceiverDialog
                      baseValues={receiver}
                      onSubmit={onUpdated}
                      user={user}
                      clientId={clientId}
                    />
                    <DeactivateReceiver
                      receiverData={receiver}
                      onConfirm={onDeactivated}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function UpdateReceiverDialog({
  onSubmit,
  baseValues,
  user,
  clientId,
}: {
  onSubmit: (data: Receiver) => void;
  baseValues?: Receiver;
  user?: UserPayload | null;
  clientId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const { execute, loading } = useUpdateReceiver();
  const {
    data: businessUnits,
    loading: loadingBusinessUnits,
    refetch: refetchBusinessUnits,
  } = useFetchBusinessUnits();

  const formSchema = z.object({
    receiver_name: z
      .string()
      .min(1, { message: "Receiver name should have atleast 1 characters" }),
    receiver_email: z.email("Invalid Email"),
    receiver_phone: z.string().optional(),
    business_unit_id: z.number().min(1, "Business Unit is required."),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiver_name: baseValues?.receiver_name || "",
      receiver_email: baseValues?.receiver_email || "",
      receiver_phone: baseValues?.receiver_phone || "",
      business_unit_id:
        baseValues?.business_unit_id ?? (undefined as unknown as number),
    },
  });

  useEffect(() => {
    if (!open || !clientId) {
      return;
    }
    form.reset({
      receiver_name: baseValues?.receiver_name || "",
      receiver_email: baseValues?.receiver_email || "",
      receiver_phone: baseValues?.receiver_phone || "",
      business_unit_id:
        baseValues?.business_unit_id ?? (undefined as unknown as number),
    });
    refetchBusinessUnits({ params: `${clientId}/business_units` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId, baseValues?.id]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    if (baseValues?.id) {
      const { data, error } = await execute({
        params: `/${baseValues.id}`,
        body: {
          receiver_name: values.receiver_name.trim(),
          receiver_email: values.receiver_email,
          receiver_phone: values.receiver_phone,
          receiver_position: "",
          business_unit_id: values.business_unit_id,
          created_by: user?.username,
          client_id: clientId ?? undefined,
        },
      });
      if (!error) {
        toast.success("Receiver successfully updated");
        onSubmit(data);
        setOpen(false);
      } else {
        toast.error(`Error updating receiver: ${error.message}`);
      }
    }
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        Edit
      </Button>
      <ControlledDialog
        title="Update Receiver"
        description=""
        open={open}
        setOpen={setOpen}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="receiver_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      onChange={(e) => field.onChange(e.target.value || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Loader loading={loadingBusinessUnits}>
              <FormField
                control={form.control}
                name="business_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Unit</FormLabel>
                    <FormControl>
                      <BusinessUnitComboBox
                        businessUnitData={
                          Array.isArray(businessUnits) ? businessUnits : null
                        }
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                        allowNull={false}
                        placeholder="Select business unit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Loader>
            <FormField
              control={form.control}
              name="receiver_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      onChange={(e) => field.onChange(e.target.value || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiver_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      onChange={(e) => field.onChange(e.target.value || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </ControlledDialog>
    </div>
  );
}

export function DeactivateReceiver({
  onConfirm,
  receiverData,
}: {
  onConfirm: (data: UpdateReceiver) => void;
  receiverData?: UpdateReceiver;
}) {
  const [open, setOpen] = useState(false);
  const { execute, loading } = useUpdateReceiver();

  async function deactivateReceiver() {
    const { data, error } = await execute({
      params: `/${receiverData?.id}`,
      body: {
        is_active: false,
      },
    });
    if (!error) {
      toast.success("Receiver Deactivated");
      onConfirm(data);
      setOpen(false);
    } else {
      toast.error(`Error deactivating receiver: ${error.message}`);
    }
  }

  return (
    <div>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Deactivate
      </Button>
      <ControlledDialog
        title="Deactivate Receiver"
        description={`Are you sure you want to deactivate ${receiverData?.receiver_name}?`}
        open={open}
        setOpen={setOpen}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              deactivateReceiver();
            }}
          >
            Deactivate
          </Button>
        </div>
      </ControlledDialog>
    </div>
  );
}

export function AddReceiverDialog({
  onAdd,
  disabled = false,
  user,
  clientId,
}: {
  onAdd: () => void;
  disabled?: boolean;
  user: UserPayload | null;
  clientId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const { execute, loading: addingReceiver } = useCreateReceiver();
  const {
    data: businessUnits,
    loading: loadingBusinessUnits,
    refetch: refetchBusinessUnits,
  } = useFetchBusinessUnits();

  const formSchema = z.object({
    receiver_name: z
      .string()
      .trim()
      .min(1, { message: "Receiver name is required" }),
    receiver_email: z.string().min(1, "Email required."),
    receiver_phone: z.string().optional(),
    receiver_positon: z.string().optional(),
    is_active: z.boolean().optional(),
    business_unit_id: z.number().min(1, "Business Unit is required."),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receiver_name: "",
      receiver_email: "",
      receiver_phone: "",
      receiver_positon: "",
      is_active: true,
      business_unit_id: undefined as unknown as number,
    },
  });

  useEffect(() => {
    if (!open || !clientId) {
      return;
    }

    form.reset({
      receiver_name: "",
      receiver_email: "",
      receiver_phone: "",
      receiver_positon: "",
      is_active: true,
      business_unit_id: undefined as unknown as number,
    });
    refetchBusinessUnits({ params: `${clientId}/business_units` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clientId]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { error } = await execute({
      body: {
        receiver_name: values.receiver_name.trim(),
        receiver_email: values.receiver_email,
        receiver_phone: values.receiver_phone,
        receiver_position: values.receiver_positon,
        created_by: user?.username,
        business_unit_id: values.business_unit_id,
        client_id: clientId ?? undefined,
        is_active: true,
      },
    });
    if (!error) {
      toast.success("Receiver Added");
      onAdd();
      setOpen(false);
      form.reset();
    } else if (error) {
      toast.error(error.message);
    }
  }

  return (
    <div>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        disabled={disabled || !clientId}
      >
        <Plus className="mr-2 h-4 w-4 " />
        Add Receiver
      </Button>
      <ControlledDialog
        title="Add Receiver"
        description=""
        open={open}
        setOpen={setOpen}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="receiver_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Loader loading={loadingBusinessUnits}>
              <FormField
                control={form.control}
                name="business_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Unit</FormLabel>
                    <FormControl>
                      <BusinessUnitComboBox
                        businessUnitData={
                          Array.isArray(businessUnits) ? businessUnits : null
                        }
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                        allowNull={false}
                        placeholder="Select business unit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Loader>
            <FormField
              control={form.control}
              name="receiver_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      onChange={(e) => field.onChange(e.target.value || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiver_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      onChange={(e) => field.onChange(e.target.value || "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button loading={addingReceiver} type="submit">
                Add Receiver
              </Button>
            </div>
          </form>
        </Form>
      </ControlledDialog>
    </div>
  );
}
