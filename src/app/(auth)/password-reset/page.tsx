"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { authApi } from "@/lib/api/auth";
import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  type PasswordResetConfirmFormValues,
  type PasswordResetRequestFormValues,
} from "@/lib/validation/schemas";

/**
 * Two modes on one route, distinguished by a `?token=` query param - matches the backend's own
 * two-step flow (request vs confirm, backend/app/services/auth.py). The request step ALWAYS
 * shows the same success message regardless of whether the email exists (backend
 * enumeration-safety, D027) - the frontend must not undermine that by, say, showing a
 * different message on a 404 it doesn't actually get (the backend never returns one here).
 */
function PasswordResetRouter() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return token ? <ConfirmForm token={token} /> : <RequestForm />;
}

/** useSearchParams() must sit under a Suspense boundary or `next build` fails while
 * prerendering this route (Next 15). */
export default function PasswordResetPage() {
  return (
    <Suspense fallback={null}>
      <PasswordResetRouter />
    </Suspense>
  );
}

function RequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestFormValues>({ resolver: zodResolver(passwordResetRequestSchema) });

  if (submitted) {
    return (
      <Centered>
        <Alert tone="info">
          If that email is registered, password reset instructions have been issued. Check with your
          administrator if you don&apos;t hear back - email delivery for this isn&apos;t wired up in every
          environment yet.
        </Alert>
      </Centered>
    );
  }

  return (
    <Centered title="Reset your password" subtitle="We'll issue reset instructions for that email.">
      <form
        onSubmit={handleSubmit(async (values) => {
          await authApi.requestPasswordReset(values);
          setSubmitted(true); // always shown, regardless of the (intentionally opaque) result
        })}
        noValidate
        className="space-y-4"
      >
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset instructions
        </Button>
      </form>
      <p className="text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </Centered>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmFormValues>({ resolver: zodResolver(passwordResetConfirmSchema) });

  if (done) {
    return (
      <Centered>
        <Alert tone="info">Your password has been reset. You can now sign in with your new password.</Alert>
        <p className="text-center text-sm">
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Go to sign in
          </Link>
        </p>
      </Centered>
    );
  }

  return (
    <Centered title="Choose a new password">
      <form
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          try {
            await authApi.confirmPasswordReset({ token, new_password: values.new_password });
            setDone(true);
          } catch {
            setFormError("This reset link is invalid or has expired. Request a new one.");
          }
        })}
        noValidate
        className="space-y-4"
      >
        {formError && <Alert tone="danger">{formError}</Alert>}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters"
          error={errors.new_password?.message}
          {...register("new_password")}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </Centered>
  );
}

function Centered({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        {title && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
