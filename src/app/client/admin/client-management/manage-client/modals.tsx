"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateClient } from "@/hooks/use-client";
import { ClientDetail } from "@/lib/types";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { useCurrentUser } from "@/components/providers/auth-provider";

export type ClientModalProps = {
  client_id?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  clientData?: ClientDetail;
};

export function ClientModal({
  open,
  onOpenChange,
  onSubmit,
}: ClientModalProps) {
  const { execute, loading } = useCreateClient();
  const user = useCurrentUser();

  const formSchema = z.object({
    client_name: z.string().min(1, "Transmittal Number is required"),
    client_email: z.string().email().optional(),
    client_phone: z
      .string()
      .nullable()
      .optional()
      .refine(
        (val) => !val || /^\d+$/.test(val),
        "Phone must contain digits only",
      ),
    client_address: z.string().min(5, "Address required!"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    console.log("Submitting", data);
    const { error } = await execute({
      body: {
        client_name: data.client_name,
        client_email: data.client_email || "",
        client_phone: data.client_phone || "",
        client_address: data.client_address || "",
        company_id: user?.company.id || 0,
        system_type: "",
        status: "active",
      },
    });
    if (!error) {
      onOpenChange(false);
      onSubmit();
      toast.success("Transmittal Created Successfully!");
    } else {
      toast.error(`Error: ${error.message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup className="grid">
              <Field>
                <FieldLabel>Client Name</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder=""
                      {...form.register("client_name")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_name && (
                  <FieldError>
                    {form.formState.errors.client_name.message}
                  </FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Client Email</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder=""
                      {...form.register("client_email")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_email && (
                  <FieldError>
                    {form.formState.errors.client_email.message}
                  </FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Client Phone</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder=""
                      {...form.register("client_phone")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_phone && (
                  <FieldError>
                    {form.formState.errors.client_phone.message}
                  </FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Client Address</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder=""
                      {...form.register("client_address")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_address && (
                  <FieldError>
                    {form.formState.errors.client_address.message}
                  </FieldError>
                )}
              </Field>
            </FieldGroup>
            <FieldSeparator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Save Client
              </Button>
            </div>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientUpdateModal({
  open,
  onOpenChange,
  onSubmit,
  clientData,
}: ClientModalProps) {
  const { execute, loading } = useCreateClient();

  const formSchema = z.object({
    client_name: z.string().min(1, "Transmittal Number is required"),
    client_email: z.string().optional(),
    client_phone: z
      .string()
      .nullable()
      .optional()
      .refine(
        (val) => !val || /^\d+$/.test(val),
        "Phone must contain digits only",
      ),
    client_address: z.string().min(5, "Address required!"),
    company_id: z.number().min(1, "Company id required!"),
    system_type: z.string().optional(),
    status: z.string().min(1, ""),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: clientData?.client_name,
      client_email: clientData?.client_email,
      client_phone: clientData?.client_phone || undefined,
      client_address: clientData?.client_address,
      company_id: clientData?.company_id,
      system_type: "",
      status: "active",
    },
  });

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    const { error } = await execute({
      body: {
        client_name: data?.client_name,
        client_email: data?.client_email || "",
        client_phone: data.client_phone || "",
        client_address: data?.client_address,
        company_id: data.company_id,
        system_type: data.system_type || "",
        status: "active",
      },
    });
    if (!error) {
      onOpenChange(false);
      onSubmit();
      toast.success("Transmittal Created Successfully!");
    } else {
      toast.error(`Error: ${error.message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup className="grid">
              <Field>
                <FieldLabel>Client Name</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder="INV-2024-001"
                      {...form.register("client_name")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_name && (
                  <FieldError>
                    {form.formState.errors.client_name.message}
                  </FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Client Email</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder="INV-2024-001"
                      {...form.register("client_email")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_email && (
                  <FieldError>
                    {form.formState.errors.client_email.message}
                  </FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Client Phone</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder="INV-2024-001"
                      {...form.register("client_phone")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_phone && (
                  <FieldError>
                    {form.formState.errors.client_phone.message}
                  </FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel>Client Address</FieldLabel>
                <FieldContent>
                  <div className="flex gap-2">
                    {" "}
                    <Input
                      type="text"
                      placeholder="INV-2024-001"
                      {...form.register("client_address")}
                    />
                  </div>
                </FieldContent>
                {form.formState.errors.client_address && (
                  <FieldError>
                    {form.formState.errors.client_address.message}
                  </FieldError>
                )}
              </Field>
            </FieldGroup>
            <FieldSeparator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Save Client
              </Button>
            </div>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}
