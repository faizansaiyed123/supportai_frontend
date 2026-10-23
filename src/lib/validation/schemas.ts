import { z } from "zod";

/**
 * Matches backend/app/schemas/auth.py's Pydantic field constraints exactly (D033's "hand-
 * matched, not guessed" discipline extended to validation, not just shapes) - so the frontend
 * rejects invalid input with the same rules the backend will apply anyway, giving inline
 * errors instead of a round-trip 422.
 */
export const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200, "Password must be at most 200 characters"),
  full_name: z.string().min(1, "Name is required").max(255),
  organization_name: z.string().min(1, "Organization name is required").max(255),
  organization_slug: z
    .string()
    .min(1, "Organization URL is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  organization_slug: z.string().min(1, "Organization URL is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  full_name: z.string().min(1, "Name is required").max(255),
  role: z.enum(["admin", "agent", "viewer"]),
});
export type InviteFormValues = z.infer<typeof inviteSchema>;

export const acceptInviteSchema = z.object({
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200, "Password must be at most 200 characters"),
});
export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type PasswordResetRequestFormValues = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetConfirmSchema = z.object({
  new_password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200, "Password must be at most 200 characters"),
});
export type PasswordResetConfirmFormValues = z.infer<typeof passwordResetConfirmSchema>;

export const createTicketSchema = z.object({
  customer_id: z.string().min(1, "Select a customer"),
  title: z.string().min(1, "Title is required").max(500),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});
export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export const createCustomerSchema = z.object({
  name: z.string().max(255).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  external_id: z.string().max(255).optional().or(z.literal("")),
});
export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

export const addUrlDocumentSchema = z.object({
  url: z.string().url("Enter a valid URL").max(2000),
  title: z.string().max(500).optional().or(z.literal("")),
});
export type AddUrlDocumentFormValues = z.infer<typeof addUrlDocumentSchema>;
