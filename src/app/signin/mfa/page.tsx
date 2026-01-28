"use client";
import { InputOTPForm } from "@/components/otp-form";
import { useMfaSignIn } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

export default function MfaSignin() {
  const { loading, execute, error } = useMfaSignIn();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-md p-6 pt-32">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">MFA Required</h1>
          <p className="text-muted-foreground mt-2">
            Your account is protected with multi-factor authentication
          </p>
        </div>
        <InputOTPForm
          onSubmit={async (data) => {
            const result = await execute({ mfa_code: data.code });
            if (!result.error) {
              router.push("/client/bill-management");
              return;
            }
          }}
          error={error?.message}
          loading={loading}
        />
      </div>
    </div>
  );
}
