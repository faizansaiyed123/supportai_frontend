// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SupportAI recruiter/demo transport.
 * This module mirrors the real API contracts used by src/lib/api/* but keeps all state
 * in this browser. It deliberately contains only synthetic data and never reaches the
 * production backend, database, storage, Ollama, or email services.
 */
import { ApiError } from "@/lib/api/client";

type Row = Record<string, any>;
type Store = Record<string, Row[]>;

export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";
const STORE_KEY = "supportai.demo.store.v1";
const TOKEN_KEY = "supportai.demo.token";

const USERS: (Row & { password: string })[] = [
  { id:"demo-owner", email:"owner@supportai.demo", password:"demo1234", full_name:"Ava Patel", role:"owner", org_id:DEMO_ORG_ID },
  { id:"demo-admin", email:"admin@supportai.demo", password:"demo1234", full_name:"Noah Williams", role:"admin", org_id:DEMO_ORG_ID },
  { id:"demo-agent", email:"agent@supportai.demo", password:"demo1234", full_name:"Mia Chen", role:"agent", org_id:DEMO_ORG_ID },
  { id:"demo-viewer", email:"viewer@supportai.demo", password:"demo1234", full_name:"Ethan Brooks", role:"viewer", org_id:DEMO_ORG_ID },
];

const now = () => new Date().toISOString();
const days = (offset:number) => new Date(Date.now() + offset * 86400000).toISOString();
const clone = <T,>(v:T):T => JSON.parse(JSON.stringify(v));
const makeId = (prefix:string) => `${prefix}-${Math.random().toString(36).slice(2,10)}`;

function seed():Store {
  const customers = [
    { id:"customer-1", external_id:"CUST-1001", email:"jordan@acme.example", name:"Jordan Lee", created_at:days(-18) },
    { id:"customer-2", external_id:"CUST-1002", email:"sam@acme.example", name:"Sam Rivera", created_at:days(-11) },
    { id:"customer-3", external_id:"CUST-1003", email:"taylor@acme.example", name:"Taylor Morgan", created_at:days(-6) },
  ];

  const documents = [
    { id:"doc-1", title:"Refund policy", original_filename:"refund-policy.md", mime_type:"text/markdown", status:"ready", status_error:null, created_at:days(-14), updated_at:days(-14) },
    { id:"doc-2", title:"Shipping and delivery", original_filename:"shipping.md", mime_type:"text/markdown", status:"ready", status_error:null, created_at:days(-10), updated_at:days(-10) },
    { id:"doc-3", title:"Account security guide", original_filename:"account-security.md", mime_type:"text/markdown", status:"ready", status_error:null, created_at:days(-7), updated_at:days(-7) },
    { id:"doc-4", title:"Returns FAQ", original_filename:"returns-faq.md", mime_type:"text/markdown", status:"ready", status_error:null, created_at:days(-3), updated_at:days(-3) },
  ];

  const citations = {
    refunds:{ chunk_id:"chunk-refunds-1", document_id:"doc-1", heading_path:"Refund policy > Eligibility", excerpt:"Customers can request a refund within 30 days of delivery for eligible purchases." },
    shipping:{ chunk_id:"chunk-shipping-1", document_id:"doc-2", heading_path:"Shipping and delivery > Delivery windows", excerpt:"Standard delivery usually arrives within 3–5 business days after dispatch." },
    security:{ chunk_id:"chunk-security-1", document_id:"doc-3", heading_path:"Account security > Password resets", excerpt:"Password reset links are time-limited and never reveal whether an email exists." },
    returns:{ chunk_id:"chunk-returns-1", document_id:"doc-4", heading_path:"Returns FAQ > Starting a return", excerpt:"Open the Returns section from the customer portal and choose the order you want to return." },
  };

  const conversations = [
    { id:"conversation-1", status:"open", assigned_agent_id:"demo-agent", created_at:days(-2), customer_id:"customer-1" },
    { id:"conversation-2", status:"escalated", assigned_agent_id:"demo-agent", created_at:days(-5), customer_id:"customer-2" },
    { id:"conversation-3", status:"closed", assigned_agent_id:null, created_at:days(-9), customer_id:"customer-3" },
  ];

  const messages = [
    { id:"message-1", conversation_id:"conversation-1", role:"customer", content:"How long do I have to request a refund?", created_at:days(-2), citations:[] },
    { id:"message-2", conversation_id:"conversation-1", role:"ai", content:"Eligible purchases can be refunded within 30 days of delivery.", created_at:days(-2), citations:[citations.refunds] },
    { id:"message-3", conversation_id:"conversation-2", role:"customer", content:"My package is late. What is the normal delivery window?", created_at:days(-5), citations:[] },
    { id:"message-4", conversation_id:"conversation-2", role:"ai", content:"Standard delivery usually takes 3–5 business days after dispatch. This conversation has been escalated for human follow-up.", created_at:days(-5), citations:[citations.shipping] },
    { id:"message-5", conversation_id:"conversation-3", role:"customer", content:"How do I reset my password?", created_at:days(-9), citations:[] },
    { id:"message-6", conversation_id:"conversation-3", role:"ai", content:"Use the password reset flow. The reset link is time-limited.", created_at:days(-9), citations:[citations.security] },
  ];

  const tickets = [
    { id:"ticket-1", title:"Refund request for duplicate charge", status:"open", priority:"high", customer_id:"customer-1", assigned_agent_id:"demo-agent", created_at:days(-2) },
    { id:"ticket-2", title:"Shipment delayed beyond expected window", status:"pending", priority:"urgent", customer_id:"customer-2", assigned_agent_id:"demo-agent", created_at:days(-5) },
    { id:"ticket-3", title:"Password reset follow-up", status:"resolved", priority:"normal", customer_id:"customer-3", assigned_agent_id:null, created_at:days(-9) },
  ];

  const ticketNotes = [
    { id:"note-1", ticket_id:"ticket-1", author_id:"demo-agent", content:"Verified the order and routed the refund request for review.", created_at:days(-2) },
    { id:"note-2", ticket_id:"ticket-2", author_id:"demo-agent", content:"Carrier scan shows the parcel moving through the regional hub.", created_at:days(-4) },
  ];

  const memberships = USERS.map((u) => ({
    id:`membership-${u.id}`, user_id:u.id, email:u.email, full_name:u.full_name,
    role:u.role, status:"active", created_at:days(-30),
  }));

  return { customers, documents, conversations, messages, tickets, ticketNotes, memberships };
}

