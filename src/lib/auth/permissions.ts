/**
 * UI-hint mirror of backend/scripts/seed_roles.py's SYSTEM_ROLES. Used ONLY to hide/disable
 * controls a role can't use anyway, so a viewer isn't shown an "Add document" button that can
 * only ever return 403. It is NOT a security boundary - every action is enforced server-side
 * (D005) whatever this says. Hand-synced with seed_roles.py (same discipline as D033); if
 * system role permissions change there, update here.
 */
export type Role = "owner" | "admin" | "agent" | "viewer";

export type Capability =
  | "knowledge:manage"
  | "tickets:manage"
  | "customers:manage"
  | "conversations:respond"
  | "members:manage";

const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  owner: new Set<Capability>([
    "knowledge:manage",
    "tickets:manage",
    "customers:manage",
    "conversations:respond",
    "members:manage",
  ]),
  admin: new Set<Capability>([
    "knowledge:manage",
    "tickets:manage",
    "customers:manage",
    "conversations:respond",
    "members:manage",
  ]),
  agent: new Set<Capability>(["tickets:manage", "customers:manage", "conversations:respond"]),
  viewer: new Set<Capability>([]),
};

export function roleCan(role: string | null, capability: Capability): boolean {
  if (!role || !(role in ROLE_CAPABILITIES)) return false;
  return ROLE_CAPABILITIES[role as Role].has(capability);
}
