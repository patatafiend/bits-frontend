import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, PasswordInput } from "@/components/ui/input";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import RoleComboBox from "@/components/role-combo-box";
import ClientComboBox from "@/components/client-combobox";
// import { MultiSelectRef, MultiSelect } from "@/components/ui/multi-select";
import AccountTypeSelect from "@/components/account-type-select";
//import { useCreateRole } from "@/hooks/use-role-permission";
import Loader from "@/components/ui/loader";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ControlledDialog from "@/components/controlled-dialog";
import useFileUpload from "@/hooks/use-file-upload";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { Check, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm, useWatch } from "react-hook-form";
import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFetchRoles } from "@/hooks/use-role-permission";
import { useFetchBusinessUnits, useFetchClients } from "@/hooks/use-client";
import { User } from "@/lib/types";
import { useMemo } from "react";
import { useCurrentUser } from "@/components/providers/auth-provider";
import { MultiSelect } from "@/components/ui/multi-select";

const formSchema = z.object({
  username: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .union([
      z.literal(""),
      z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(100),
    ])
    .optional(),
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters long" })
    .max(100),
  middle_name: z
    .string()
    .max(100, { message: "Middle name must be at most 100 characters long" }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters long" })
    .max(100),
  phone_number: z
    .string()
    .min(10, { message: "Phone number must be at least 10 characters long" })
    .max(15, { message: "Phone number must be at most 15 characters long" }),
  account_type: z.enum(
    ["company_account", "admin_account", "billing_account"],
    {
      message: "Please select an account type",
    },
  ),
  profile_url: z.string().url(),
  warehouses: z.array(z.number()).optional(),
  role_id: z.number({ message: "Please select a role" }).min(1).optional(),
  client_id: z.number({ message: "Please select a client" }).min(1).optional(),
  business_unit_ids: z.array(z.string()).optional(),
  is_blocked: z.boolean(),
  allow_skip_mfa: z.boolean(),
});

const DEFAULT_AVATAR =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

const BASE_FORM_DEFAULTS: Partial<z.infer<typeof formSchema>> = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  phone_number: "",
  account_type: "company_account",
  profile_url:
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
  warehouses: [],
  allow_skip_mfa: false,
  role_id: undefined,
  client_id: undefined,
  business_unit_ids: [],
  is_blocked: false,
};

const isValidUrl = (v?: string | null) => {
  try {
    new URL(v ?? "");
    return true;
  } catch {
    return false;
  }
};

const buildDefaultValues = (
  overrides?: Partial<z.infer<typeof formSchema>>,
): Partial<z.infer<typeof formSchema>> => ({
  ...BASE_FORM_DEFAULTS,
  ...overrides,
  profile_url: isValidUrl(overrides?.profile_url)
    ? overrides!.profile_url
    : DEFAULT_AVATAR,
  warehouses: overrides?.warehouses ?? BASE_FORM_DEFAULTS.warehouses,
  role_id: overrides?.role_id ?? BASE_FORM_DEFAULTS.role_id,
  client_id: overrides?.client_id ?? BASE_FORM_DEFAULTS.client_id,
  business_unit_ids: overrides?.business_unit_ids ?? [],
  password: overrides?.password ?? BASE_FORM_DEFAULTS.password,
});

