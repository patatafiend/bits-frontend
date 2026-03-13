"use client";

import { useCreateUser } from "@/hooks/use-user";
import { UserForm } from "../forms";
import { toast } from "sonner";

export default function CreateUserPage() {
  const { execute: createUser, loading: loadingUser } = useCreateUser();

  return (
    <div>
      <UserForm
        onSubmitSuccess={async (values) => {
          const { error } = await createUser({ body: values });
          if (error) {
            toast.error("User creation failed: ", {
              description: error.message,
            });
          } else {
            toast.success("User successfully created");
          }
        }}
        loading={loadingUser}
      />
    </div>
  );
}
