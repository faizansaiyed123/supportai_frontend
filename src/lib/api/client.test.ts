import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, getAccessToken, setAccessToken, setOnAuthExpired } from "./client";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const FRESH = { access_token: "fresh", token_type: "bearer", expires_in_minutes: 15 };
const path = (input: unknown) => String(input).replace("http://api.test/api", "");
const authHeader = (init?: RequestInit) => new Headers(init?.headers).get("authorization");

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  setAccessToken(null);
  setOnAuthExpired(() => {});
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

describe("apiFetch", () => {
  it("attaches the bearer token and parses JSON", async () => {
    setAccessToken("tok1");
    fetchMock.mockResolvedValue(json(200, { ok: 1 }));
    expect(await apiFetch("/thing")).toEqual({ ok: 1 });
    expect(authHeader(fetchMock.mock.calls[0]![1])).toBe("Bearer tok1");
  });

  it("on 401 silently refreshes once, retries with the new token, and stores it", async () => {
    setAccessToken("expired");
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (path(url) === "/auth/refresh") return json(200, FRESH);
      return authHeader(init) === "Bearer fresh" ? json(200, { data: "secret" }) : json(401, { detail: "expired" });
    });
    expect(await apiFetch("/protected")).toEqual({ data: "secret" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBe("fresh");
  });

  it("gives up after a failed refresh: ApiError 401, onAuthExpired once, no loop", async () => {
    setAccessToken("expired");
    const onExpired = vi.fn();
    setOnAuthExpired(onExpired);
    fetchMock.mockImplementation(async () => json(401, { detail: "nope" }));
    await expect(apiFetch("/protected")).rejects.toMatchObject({ status: 401 });
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent 401s into a single refresh (backend refresh tokens are single-use)", async () => {
    setAccessToken("expired");
    let refreshes = 0;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (path(url) === "/auth/refresh") {
        refreshes++;
        await new Promise((r) => setTimeout(r, 20));
        return json(200, FRESH);
      }
      return authHeader(init) === "Bearer fresh" ? json(200, {}) : json(401, { detail: "expired" });
    });
    await Promise.all([apiFetch("/a"), apiFetch("/b"), apiFetch("/c")]);
    expect(refreshes).toBe(1);
  });

  it("does not refresh when skipAuthRetry is set (bad login credentials != expired session)", async () => {
    fetchMock.mockResolvedValue(json(401, { detail: "Invalid credentials" }));
    await expect(apiFetch("/auth/login", { method: "POST", body: {}, skipAuthRetry: true })).rejects.toMatchObject({
      detail: "Invalid credentials",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not refresh on 403 (permission problem, not an expired session)", async () => {
    setAccessToken("t");
    fetchMock.mockResolvedValue(json(403, { detail: "Insufficient permissions" }));
    await expect(apiFetch("/x", { method: "POST" })).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves 204 to undefined", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await apiFetch("/x", { method: "DELETE" })).toBeUndefined();
  });

  it("joins FastAPI 422 validation arrays into one readable message", async () => {
    fetchMock.mockResolvedValue(json(422, { detail: [{ msg: "bad email", loc: [] }, { msg: "field required", loc: [] }] }));
    await expect(apiFetch("/x", { method: "POST", body: {} })).rejects.toMatchObject({ detail: "bad email; field required", status: 422 });
  });

  it("sends FormData untouched without forcing a JSON content-type", async () => {
    setAccessToken("t");
    fetchMock.mockResolvedValue(json(201, { id: "d1" }));
    const form = new FormData();
    form.append("file", new Blob(["hi"]), "a.md");
    await apiFetch("/orgs/o/documents", { method: "POST", body: form });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.body).toBeInstanceOf(FormData);
    expect(new Headers(init.headers).get("content-type")).toBeNull();
  });

  it("survives a non-JSON error body", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502</html>", { status: 502, headers: { "content-type": "text/html" } }));
    const call = apiFetch("/x");
    await expect(call).rejects.toBeInstanceOf(ApiError);
    await expect(call).rejects.toMatchObject({ status: 502 });
  });
});
