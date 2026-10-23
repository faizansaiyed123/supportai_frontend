import { test, expect } from '@playwright/test';
import { registerAndLogin, sidebarLink, uniqueSlug, waitForHydration } from './helpers';

test.describe('Tickets', () => {
  test('owner can create a ticket after adding a customer', async ({ page }) => {
    await registerAndLogin(page, {
      email: `ticket-owner-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.waitForURL('/customers');
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('Name').fill('Acme Corp');
    await page.getByLabel('Email').fill('contact@acme.example.com');
    await page.getByLabel('External ID (optional)').fill('ACME-001');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();

    await expect(page.locator('text=Customer added')).toBeVisible({ timeout: 10000 });

    await sidebarLink(page, '/tickets').click();
    await page.waitForURL('/tickets');
    await expect(page.getByRole('button', { name: /New ticket/i })).toBeVisible();
    await page.getByRole('button', { name: /New ticket/i }).click();

    await page.locator('select').first().selectOption({ label: 'Acme Corp' });
    await page.getByLabel('Title').fill('Login page returns 500 error');
    await page.locator('select').nth(1).selectOption({ label: 'High' });
    await page.getByRole('button', { name: 'Create ticket' }).click();

    await page.waitForURL(/\/tickets\/[a-f0-9-]+/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Login page returns 500 error' })).toBeVisible();
  });

  test('ticket appears in the tickets list with correct status', async ({ page }) => {
    await registerAndLogin(page, {
      email: `ticket-list-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('Name').fill('List Customer');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();
    await page.locator('text=Customer added').waitFor({ timeout: 10000 });

    await sidebarLink(page, '/tickets').click();
    await page.getByRole('button', { name: /New ticket/i }).click();
    await page.locator('select').first().selectOption({ label: 'List Customer' });
    await page.getByLabel('Title').fill('Bug in checkout flow');
    await page.getByRole('button', { name: 'Create ticket' }).click();

    await page.waitForURL(/\/tickets\/[a-f0-9-]+/, { timeout: 15000 });
    await sidebarLink(page, '/tickets').click();
    await page.waitForURL('/tickets');

    await expect(page.locator('tr', { hasText: 'Bug in checkout flow' })).toBeVisible({ timeout: 10000 });
  });

  test('owner can add an internal note to a ticket', async ({ page }) => {
    await registerAndLogin(page, {
      email: `note-user-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('Name').fill('Note Customer');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();
    await page.locator('text=Customer added').waitFor({ timeout: 10000 });

    await sidebarLink(page, '/tickets').click();
    await page.getByRole('button', { name: /New ticket/i }).click();
    await page.locator('select').first().selectOption({ label: 'Note Customer' });
    await page.getByLabel('Title').fill('Need clarification on this');
    await page.getByRole('button', { name: 'Create ticket' }).click();

    await page.waitForURL(/\/tickets\/[a-f0-9-]+/, { timeout: 15000 });

    await page.fill('textarea[aria-label="Internal note"]', 'This is an internal note about the ticket.');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=This is an internal note about the ticket.')).toBeVisible({ timeout: 10000 });
  });

  test('owner can change ticket status through workflow', async ({ page }) => {
    await registerAndLogin(page, {
      email: `status-owner-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    const ticketTitle = `Status flow test ${Date.now()}`;

    await sidebarLink(page, '/customers').click();
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('Name').fill('Status Customer');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();
    await page.locator('text=Customer added').waitFor({ timeout: 10000 });

    await sidebarLink(page, '/tickets').click();
    await page.getByRole('button', { name: /New ticket/i }).click();
    await page.locator('select').first().selectOption({ label: 'Status Customer' });
    await page.getByLabel('Title').fill(ticketTitle);
    await page.getByRole('button', { name: 'Create ticket' }).click();

    await page.waitForURL(/\/tickets\/[a-f0-9-]+/, { timeout: 15000 });

    await expect(page.locator('text=open').first()).toBeVisible();

    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('Pending');
    await expect(page.locator('text=pending').first()).toBeVisible({ timeout: 10000 });

    await statusSelect.selectOption('Resolved');
    await expect(page.locator('text=Resolved').first()).toBeVisible({ timeout: 10000 });

    await statusSelect.selectOption('Closed');
    await expect(page.locator('text=Closed').first()).toBeVisible({ timeout: 10000 });
  });

  test('ticket detail shows customer info', async ({ page }) => {
    await registerAndLogin(page, {
      email: `detail-ticket-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('Name').fill('Detail Customer');
    await page.getByLabel('External ID (optional)').fill('DC-001');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();
    await page.locator('text=Customer added').waitFor({ timeout: 10000 });

    await sidebarLink(page, '/tickets').click();
    await page.getByRole('button', { name: /New ticket/i }).click();
    await page.locator('select').first().selectOption({ label: 'Detail Customer' });
    await page.getByLabel('Title').fill('Detail inspection ticket');
    await page.getByRole('button', { name: 'Create ticket' }).click();

    await page.waitForURL(/\/tickets\/[a-f0-9-]+/, { timeout: 15000 });

    await expect(page.locator('text=Details')).toBeVisible();
  });

  test('viewer cannot create tickets', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const ownerPage = await ctx.newPage();
    await registerAndLogin(ownerPage, {
      email: `vt-own-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(ownerPage, '/customers').click();
    await ownerPage.getByRole('button', { name: /Add customer/i }).click();
    await ownerPage.getByLabel('Name').fill('Viewer Ticket Customer');
    await ownerPage.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Ticket Viewer');
    await ownerPage.getByLabel('Email').fill(`ticketviewer-${uniqueSlug('t')}@example.com`);
    await ownerPage.locator('select').selectOption('Viewer');
    await ownerPage.getByRole('button', { name: 'Send invite' }).click();

    const inviteLink = await ownerPage.locator('code').textContent();
    const url = new URL(inviteLink!);
    const token = url.searchParams.get('token');
    await ownerPage.getByRole('button', { name: 'Done' }).click();
    await ctx.close();

    const viewerCtx = await browser.newContext();
    const viewerPage = await viewerCtx.newPage();
    await viewerPage.goto(`/accept-invite?token=${token}`);
    await waitForHydration(viewerPage);
    await viewerPage.fill('input[type="password"]', 'ViewerPass123!');
    await viewerPage.getByRole('button', { name: 'Join organization' }).click();
    await viewerPage.waitForURL('/dashboard', { timeout: 15000 });

    await sidebarLink(viewerPage, '/tickets').click();
    await viewerPage.waitForURL('/tickets');
    await expect(viewerPage.getByRole('button', { name: /New ticket/i })).not.toBeVisible();

    await viewerCtx.close();
  });
});
