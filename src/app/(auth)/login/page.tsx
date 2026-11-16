"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import { loginSchema, type LoginFormValues } from "@/lib/validation/schemas";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { organization_slug: "demo" } });

  const demoAccounts = [
    ["Owner", "owner@supportai.demo"],
    ["Admin", "admin@supportai.demo"],
    ["Agent", "agent@supportai.demo"],
    ["Viewer", "viewer@supportai.demo"],
  ] as const;

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values);
      router.push("/dashboard");
    } catch (err) {
      // Deliberately generic (matches the backend's own generic "Invalid credentials" -
      // backend/app/services/auth.py's authenticate() never distinguishes wrong-password
      // from no-such-user from not-a-member, to avoid aiding enumeration - the frontend
      // shouldn't undermine that by guessing a more specific message).
      setFormError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Sign in to SupportAI</h1>
          <p className="mt-1 text-sm text-neutral-500">Welcome back.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}

          <Input
            label="Organization URL"
            placeholder="acme"
            hint="The slug from your organization's URL, e.g. 'acme'"
            error={errors.organization_slug?.message}
            {...register("organization_slug")}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex justify-end">
            <Link href="/password-reset" className="text-sm text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Interactive demo</p>
          <p className="mt-1 text-xs text-amber-800">Use organization <strong>demo</strong>. Password for every demo account: <strong>demo1234</strong>.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {demoAccounts.map(([label, email]) => (
              <button
                key={email}
                type="button"
                onClick={() => {
                  const form = document.querySelector("form");
                  const emailInput = form?.querySelector('input[type="email"]') as HTMLInputElement | null;
                  const passwordInput = form?.querySelector('input[type="password"]') as HTMLInputElement | null;
                  const slugInput = form?.querySelector('input[name="organization_slug"]') as HTMLInputElement | null;
                  if (emailInput && passwordInput && slugInput) {
                    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
                    setter?.call(emailInput, email);
                    setter?.call(passwordInput, "demo1234");
                    setter?.call(slugInput, "demo");
                    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
                    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
                    slugInput.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                }}
                className="rounded-md border border-amber-300 bg-white px-2.5 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an organization yet?{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
