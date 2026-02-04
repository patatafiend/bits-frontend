"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useSignIn,
  //  useRefreshToken,
} from "@/components/providers/auth-provider";
import { PasswordInput } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { execute, loading, error } = useSignIn();
  const router = useRouter();

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(4).max(255),
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit({ email, password }: z.infer<typeof loginSchema>) {
    const response = await execute({ body: { email, password } });

    if (response.error) {
      toast.error("Sign In Failed.");
      return;
    }

    if (
      response.data &&
      "mfa_required" in response.data &&
      response.data.mfa_required
    ) {
      console.log("mfa true");
      router.push("/signin/mfa");
    } else {
      console.log("mfa false");
      router.push("/auth/mfa/verify");
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={loginForm.handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your account to continue
        </p>
      </div>
      <div className="grid gap-4">
        <Field>
          <FieldLabel className="text-sm font-medium">Email</FieldLabel>
          <Input
            type="email"
            placeholder="name@example.com"
            disabled={loading}
            {...loginForm.register("email")}
          />
          <FieldError>{loginForm.formState.errors.email?.message}</FieldError>
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel className="text-sm font-medium">Password</FieldLabel>
            <Link
              href="/auth/forgot_password"
              className="text-xs text-primary hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            disabled={loading}
            {...loginForm.register("password")}
          />
          <FieldError>
            {loginForm.formState.errors.password?.message || error?.message}
          </FieldError>
        </Field>
        <Button loading={loading} type="submit" className="w-full" size="lg">
          Sign in
        </Button>
      </div>
    </form>
  );
}
