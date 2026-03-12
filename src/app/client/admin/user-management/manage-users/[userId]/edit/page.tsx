"use client";

import Loader from "@/components/ui/loader";
import { useFetchUser, useUpdateUser } from "@/hooks/use-user";
import { useParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { UserForm } from "../../forms";
import { toast } from "sonner";

export default function Page() {
  return (
    <Suspense fallback={<Loader loading={true} />}>
      <EditUserPage />
    </Suspense>
  );
}

function EditUserPage() {
  const params = useParams<{ userId: string }>();
  const { refetch, data, loading } = useFetchUser(params.userId);
  const { loading: updatingUser, execute } = useUpdateUser();

  useEffect(() => {
    if (params.userId) {
      refetch({ params: `/${params.userId}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
