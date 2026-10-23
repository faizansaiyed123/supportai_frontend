import { apiFetch } from "./client";
import type {
  AcceptInviteRequest,
  AccessTokenResponse,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequestRequest,
  RegisterRequest,
  UserPublic,
} from "@/types/api";

export const authApi = {
  register: (req: RegisterRequest) =>
    apiFetch<UserPublic>("/auth/register", { method: "POST", body: req, skipAuthRetry: true }),

  login: (req: LoginRequest) =>
    apiFetch<AccessTokenResponse>("/auth/login", { method: "POST", body: req, skipAuthRetry: true }),

  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),

  acceptInvite: (req: AcceptInviteRequest) =>
    apiFetch<AccessTokenResponse>("/auth/invites/accept", { method: "POST", body: req, skipAuthRetry: true }),

  requestPasswordReset: (req: PasswordResetRequestRequest) =>
    apiFetch<{ detail: string }>("/auth/password-reset/request", {
      method: "POST",
      body: req,
      skipAuthRetry: true,
    }),

  confirmPasswordReset: (req: PasswordResetConfirmRequest) =>
    apiFetch<void>("/auth/password-reset/confirm", { method: "POST", body: req, skipAuthRetry: true }),
};
