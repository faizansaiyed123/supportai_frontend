import { describe, expect, it } from "vitest";
import { roleCan } from "./permissions";

describe("roleCan (UI hints only - the backend enforces every action)", () => {
  it("grants owner and admin everything", () => {
    for (const role of ["owner", "admin"]) {
      expect(roleCan(role, "knowledge:manage")).toBe(true);
      expect(roleCan(role, "members:manage")).toBe(true);
    }
  });
  it("lets agents work tickets/customers/conversations but not knowledge or members", () => {
    expect(roleCan("agent", "tickets:manage")).toBe(true);
    expect(roleCan("agent", "conversations:respond")).toBe(true);
    expect(roleCan("agent", "knowledge:manage")).toBe(false);
    expect(roleCan("agent", "members:manage")).toBe(false);
  });
  it("makes viewers read-only", () => {
    expect(roleCan("viewer", "tickets:manage")).toBe(false);
    expect(roleCan("viewer", "conversations:respond")).toBe(false);
  });
  it("denies null and unknown roles", () => {
    expect(roleCan(null, "tickets:manage")).toBe(false);
    expect(roleCan("superuser", "tickets:manage")).toBe(false);
  });
});