let cached:Store|null = null;

function store():Store {
  if (cached) return cached;
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      try { cached = JSON.parse(raw) as Store; return cached; } catch { window.localStorage.removeItem(STORE_KEY); }
    }
  }
  cached = seed();
  return cached;
}

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store()));
  }
}

export function resetDemoData() {
  cached = seed();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(cached));
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

function currentUser():Row|null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY) ?? "";
  if (!token.startsWith("demo-access:")) return null;
  const id = decodeURIComponent(token.slice("demo-access:".length));
  return USERS.find((u) => u.id === id) ?? null;
}

function requireUser():Row {
  const user = currentUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  return user;
}

function safeUser(user:Row) {
  const safe = clone(user);
  delete safe.password;
  return safe;
}

function authToken(user:Row) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, `demo-access:${encodeURIComponent(user.id)}`);
  }
  // AuthContext only decodes this payload for UI state; the demo transport remains the source of truth.
  const payload = btoa(JSON.stringify({ sub:user.id, org_id:DEMO_ORG_ID, role:user.role, exp:Math.floor(Date.now()/1000)+1800 }));
  return `demo.${payload}.demo`;
}

function find(collection:string,id:string) {
  return store()[collection]?.find((item) => item.id === id) ?? null;
}

function list(items:Row[], query:Record<string,any>) {
  const search = String(query.q ?? query.search ?? "").toLowerCase();
  const filtered = search ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(search)) : items;
  return { data:clone(filtered), meta:{ page:1, size:filtered.length, total:filtered.length, pages:1 } };
}

function answerFor(question:string) {
  const q = question.toLowerCase();
  if (q.includes("refund") || q.includes("return") || q.includes("30 days")) {
    return {
      message:"Eligible purchases can be refunded within 30 days of delivery. Start the request from the customer return flow and include the order you want reviewed.",
      low_confidence:false,
      citations:[{ chunk_id:"chunk-refunds-1", document_id:"doc-1", heading_path:"Refund policy > Eligibility", excerpt:"Customers can request a refund within 30 days of delivery for eligible purchases." }],
    };
  }
  if (q.includes("ship") || q.includes("delivery") || q.includes("late") || q.includes("arrive")) {
    return {
      message:"Standard delivery usually arrives within 3–5 business days after dispatch. If the parcel is already beyond that window, escalating to a human agent is appropriate.",
      low_confidence:false,
      citations:[{ chunk_id:"chunk-shipping-1", document_id:"doc-2", heading_path:"Shipping and delivery > Delivery windows", excerpt:"Standard delivery usually arrives within 3–5 business days after dispatch." }],
    };
  }
  if (q.includes("password") || q.includes("reset")) {
    return {
      message:"Use the password reset flow. Reset links are time-limited and the process does not disclose whether an email address exists.",
      low_confidence:false,
      citations:[{ chunk_id:"chunk-security-1", document_id:"doc-3", heading_path:"Account security > Password resets", excerpt:"Password reset links are time-limited and never reveal whether an email exists." }],
    };
  }
  return {
    message:"I couldn't find enough grounded information in the current demo knowledge base to answer that confidently. Consider escalating this conversation to a human agent.",
    low_confidence:true,
    citations:[],
  };
}

