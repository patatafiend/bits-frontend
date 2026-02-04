"use client";

import { useGetCurrentUser } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "sonner";
import { useMfaSetup, useMfaVerify } from "@/hooks/use-mfa";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError } from "@/components/ui/field";

export default function Mfa() {
  // const { data: currentUser, redirectToDashboard } = useGetCurrentUser();
  const { data: currentUser } = useGetCurrentUser();
  const { execute: submitVerify, loading: submitLoading } = useMfaVerify();
  const { data: mfa, loading: loadingMFA, error: errorMFA } = useMfaSetup();

  const formSchema = z.object({
    code: z
      .string()
      .length(6, "Code must be 6 digits")
      .regex(/^\d+$/, "Code must be numeric"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const { error } = await submitVerify({ body: { mfa_code: data.code } });
    if (error) {
      form.setError("code", { type: "manual", message: error.message });
    } else {
      toast.success("MFA setup successfully", {
        description: "Your account is now secured with MFA.",
      });
      if (currentUser) {
        // redirectToDashboard(currentUser);
        console.log("successss!");
      }
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Setup MFA</h1>
          <p className="text-muted-foreground mt-2">
            Secure your account with an authenticator app
          </p>
        </div>
        <Loader loading={loadingMFA} error={errorMFA?.message}>
          {mfa && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <QRCodeSVG
                  value={mfa.totp_uri}
                  size={100}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-md font-semibold">
                  Scan this QR code with your authenticator app
                </h3>
                <p className="text-xs text-muted-foreground">
                  Use Google Authenticator, Authy, or any compatible TOTP app
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Manual Entry Key:</p>
                <div className="flex items-center mt-1">
                  <code className="text-sm bg-background px-2 py-1 rounded border">
                    {mfa.key}
                  </code>
                  <CopyToClipboard
                    onCopy={() =>
                      toast.success("Copied to clipboard!", {
                        description: mfa.key,
                      })
                    }
                    text={mfa.key}
                  >
                    <Button className="ml-2" variant="outline" size="sm">
                      <Copy />
                    </Button>
                  </CopyToClipboard>
                </div>
              </div>
              <form
                className="flex gap-2 items-center"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <Field className="flex-1">
                  <Input
                    autoFocus
                    disabled={submitLoading}
                    placeholder="Enter 6-digit code"
                    autoComplete="one-time-code"
                    {...form.register("code")}
                  />
                  <FieldError>{form.formState.errors.code?.message}</FieldError>
                </Field>
                <Button loading={submitLoading} type="submit">
                  Submit
                </Button>
              </form>
            </div>
          )}
        </Loader>

        {!currentUser?.mfa_enabled && currentUser?.allow_skip_mfa ? (
          <div className="text-center">
            <Button variant="link">Skip For Now</Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-center text-muted-foreground">
              MFA setup were required to proceed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
