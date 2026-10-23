import { test, expect } from '@playwright/test';
import { registerAndLogin, logout, sidebarLink, uniqueSlug, waitForHydration } from './helpers';

test.describe('Authentication flows', () => {
  test('registers a new organization and auto-logs in', async ({ page }) => {
    const email = `register-${uniqueSlug('test')}@example.com`;
    const password = 'SecurePass123!';
    const orgSlug = uniqueSlug('testorg');
    const orgName = `TestOrg ${Date.now()}`;

    await page.goto('/register');
    await waitForHydration(page);
    await page.fill('input[autocomplete="name"]', 'Auth Tester');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[placeholder="Acme Inc"]', orgName);
    await page.fill('input[placeholder="acme"]', orgSlug);
    await page.getByRole('button', { name: 'Create organization' }).click();

    await page.waitForURL('/dashboard', { timeout: 30000 });
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('login with valid credentials succeeds', async ({ page }) => {
    const { email, password, orgSlug } = await registerAndLogin(page);

    await logout(page);

    await page.fill('input[placeholder="acme"]', orgSlug);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL('/dashboard', { timeout: 30000 });
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('login with wrong password shows generic error', async ({ page }) => {
    const { email, orgSlug } = await registerAndLogin(page);

    await logout(page);

    await page.fill('input[placeholder="acme"]', orgSlug);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('login with non-existent org shows generic error', async ({ page }) => {
    await page.goto('/login');
    await waitForHydration(page);
    await page.fill('input[placeholder="acme"]', 'nonexistentorg');
    await page.fill('input[type="email"]', 'nobody@example.com');
    await page.fill('input[type="password"]', 'anypassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 10000 });
  });

  test('register page shows validation errors on short password', async ({ page }) => {
    await page.goto('/register');
    await waitForHydration(page);
    await page.fill('input[autocomplete="name"]', 'Validator');
    await page.fill('input[type="email"]', `val-${uniqueSlug('t')}@example.com`);
    await page.fill('input[type="password"]', 'short');
    await page.fill('input[placeholder="Acme Inc"]', 'Test Org');
    await page.fill('input[placeholder="acme"]', uniqueSlug('testorg'));
    await page.getByRole('button', { name: 'Create organization' }).click();

    await expect(page.locator('text=Password must be at least 10 characters')).toBeVisible();
  });

  test('password reset request always shows success message (enumeration safety)', async ({ page }) => {
    await page.goto('/login');
    await waitForHydration(page);
    // This link lives on the login form, not the dashboard sidebar, so it isn't sidebarLink().
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await page.waitForURL(/\/password-reset/, { timeout: 10000 });

    await page.fill('input[type="email"]', 'definitely-not-registered@example.com');
    await page.getByRole('button', { name: 'Send reset instructions' }).click();

    await expect(page.locator('text=If that email is registered')).toBeVisible({ timeout: 10000 });
  });

  test('accepting an invite logs the user in and redirects to dashboard', async ({ page, browser }) => {
    await registerAndLogin(page, {
      email: `owner-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/team').click();
    await page.waitForURL('/team');
    await page.getByRole('button', { name: /Invite teammate/i }).click();

    await page.getByLabel('Full name').fill('Invitee User');
    await page.getByLabel('Email').fill(`invitee-${uniqueSlug('t')}@example.com`);
    await page.locator('select').selectOption('Agent');
    await page.getByRole('button', { name: 'Send invite' }).click();

    const inviteLinkElement = page.locator('code');
    await expect(inviteLinkElement).toBeVisible({ timeout: 10000 });
    const inviteLink = await inviteLinkElement.textContent();

    const url = new URL(inviteLink!);
    const inviteToken = url.searchParams.get('token');
    expect(inviteToken).toBeTruthy();

    await page.getByRole('button', { name: 'Done' }).click();

    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();

    await newPage.goto(`/accept-invite?token=${inviteToken}`);
    await waitForHydration(newPage);
    await newPage.waitForSelector('h1:text("Set your password")', { timeout: 10000 });

    await newPage.fill('input[type="password"]', 'Invitepass123!');
    await newPage.getByRole('button', { name: 'Join organization' }).click();

    await newPage.waitForURL('/dashboard', { timeout: 30000 });
    await expect(newPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    const roleText = await newPage.locator('text=Signed in as agent').textContent();
    expect(roleText).toContain('agent');

    await newContext.close();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await registerAndLogin(page);

    await logout(page);

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Sign in to SupportAI/i })).toBeVisible();

    await page.goto('/dashboard', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForURL(/\/login/, { timeout: 30000 });
  });

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForURL(/\/login/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
