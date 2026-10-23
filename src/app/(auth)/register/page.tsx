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
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      // Registration only creates the org + owner user (backend/app/services/auth.py -
      // register_organization_and_owner); it doesn't log in - so log in immediately after,
      // matching the two real backend calls that happen rather than assuming one covers both.
      await authApi.register(values);
      await login({
        email: values.email,
        password: values.password,
        organization_slug: values.organization_slug,
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError("That organization URL is already taken. Try a different one.");
      } else {
        setFormError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Create your organization</h1>
          <p className="mt-1 text-sm text-neutral-500">You&apos;ll be the owner.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}

          <Input
            label="Your name"
            autoComplete="name"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 10 characters"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Organization name"
            placeholder="Acme Inc"
            error={errors.organization_name?.message}
            {...register("organization_name")}
          />
          <Input
            label="Organization URL"
            placeholder="acme"
            hint="Lowercase letters, numbers, and hyphens only"
            error={errors.organization_slug?.message}
            {...register("organization_slug")}
          />

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Create organization
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
