"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/auth/AuthContext";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { acceptInviteSchema, type AcceptInviteFormValues } from "@/lib/validation/schemas";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { applyToken } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({ resolver: zodResolver(acceptInviteSchema) });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <Alert tone="danger">This invite link is missing its token. Ask whoever invited you for a fresh link.</Alert>
      </div>
    );
  }

  const onSubmit = async (values: AcceptInviteFormValues) => {
    setFormError(null);
    try {
      const result = await authApi.acceptInvite({ token, password: values.password });
      applyToken(result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? "This invite link is invalid or has expired. Ask whoever invited you for a fresh one."
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-neutral-900">Set your password</h1>
          <p className="mt-1 text-sm text-neutral-500">Finish joining your team.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 10 characters"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Join organization
          </Button>
        </form>
      </div>
    </div>
  );
}

/** useSearchParams() must sit under a Suspense boundary or `next build` fails while
 * prerendering this route (Next 15). */
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
