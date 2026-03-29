"use client";

import Loader from "@/components/ui/loader";
import { useFetchUser, useUpdateUser } from "@/hooks/use-user";
import { useParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { UserForm } from "../../forms";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/providers/auth-provider";

export default function Page() {
  return (
    <Suspense fallback={<Loader loading={true} />}>
      <EditUserPage />
    </Suspense>
  );
}

function EditUserPage() {
  const params = useParams();
  const userId = params.userId;
  const { refetch, data, loading } = useFetchUser();
  const { loading: updatingUser, execute } = useUpdateUser();
  const user = useCurrentUser();

  useEffect(() => {
    if (user?.client.id) {
      refetch({
        params: `/${userId}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.client.id]);

  return (
    <div>
      {data && (
        <UserForm
          loading={loading || updatingUser}
          mfa_enabled={data.mfa_enabled}
          defaulValues={{
            ...data,
            account_type:
              data.account_type === "company_account" ||
              data.account_type === "admin_account" ||
              data.account_type === "billing_account"
                ? data.account_type
                : undefined,
          }}
          isEdit
          onSubmitSuccess={async (values) => {
            if (!params.userId) {
              toast.error("User is required");
            }
            const { error } = await execute({
              params: `/${params.userId}`,
              body: values,
            });
            console.log("Submitting", values);
            if (!error) {
              toast.success("User updated successfully");
            } else {
              toast.error(error.message);
            }
          }}
        />
      )}
    </div>
  );
}
