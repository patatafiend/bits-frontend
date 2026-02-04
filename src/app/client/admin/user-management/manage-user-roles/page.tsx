"use client";
import { DrawerDialog } from "@/components/drawer-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useFetchPermissions,
  useFetchRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/hooks/use-role-permission";
import {
  CreateRole,
  Permission,
  Role,
  RoleWithUserPermissions,
  User,
} from "@/lib/types";
import { formatDate, formatFullName } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus, SquareArrowOutUpRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import Link from "next/link";

function formatPermission(perm: Permission) {
  return `${perm.resource}:${perm.action}`;
}

export default function ManageRoles() {
  const {
    data: roles,
    loading: loadingRoles,
    refetch: refetchRoles,
  } = useFetchRoles();
  const account_type = "company_account";
  const { data: permissions } = useFetchPermissions();

  return (
    <div>
      <Card>
        <CardContent>
          <Loader loading={loadingRoles}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Manage Roles</h2>
              <CreateRoleDialog
                permissions={permissions || []}
                onSubmit={async () => {
                  refetchRoles({ query: { account_type } });
                }}
                account_type={account_type}
              />
            </div>
            <Table>
              <TableCaption>A list of available roles.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Role</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Date Updated</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        {role.name}
                        <span className="text-xs text-muted-foreground">
                          {role.description
                            ? `${role.description}`
                            : "No description"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(role.created_at)}</TableCell>
                    <TableCell>{formatDate(role.updated_at)}</TableCell>
                    <TableCell>
                      <PermissionListDialog rolePermissions={role} />
                    </TableCell>

                    <TableCell>
                      <UserListDialog users={role.users} />
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {role && (
                        <EditRoleDialog
                          onSubmit={async () => {
                            refetchRoles({ query: { account_type } });
                          }}
                          role={role}
                          permissions={permissions || []}
                        />
                      )}

                      <DeleteRoleDialog
                        roleId={role.id.toString()}
                        users={role.users}
                        onDelete={async () => {
                          refetchRoles({ query: { account_type } });
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Loader>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateRoleDialog({
  permissions,
  onSubmit,
  account_type,
}: {
  permissions: Permission[];
  onSubmit: () => Promise<void> | void;
  account_type: string;
}) {
  const { execute: createRole, loading: creatingRole, error } = useCreateRole();
  const formSchema = z.object({
    name: z
      .string()
      .min(2)
      .max(100, "Name must be between 2 and 100 characters"),
    description: z
      .string()
      .max(255, "Description must be at most 255 characters"),
    permissions: z
      .array(z.string())
      .min(1, "At least one permission is required"),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  async function handleSubmit(
    data: z.infer<typeof formSchema>,
    close: () => void,
  ) {
    const roleData: CreateRole = {
      role_schema: {
        name: data.name,
        description: data.description,
        account_type,
      },
      permissions: data.permissions,
    };
    const { error: createRoleError } = await createRole({ body: roleData });
    if (!createRoleError) {
      close();
      onSubmit();
      toast.success("Role created successfully");
    } else {
      toast.error(error?.message);
    }
  }

  return (
    <DrawerDialog
      title="Create Role"
      description="Create a new role for users"
      renderTrigger={
        <Button variant="outline" className="mb-4">
          <Plus />
          Add Role
        </Button>
      }
    >
      {(close) => (
        <form
          onSubmit={form.handleSubmit(async (values) => {
            await handleSubmit(values, close!);
          })}
          className="space-y-6"
        >
          <Form {...form}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter role name" {...field} />
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
                  <FormLabel>Role Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter role description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <FormControl>
                    <MultiSelect
                      modalPopover
                      placeholder="Select permissions"
                      options={permissions.map((perm) => ({
                        value: perm.id.toString(),
                        label: `${perm.resource}:${perm.action}`,
                      }))}
                      {...field}
                      onValueChange={field.onChange}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button loading={creatingRole} type="submit" className="w-full">
              Create Role
            </Button>
          </Form>
        </form>
      )}
    </DrawerDialog>
  );
}

function EditRoleDialog({
  onSubmit,
  role,
  permissions,
}: {
  onSubmit: () => Promise<void> | void;
  role: RoleWithUserPermissions;
  permissions: Permission[];
}) {
  const { execute, loading } = useUpdateRole();
  const formSchema = z.object({
    name: z
      .string()
      .min(2)
      .max(100, "Name must be between 2 and 100 characters"),
    description: z
      .string()
      .max(255, "Description must be at most 255 characters"),
    permissions: z
      .array(z.string())
      .min(1, "At least one permission is required"),
  });
  const permissionIds = role.permissions.map((p) => p.id.toString());
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: permissionIds || [],
    },
  });

  async function handleSubmit(
    data: z.infer<typeof formSchema>,
    close: () => void,
  ) {
    const { error } = await execute({
      params: `/${role.id}`,
      body: data,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role updated successfully");
    close();
    onSubmit();
  }

  return (
    <div>
      <DrawerDialog
        title="Update Role"
        description="Update an existing role for users"
        renderTrigger={
          <Button size="sm" variant="secondary">
            Edit
          </Button>
        }
      >
        {(close) => (
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await handleSubmit(values, close!);
            })}
            className="space-y-6"
          >
            <Form {...form}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} />
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
                    <FormLabel>Role Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormControl>
                      <MultiSelect
                        modalPopover
                        placeholder="Select permissions"
                        options={permissions.map((perm) => ({
                          value: perm.id.toString(),
                          label: `${perm.resource}:${perm.action}`,
                        }))}
                        {...field}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={permissionIds}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button loading={loading} type="submit" className="w-full">
                Update Role
              </Button>
            </Form>
          </form>
        )}
      </DrawerDialog>
    </div>
  );
}

function PermissionListDialog({
  rolePermissions,
}: {
  rolePermissions: Role & { permissions: Permission[] };
}) {
  return (
    <DrawerDialog
      title="Permissions"
      description={`Permissions for role: ${rolePermissions.name}`}
      renderTrigger={
        <Button size="sm" variant="outline" className="mb-4">
          <Eye />
          View Permissions ({rolePermissions.permissions.length})
        </Button>
      }
    >
      <div className="space-y-4 overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rolePermissions.permissions.map((perm) => (
              <TableRow key={perm.id}>
                <TableCell>{formatPermission(perm)}</TableCell>
                <TableCell>{perm.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DrawerDialog>
  );
}

function UserListDialog({ users }: { users: User[] }) {
  return (
    <div>
      <DrawerDialog
        title="Users"
        description={`Users with this role`}
        renderTrigger={
          <Button size="sm" variant="outline" className="mb-4">
            <Eye />
            View Users ({users.length})
          </Button>
        }
      >
        <div className="space-y-4 overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      target="_blank"
                      className="flex items-center gap-2"
                      href={`/client/admin/user-management/manage-users/${user.id}`}
                    >
                      {formatFullName(user)}
                      <SquareArrowOutUpRight size={12} />
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DrawerDialog>
    </div>
  );
}

function DeleteRoleDialog({
  roleId,
  users,
  onDelete,
}: {
  roleId: string;
  users: User[];
  onDelete: () => void;
}) {
  const { execute, loading } = useDeleteRole();

  async function handleDelete() {
    const { error } = await execute({ params: `/${roleId}` });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role deleted successfully");
    onDelete();
  }
  return (
    <DrawerDialog
      title="Delete Role"
      description={"Delete this role"}
      renderTrigger={
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      }
    >
      {users.length === 0 ? (
        <div className="space-y-4">
          <p>This role will be permanently deleted.</p>
          <p>Users with this role will lose access to their permissions.</p>
          <Button
            loading={loading}
            className="w-full mt-4"
            variant="destructive"
            onClick={handleDelete}
          >
            Confirm Delete Role
          </Button>
        </div>
      ) : (
        <div className="text-sm">
          <div className="text-muted-foreground space-y-2 mb-4">
            <p>This role cannot be deleted because it is assigned to users.</p>
            <p>Please reassign or remove the role from these users first.</p>
          </div>
          <h3 className="font-medium mb-2">Users with this role:</h3>
          <ul>
            {users.map((user) => (
              <li key={user.id} className="list-disc ml-6">
                {formatFullName(user)} ({user.email})
              </li>
            ))}
          </ul>
        </div>
      )}
    </DrawerDialog>
  );
}