export type DemoRequestOptions = {
  method?:string;
  body?:unknown;
  skipAuthRetry?:boolean;
};

export async function demoRequest<T>(path:string, options:DemoRequestOptions={}):Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const body = (options.body && typeof options.body === "object" && !(options.body instanceof FormData)
    ? clone(options.body)
    : {}) as Row;
  const s = store();

  if (path === "/auth/login" && method === "POST") {
    const user = USERS.find((u) =>
      u.email.toLowerCase() === String(body.email ?? "").toLowerCase() &&
      u.password === body.password &&
      body.organization_slug === "demo"
    );
    if (!user) throw new ApiError(401, "Invalid credentials");
    return { access_token:authToken(user), token_type:"bearer", expires_in_minutes:30 } as T;
  }

  if (path === "/auth/refresh" && method === "POST") {
    const user = currentUser();
    if (!user) throw new ApiError(401, "No demo session");
    return { access_token:authToken(user), token_type:"bearer", expires_in_minutes:30 } as T;
  }

  if (path === "/auth/logout" && method === "POST") {
    if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
    return undefined as T;
  }

  if (path === "/auth/register" && method === "POST") {
    const exists = USERS.some((u) => u.email.toLowerCase() === String(body.email ?? "").toLowerCase());
    if (exists) throw new ApiError(409, "Email already registered in the demo");
    const user = { id:makeId("user"), email:body.email, password:body.password, full_name:body.full_name, role:"owner", org_id:DEMO_ORG_ID };
    USERS.push(user);
    s.memberships.push({ id:makeId("membership"), user_id:user.id, email:user.email, full_name:user.full_name, role:"owner", status:"active", created_at:now() });
    persist();
    return safeUser(user) as T;
  }

  if (path.startsWith("/auth/password-reset/")) {
    return (path.endsWith("/request") ? { detail:"If that email is registered, password reset instructions have been issued." } : undefined) as T;
  }

  if (path === "/auth/invites/accept" && method === "POST") {
    const user = { id:makeId("user"), email:"invitee@supportai.demo", password:body.password, full_name:"Invited Teammate", role:"agent", org_id:DEMO_ORG_ID };
    USERS.push(user);
    s.memberships.push({ id:makeId("membership"), user_id:user.id, email:user.email, full_name:user.full_name, role:"agent", status:"active", created_at:now() });
    persist();
    return { access_token:authToken(user), token_type:"bearer", expires_in_minutes:30 } as T;
  }

  const user = requireUser();

  if (path === "/orgs/"+DEMO_ORG_ID+"/customers" && method === "GET") {
    return { customers:clone(s.customers) } as T;
  }
  if (path === "/orgs/"+DEMO_ORG_ID+"/customers" && method === "POST") {
    const customer = { id:makeId("customer"), external_id:body.external_id ?? null, email:body.email ?? null, name:body.name ?? null, created_at:now() };
    s.customers.unshift(customer); persist(); return clone(customer) as T;
  }

  if (path === "/orgs/"+DEMO_ORG_ID+"/memberships" && method === "GET") {
    return { memberships:clone(s.memberships) } as T;
  }
  if (path === "/orgs/"+DEMO_ORG_ID+"/memberships/invite" && method === "POST") {
    const invite = { user_id:makeId("invitee"), email:body.email, invite_token:"demo-invite-"+Math.random().toString(36).slice(2), expires_in_hours:72 };
    return invite as T;
  }
  const roleMatch = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/memberships/([^/]+)/role$"));
  if (roleMatch && method === "POST") {
    const membership = find("memberships", roleMatch[1]);
    if (!membership) throw new ApiError(404, "Membership not found");
    membership.role = body.role; persist(); return clone(membership) as T;
  }

  if (path === "/orgs/"+DEMO_ORG_ID+"/conversations" && method === "GET") {
    return { conversations:clone(s.conversations) } as T;
  }
  if (path === "/orgs/"+DEMO_ORG_ID+"/conversations" && method === "POST") {
    const conversation = { id:makeId("conversation"), status:"open", assigned_agent_id:"demo-agent", created_at:now(), customer_id:null };
    s.conversations.unshift(conversation); persist(); return clone(conversation) as T;
  }
  const msgMatch = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/conversations/([^/]+)/messages$"));
  if (msgMatch && method === "GET") {
    return { messages:clone(s.messages.filter((m) => m.conversation_id === msgMatch[1])) } as T;
  }
  if (msgMatch && method === "POST") {
    const conversation = find("conversations", msgMatch[1]);
    if (!conversation) throw new ApiError(404, "Conversation not found");
    const response = answerFor(String(body.question ?? ""));
    s.messages.push(
      { id:makeId("message"), conversation_id:conversation.id, role:"customer", content:String(body.question ?? ""), created_at:now(), citations:[] },
      { id:makeId("message"), conversation_id:conversation.id, role:"ai", content:response.message, created_at:now(), citations:response.citations },
    );
    if (response.low_confidence) conversation.status = "escalated";
    persist();
    return response as T;
  }
  const escMatch = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/conversations/([^/]+)/escalate$"));
  if (escMatch && method === "POST") {
    const conversation = find("conversations", escMatch[1]);
    if (!conversation) throw new ApiError(404, "Conversation not found");
    conversation.status = "escalated"; persist(); return clone(conversation) as T;
  }

  if (path === "/orgs/"+DEMO_ORG_ID+"/documents" && method === "GET") return { documents:clone(s.documents) } as T;
  if (path === "/orgs/"+DEMO_ORG_ID+"/documents" && method === "POST") {
    const form = options.body as FormData;
    const file = form?.get("file") as File|null;
    const document = { id:makeId("doc"), title:file?.name ?? "Demo document", original_filename:file?.name ?? null, mime_type:file?.type || "text/plain", status:"ready", status_error:null, created_at:now(), updated_at:now() };
    s.documents.unshift(document); persist(); return clone(document) as T;
  }
  if (path === "/orgs/"+DEMO_ORG_ID+"/documents/from-url" && method === "POST") {
    const document = { id:makeId("doc"), title:body.title || body.url, original_filename:null, mime_type:"text/html", status:"ready", status_error:null, created_at:now(), updated_at:now() };
    s.documents.unshift(document); persist(); return clone(document) as T;
  }
  const docMatch = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/documents/([^/]+)$"));
  if (docMatch && method === "GET") {
    const document = find("documents", docMatch[1]); if (!document) throw new ApiError(404,"Document not found"); return clone(document) as T;
  }
  if (docMatch && method === "DELETE") {
    const index = s.documents.findIndex((d) => d.id === docMatch[1]); if (index >= 0) s.documents.splice(index,1); persist(); return undefined as T;
  }
  const docVersion = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/documents/([^/]+)/versions$"));
  if (docVersion && method === "POST") {
    const document = find("documents", docVersion[1]); if (!document) throw new ApiError(404,"Document not found");
    document.status = "ready"; document.updated_at = now(); persist(); return clone(document) as T;
  }

  if (path.startsWith("/orgs/"+DEMO_ORG_ID+"/tickets") && method === "GET") {
    const status = new URLSearchParams(path.split("?")[1] ?? "").get("status");
    return { tickets:clone(status ? s.tickets.filter((t) => t.status === status) : s.tickets) } as T;
  }
  if (path === "/orgs/"+DEMO_ORG_ID+"/tickets" && method === "POST") {
    const ticket = { id:makeId("ticket"), title:body.title, status:"open", priority:body.priority ?? "normal", customer_id:body.customer_id, assigned_agent_id:null, created_at:now() };
    s.tickets.unshift(ticket); persist(); return clone(ticket) as T;
  }
  const ticketMatch = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/tickets/([^/]+)$"));
  if (ticketMatch && method === "GET") {
    const ticket=find("tickets",ticketMatch[1]); if (!ticket) throw new ApiError(404,"Ticket not found"); return clone(ticket) as T;
  }
  const ticketStatus = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/tickets/([^/]+)/status$"));
  if (ticketStatus && method === "POST") {
    const ticket=find("tickets",ticketStatus[1]); if (!ticket) throw new ApiError(404,"Ticket not found"); ticket.status=body.status; persist(); return clone(ticket) as T;
  }
  const ticketAssign = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/tickets/([^/]+)/assign$"));
  if (ticketAssign && method === "POST") {
    const ticket=find("tickets",ticketAssign[1]); if (!ticket) throw new ApiError(404,"Ticket not found"); ticket.assigned_agent_id=body.agent_id; ticket.status="pending"; persist(); return clone(ticket) as T;
  }
  const notesPath = path.match(new RegExp("^/orgs/"+DEMO_ORG_ID+"/tickets/([^/]+)/notes$"));
  if (notesPath && method === "GET") return { notes:clone(s.ticketNotes.filter((n) => n.ticket_id === notesPath[1])) } as T;
  if (notesPath && method === "POST") {
    const note={id:makeId("note"),ticket_id:notesPath[1],author_id:user.id,content:body.content,created_at:now()};
    s.ticketNotes.push(note); persist(); return clone(note) as T;
  }

  return [] as T;
}

export async function demoDocument(path:string):Promise<string> {
  requireUser();
  const label = path.split("/").pop() ?? "SupportAI demo";
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:720px;margin:48px auto;color:#1f2937"><h1>SupportAI demo document</h1><p>Sample output for <strong>${label}</strong>.</p><p>This is a browser-only demo. No real customer message, email, or external AI provider was used.</p></body></html>`;
}
