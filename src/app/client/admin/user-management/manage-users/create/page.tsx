"use client";

import { useCreateUser } from "@/hooks/use-user";
import { UserForm } from "../forms";

export default function CreateUserPage() {
  const { execute: createUser, loading: loadingUser } = useCreateUser();

  return (
    <div>
      <UserForm
        onSubmitSuccess={async (values) => {
          await createUser({ body: values });
        }}
        loading={loadingUser}
      />
    </div>
  );
}
