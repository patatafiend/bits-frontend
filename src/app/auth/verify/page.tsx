"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePasswordReset } from "@/components/providers/auth-provider";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<Loader2 />}>
      <PasswordResetComponent />
    </Suspense>
  );
}

export function PasswordResetComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      router.push("/signin");
      return;
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-5xl shadow-2xl border-0 overflow-hidden animate-fade-in">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            <div className="flex flex-col p-8 md:p-12 lg:p-16">
              <div className="mb-8"></div>
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-sm">
                  <ResetPasswordComponent token={token} />
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent z-10" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ResetPasswordComponentProps {
  token: string | null;
}

export function ResetPasswordComponent({ token }: ResetPasswordComponentProps) {
  const { execute, loading } = usePasswordReset();
  const router = useRouter();

  const resetPasswordSchema = z
    .object({
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirm_password: z.string(),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: "Passwords don't match",
      path: ["confirm_password"],
    });

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  async function onSubmit({
    password,
    confirm_password,
  }: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    const response = await execute({
      body: { reset_token: token, password, confirm_password },
    });

    if (response.error) {
      toast.error(response.error.message || "Failed to reset password");
      return;
    }

    toast.success("Password reset successfully");
    router.push("/signin");
  }

  return (
    <div className={cn("flex flex-col gap-6")}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your new password below to reset your account
          </p>
        </div>

        <div className="grid gap-4">
          <Field>
            <FieldLabel className="text-sm font-medium">
              New Password
            </FieldLabel>
            <PasswordInput
              placeholder="Enter new password"
              disabled={loading}
              {...form.register("password")}
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel className="text-sm font-medium">
              Confirm Password
            </FieldLabel>
            <PasswordInput
              placeholder="Confirm new password"
              disabled={loading}
              {...form.register("confirm_password")}
            />
            <FieldError>
              {form.formState.errors.confirm_password?.message}
            </FieldError>
          </Field>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          Remembered your password?{" "}
        </span>
        <Link
          href="/signin"
          className="text-primary hover:underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
