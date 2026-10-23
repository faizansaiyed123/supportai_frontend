import { expect, Locator, Page } from '@playwright/test';

export function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface RegisterOptions {
  fullName?: string;
  email?: string;
  password?: string;
  orgName?: string;
  orgSlug?: string;
}

interface RegisterResult {
  email: string;
  password: string;
  orgSlug: string;
  fullName: string;
}

/**
 * Waits until React has hydrated the current page.
 *
 * The register/login pages are client components whose <form> carries an onSubmit handler. Until
 * hydration attaches that handler, the browser falls back to a *native* form submission - which
 * GETs the same route with every field appended as a query string, silently destroying what the
 * test typed. `waitForLoadState('networkidle')` does not protect against this: against the dev
 * server the client chunks can still be compiling after the HTML response, so the page looks
 * quiet while still being non-interactive.
 *
 * React tags each host element it owns with a `__reactProps$*` key, so the presence of that key on
 * a real element is a direct, deterministic signal that hydration finished and submit handlers are
 * live. Polling for it removes the race instead of retrying the click after the fact.
 */
export async function waitForHydration(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('form, input, button, a')).some((el) =>
        Object.keys(el).some((key) => key.startsWith('__reactProps$'))
      ),
    undefined,
    { timeout }
  );
}

export async function registerAndLogin(
  page: Page,
  opts: RegisterOptions = {}
): Promise<RegisterResult> {
  const fullName = opts.fullName ?? 'Test User';
  const email = opts.email ?? `test-${uniqueSlug('user')}@example.com`;
  const password = opts.password ?? 'SecurePass123!';
  const orgName = opts.orgName ?? `TestOrg ${Date.now()}`;
  const orgSlug = opts.orgSlug ?? uniqueSlug('testorg');

  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await waitForHydration(page);
  await page.fill('input[autocomplete="name"]', fullName);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.fill('input[placeholder="Acme Inc"]', orgName);
  await page.fill('input[placeholder="acme"]', orgSlug);
  await page.getByRole('button', { name: 'Create organization' }).click();

  await page.waitForURL('/dashboard', { timeout: 60000 });

  return { email, password, orgSlug, fullName };
}

export async function login(page: Page, email: string, password: string, orgSlug: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await waitForHydration(page);
  await page.fill('input[placeholder="acme"]', orgSlug);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard', { timeout: 60000 });
}

export async function expectToBeOnLogin(page: Page): Promise<void> {
  await page.waitForURL(/\/login/, { timeout: 30000 });
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL(/\/login/, { timeout: 30000 });
}

/**
 * Waits for an uploaded document to finish ingestion.
 *
 * Ingestion is asynchronous (backend/app/workers/ingestion.py runs it in a background worker),
 * and the first document after a cold worker pays a one-off embedding-model load that can take
 * minutes. The documents list polls every 3s while a document is in flight
 * (frontend/src/lib/hooks/useDocuments.ts), so the status badge flips to "ready" on its own -
 * but any test that waits for it needs a timeout well above Playwright's 30s default, or it
 * fails against a healthy backend purely on cold-start latency.
 */
export async function waitForDocumentReady(
  page: Page,
  filename: string,
  timeout = 90_000
): Promise<void> {
  const row = documentRow(page, filename);
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.locator('text=ready')).toBeVisible({ timeout });
}

/** The documents table row for a given uploaded filename. */
export function documentRow(page: Page, filename: string): Locator {
  return page.locator('tr', { hasText: filename });
}

/** Assistant message bubbles on the conversation detail page (customer messages are brand-blue). */
export function assistantMessages(page: Page): Locator {
  return page.locator('.bg-neutral-100.text-neutral-900');
}

/** Citation chips rendered under an assistant message. */
export function citations(page: Page): Locator {
  return page.locator('div.rounded-full[title]');
}

/**
 * A sidebar nav link, scoped to the main navigation landmark.
 *
 * Several routes are linked from more than one place (e.g. the dashboard's stat cards link to
 * /conversations too), so an unscoped `a[href="/conversations"]` matches twice and trips
 * Playwright's strict mode. Scoping to the nav is what these tests actually mean to assert.
 */
export function sidebarLink(page: Page, href: string): Locator {
  return page.getByRole('navigation', { name: 'Main navigation' }).locator(`a[href="${href}"]`);
}