export function UserForm({
  defaulValues,
  onSubmitSuccess,
  loading,
  isEdit,
  mfa_enabled,
}: {
  defaulValues?: Partial<z.infer<typeof formSchema>>;
  onSubmitSuccess?: (values: z.infer<typeof formSchema>) => void;
  loading?: boolean;
  isEdit?: boolean;
  mfa_enabled?: boolean;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: buildDefaultValues(defaulValues),
  });

  const user = useCurrentUser();
  const { data: roles, loading: loadingRoles } = useFetchRoles();
  const {
    data: clients,
    loading: loadingClients,
    refetch: refetchClients,
  } = useFetchClients();
  const {
    data: businessUnits,
    loading: loadingBusinessUnits,
    refetch: refetchBusinessUnits,
  } = useFetchBusinessUnits();

  // const multiSelectRef = useRef<MultiSelectRef>(null);
  const defaultsSignatureRef = useRef<string | undefined>(undefined);

  const accountType = useWatch({
    control: form.control,
    name: "account_type",
  });
  const clientId = useWatch({ control: form.control, name: "client_id" });

  useEffect(() => {
    const nextValues = buildDefaultValues(defaulValues);
    const signature = JSON.stringify(nextValues);
    if (defaultsSignatureRef.current !== signature) {
      defaultsSignatureRef.current = signature;
      form.reset(nextValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaulValues]);

  useEffect(() => {
    if (user?.company?.id) {
      refetchClients({ query: { company_id: user.company.id } });
    }
  }, [user?.company?.id]);

  // Effect 2 — fetch BUs when client changes
  useEffect(() => {
    if (clients) {
      refetchBusinessUnits({ params: `${clientId}/business_units` });
      form.setValue("business_unit_ids", []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (onSubmitSuccess) {
      onSubmitSuccess(values);
      return;
    }
  }
  return (
    <Card className="p-6 mx-auto">
      <CardHeader>
        <h2 className="text-lg font-semibold">
          {isEdit ? "Update User" : "Create User"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Fill in the details below to {isEdit ? "update" : "create"} a user.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Form {...form}>
            <FormField
              control={form.control}
              name="profile_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image</FormLabel>
                  <FormControl>
                    <SelectImageDialog
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!mfa_enabled ? (
              <FormField
                control={form.control}
                name="allow_skip_mfa"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mb-0">Allow Skip MFA</FormLabel>
                  </FormItem>
                )}
              />
            ) : (
              <Badge variant="default" className="mb-4 flex items-center gap-2">
                <Check /> <span>User has MFA enabled</span>
              </Badge>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Enter password"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter middle name (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="">Account Type</FormLabel>
                    <FormControl>
                      <AccountTypeSelect
                        className="w-full"
                        value={field.value}
                        onSelect={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {accountType !== "company_account" && (
                <>
                  <Loader loading={loadingClients}>
                    <FormField
                      control={form.control}
                      name="client_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <FormControl>
                            <ClientComboBox
                              clientData={
                                Array.isArray(clients) ? clients : null
                              }
                              value={field.value}
                              onValueChange={field.onChange}
                              allowNull={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Loader>
                  {clientId && (
                    <Loader loading={loadingBusinessUnits}>
                      <FormField
                        control={form.control}
                        name="business_unit_ids"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business units</FormLabel>
                            <FormControl>
                              <MultiSelect
                                modalPopover
                                placeholder="Select business units"
                                options={(businessUnits ?? [])
                                  .filter((bu) => bu.is_active)
                                  .map((bu) => ({
                                    value: bu.id.toString(),
                                    label: bu.code
                                      ? `${bu.name} (${bu.code})`
                                      : bu.name,
                                  }))}
                                onValueChange={field.onChange}
                                value={field.value ?? []}
                                defaultValue={field.value ?? []}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Loader>
                  )}
                  <Loader loading={loadingRoles}>
                    <FormField
                      control={form.control}
                      name="role_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <RoleComboBox
                              roles={Array.isArray(roles) ? roles : null}
                              allowEmpty={false}
                              value={field?.value?.toString() || ""}
                              onValueChange={(accType: string) => {
                                field.onChange(Number(accType));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Loader>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button loading={loading} type="submit">
                {isEdit ? "Update User" : "Create User"}
              </Button>
            </div>
          </Form>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectImageDialog({
  onChange,
  value,
}: {
  onChange: (url: string) => void;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const {
    uploadFileToS3,
    progress,
    uploading,
    file,
    handleFileChange,
    error,
    compressing,
  } = useFileUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleFileChange(acceptedFiles);
    },
    [handleFileChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 15 * 1024 * 1024,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
  });

  async function handleConfirm() {
    const url = await uploadFileToS3(`profiles`);
    if (url) {
      onChange(url);
      setOpen(false);
    }
  }

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  return (
    <div>
      <Avatar
        onClick={() => setOpen(true)}
        className="h-20 w-20 mb-4 hover:cursor-pointer bg-primary"
      >
        <AvatarImage src={value?.startsWith("http") ? value : DEFAULT_AVATAR} />
        <AvatarFallback>
          <Pencil className="h-6 w-6 text-white" />
        </AvatarFallback>
      </Avatar>

      <ControlledDialog
        title="Select Image"
        description=""
        open={open}
        setOpen={setOpen}
      >
        <div className="space-y-4">
          <div className="w-full max-w-md border-2 border-dashed rounded-2xl overflow-hidden">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center p-8 cursor-pointer transition ${
                isDragActive ? "bg-background" : "bg-muted"
              }`}
            >
              <input {...getInputProps()} />
              <p className="text-muted-foreground text-sm">
                {isDragActive
                  ? "Drop the image here..."
                  : "Drag & drop or click to select"}
              </p>

              {/* Preview: new file > existing value > browse button */}
              {previewUrl ? (
                <Image
                  className="mt-4 rounded-lg object-cover"
                  src={previewUrl}
                  alt="Preview"
                  width={400}
                  height={400}
                />
              ) : value ? (
                <Image
                  className="mt-4 rounded-lg object-cover"
                  src={value}
                  alt="Current profile"
                  width={400}
                  height={400}
                />
              ) : (
                <Button variant="outline" size="sm" className="mt-4">
                  Browse Files
                </Button>
              )}
            </div>
          </div>

          {progress > 0 && <Progress value={progress} />}
          {compressing && (
            <p className="text-blue-500 text-sm text-center">
              Compressing image...
            </p>
          )}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            className="w-full"
            disabled={!file || uploading || compressing}
            onClick={handleConfirm}
          >
            {uploading
              ? "Uploading..."
              : compressing
                ? "Compressing..."
                : "Confirm"}
          </Button>
        </div>
      </ControlledDialog>
    </div>
  );
}
