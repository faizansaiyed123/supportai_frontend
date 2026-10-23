/**
 * Types here are hand-matched field-by-field against backend/app/schemas/*.py - not guessed,
 * not codegen'd (no live OpenAPI JSON was available to generate from - see D033). If the
 * backend schemas change, these need re-syncing by the same manual comparison.
 *
 * UUID and datetime fields are typed as `string` (JSON has no native UUID/Date type - Pydantic
 * serializes both as strings; parse to `Date` at the point of use, not in the type layer).
 */

// --- Auth (backend/app/schemas/auth.py) ---
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
  organization_slug: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  organization_slug: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
}

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
}

export interface InviteRequest {
  email: string;
  full_name: string;
  role: "admin" | "agent" | "viewer";
}

export interface InviteResponse {
  user_id: string;
  email: string;
  invite_token: string;
  expires_in_hours: number;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

export interface PasswordResetRequestRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
}

// --- Conversations (backend/app/schemas/conversation.py) ---
export type ConversationStatus = "open" | "escalated" | "closed";

export interface ConversationCreateRequest {
  customer_id?: string | null;
}

export interface ConversationPublic {
  id: string;
  status: ConversationStatus;
  assigned_agent_id: string | null;
  created_at: string;
}

export interface AskQuestionRequest {
  question: string;
}

export interface CitationPublic {
  chunk_id: string;
  document_id: string;
  heading_path: string | null;
  excerpt: string;
}

export interface AnswerResponse {
  message: string;
  citations: CitationPublic[];
  low_confidence: boolean;
}

export type MessageRole = "customer" | "ai" | "agent" | "system";

export interface MessagePublic {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
  citations: CitationPublic[];
}

export interface MessageListResponse {
  messages: MessagePublic[];
}

export interface ConversationListResponse {
  conversations: ConversationPublic[];
}

// --- Customers (backend/app/schemas/customer.py) ---
export interface CustomerCreateRequest {
  external_id?: string | null;
  email?: string | null;
  name?: string | null;
}

export interface CustomerPublic {
  id: string;
  external_id: string | null;
  email: string | null;
  name: string | null;
  created_at: string;
}

export interface CustomerListResponse {
  customers: CustomerPublic[];
}

// --- Knowledge / Documents (backend/app/schemas/knowledge.py) ---
export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface DocumentPublic {
  id: string;
  title: string;
  original_filename: string | null;
  mime_type: string | null;
  status: DocumentStatus;
  status_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: DocumentPublic[];
}

export interface URLDocumentCreateRequest {
  url: string;
  title?: string | null;
}

// --- Memberships (backend/app/schemas/membership.py) ---
export interface MembershipPublic {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: "owner" | "admin" | "agent" | "viewer";
  status: string;
  created_at: string;
}

export interface MembershipListResponse {
  memberships: MembershipPublic[];
}

export interface RoleChangeRequest {
  role: "admin" | "agent" | "viewer";
}

// --- Tickets (backend/app/schemas/ticket.py) ---
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketCreateRequest {
  customer_id: string;
  title: string;
  conversation_id?: string | null;
  priority?: TicketPriority;
}

export interface TicketPublic {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer_id: string;
  assigned_agent_id: string | null;
  created_at: string;
}

export interface TicketListResponse {
  tickets: TicketPublic[];
}

export interface TicketNoteCreateRequest {
  content: string;
}

export interface TicketNotePublic {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface TicketNoteListResponse {
  notes: TicketNotePublic[];
}

// --- Error shape (FastAPI's default HTTPException body) ---
export interface ApiErrorBody {
  detail: string | { msg: string; loc: (string | number)[] }[];
}
