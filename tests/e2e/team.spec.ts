import { test, expect, Page, BrowserContext } from '@playwright/test';
import { registerAndLogin, uniqueSlug, sidebarLink, waitForHydration } from './helpers';

let ownerPage: Page;
let ownerContext: BrowserContext;
let viewerPage: Page;
let viewerContext: BrowserContext;
let ownerEmail: string;
let ownerPassword: string;
let orgSlug: string;
let inviteToken: string | null = null;
const ownerFullName = 'Test User';

test.describe('Team management', () => {
  test.beforeAll(async ({ browser }) => {
    ownerEmail = `owner-${uniqueSlug('t')}@example.com`;
    ownerPassword = 'SecurePass123!';
    orgSlug = uniqueSlug('testorg');

    ownerContext = await browser.newContext();
    ownerPage = await ownerContext.newPage();
    await registerAndLogin(ownerPage, {
      email: ownerEmail,
      password: ownerPassword,
      orgSlug,
      fullName: ownerFullName,
    });

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.waitForURL('/team');

    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Viewer User');
    await ownerPage.getByLabel('Email').fill(`viewer-${uniqueSlug('t')}@example.com`);
    await ownerPage.locator('select').selectOption('Viewer');
    await ownerPage.getByRole('button', { name: 'Send invite' }).click();

    const inviteLinkEl = ownerPage.locator('code');
    await expect(inviteLinkEl).toBeVisible({ timeout: 10000 });
    const inviteLink = await inviteLinkEl.textContent();
    const url = new URL(inviteLink!);
    inviteToken = url.searchParams.get('token');
    expect(inviteToken).toBeTruthy();

    await ownerPage.getByRole('button', { name: 'Done' }).click();

    viewerContext = await browser.newContext();
    viewerPage = await viewerContext.newPage();
    await viewerPage.goto(`/accept-invite?token=${inviteToken}`);
    await waitForHydration(viewerPage);
    await viewerPage.waitForSelector('h1:text("Set your password")', { timeout: 10000 });
    await viewerPage.fill('input[type="password"]', 'ViewerPass123!');
    await viewerPage.getByRole('button', { name: 'Join organization' }).click();
    await viewerPage.waitForURL('/dashboard', { timeout: 15000 });
  });

  test.afterAll(async () => {
    await ownerContext.close();
    await viewerContext.close();
  });

  test('viewer can see the team page', async () => {
    await sidebarLink(viewerPage, '/team').click();
    await viewerPage.waitForURL('/team');
    await expect(viewerPage.getByRole('heading', { name: 'Team' })).toBeVisible();
    await expect(viewerPage.locator('text=Viewer User')).toBeVisible();
    // The owner email starts with "owner-", so match the role cell exactly rather than
    // substring-matching "owner" and hitting the email too.
    await expect(
      viewerPage.locator('tr', { hasText: ownerFullName }).getByText('owner', { exact: true })
    ).toBeVisible();
  });

  test('viewer cannot invite new members (no "Invite teammate" button visible)', async () => {
    await sidebarLink(viewerPage, '/team').click();
    await viewerPage.waitForURL('/team');
    const inviteButton = viewerPage.getByRole('button', { name: /Invite teammate/i });
    await expect(inviteButton).not.toBeVisible();
  });

  test('viewer cannot access file upload in knowledge base', async () => {
    await sidebarLink(viewerPage, '/documents').click();
    await viewerPage.waitForURL('/documents');
    const addDocButton = viewerPage.getByRole('button', { name: /Add document/i });
    await expect(addDocButton).not.toBeVisible();
  });

  test('owner can change a member role from viewer to agent', async () => {
    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.waitForURL('/team');

    const viewerRow = ownerPage.locator('tr', { hasText: 'Viewer User' });
    const roleSelect = viewerRow.locator('select');
    await expect(roleSelect).toBeVisible();

    await roleSelect.selectOption('Agent');
    await expect(roleSelect).toHaveValue('agent');
  });

  test('owner can change a member role from viewer to admin', async () => {
    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.waitForURL('/team');

    const viewerRow = ownerPage.locator('tr', { hasText: 'Viewer User' });
    const roleSelect = viewerRow.locator('select');
    await roleSelect.selectOption('Admin');
    await expect(roleSelect).toHaveValue('admin');
  });

  test('owner role column in team table shows role text for owner row (not a select)', async () => {
    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.waitForURL('/team');

    const ownerRow = ownerPage.locator('tr', { hasText: ownerFullName });
    await expect(ownerRow.locator('select')).not.toBeVisible();
    // exact: true so the owner's "owner-…@example.com" email doesn't match this locator.
    await expect(ownerRow.getByText('owner', { exact: true })).toBeVisible();
  });

  test('non-existent invite token is rejected', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/accept-invite?token=nonexistent-token-value');
    await waitForHydration(p);
    await p.fill('input[type="password"]', 'SomePassword123!');
    await p.getByRole('button', { name: 'Join organization' }).click();
    // The page renders a "missing token" alert above the form and a second, submitted-error
    // alert below it; scope to the one that carries the server's message.
    await expect(p.getByText(/invalid or has expired/i)).toBeVisible();
    await ctx.close();
  });

  test('accepting invite with short password shows validation error', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(`/accept-invite?token=${inviteToken}`);
    await waitForHydration(p);
    await p.fill('input[type="password"]', 'short');
    await p.getByRole('button', { name: 'Join organization' }).click();
    await expect(p.locator('text=Password must be at least 10 characters')).toBeVisible();
    await ctx.close();
  });
});
