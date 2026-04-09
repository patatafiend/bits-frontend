"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "@/hooks/use-user";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-5xl shadow-2xl border-0 overflow-hidden animate-fade-in">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            <div className="flex flex-col p-8 md:p-12 lg:p-16">
              <div className="mb-8"></div>
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-sm">
                  <ForgotPasswordComponent />
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

export function ForgotPasswordComponent() {
  const { execute, loading, error } = useForgotPassword();

  const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
  });

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit({ email }: z.infer<typeof forgotPasswordSchema>) {
    const response = await execute({ body: { email } });

    if (response.error) {
      toast.error(
        response.error.message || "Failed to send password reset email",
      );
      return;
    }

    toast.success("Password reset email sent successfully");
    form.reset();
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
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        <div className="grid gap-4">
          <Field>
            <FieldLabel className="text-sm font-medium">Email</FieldLabel>
            <Input
              type="email"
              placeholder="name@example.com"
              disabled={loading}
              {...form.register("email")}
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Remember your password? </span>
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
