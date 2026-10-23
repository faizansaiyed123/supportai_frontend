import { test, expect } from '@playwright/test';
import { registerAndLogin, sidebarLink, uniqueSlug, waitForHydration } from './helpers';

const NAV_HREFS = ['/dashboard', '/conversations', '/tickets', '/documents', '/customers', '/team'];

test.describe('Role-based UI gating', () => {
  test('owner sees all sidebar nav links and management controls', async ({ page }) => {
    await registerAndLogin(page, {
      email: `rb-owner-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/dashboard').click();
    await page.waitForURL('/dashboard');

    for (const href of NAV_HREFS) {
      await expect(sidebarLink(page, href)).toBeVisible();
    }

    await sidebarLink(page, '/documents').click();
    await expect(page.getByRole('button', { name: /Add document/i })).toBeVisible();

    await sidebarLink(page, '/customers').click();
    await expect(page.getByRole('button', { name: /Add customer/i })).toBeVisible();

    await sidebarLink(page, '/team').click();
    await expect(page.getByRole('button', { name: /Invite teammate/i })).toBeVisible();
  });

  test('viewer sidebar shows all nav links but no management controls', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const ownerPage = await ctx.newPage();
    await registerAndLogin(ownerPage, {
      email: `rb-own-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Role Tester');
    await ownerPage.getByLabel('Email').fill(`rbviewer-${uniqueSlug('t')}@example.com`);
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

    for (const href of NAV_HREFS) {
      await expect(sidebarLink(viewerPage, href)).toBeVisible();
    }

    await sidebarLink(viewerPage, '/documents').click();
    await viewerPage.waitForURL('/documents');
    await expect(viewerPage.getByRole('button', { name: /Add document/i })).not.toBeVisible();

    await sidebarLink(viewerPage, '/customers').click();
    await viewerPage.waitForURL('/customers');
    await expect(viewerPage.getByRole('button', { name: /Add customer/i })).not.toBeVisible();

    await sidebarLink(viewerPage, '/tickets').click();
    await viewerPage.waitForURL('/tickets');
    await expect(viewerPage.getByRole('button', { name: /New ticket/i })).not.toBeVisible();

    // Read-only role: a viewer must not be able to start a conversation or answer one.
    await sidebarLink(viewerPage, '/conversations').click();
    await viewerPage.waitForURL('/conversations');
    await expect(viewerPage.getByRole('button', { name: /New conversation/i })).not.toBeVisible();

    await sidebarLink(viewerPage, '/team').click();
    await viewerPage.waitForURL('/team');
    await expect(viewerPage.getByRole('button', { name: /Invite teammate/i })).not.toBeVisible();

    const roleSelects = viewerPage.locator('select');
    await expect(roleSelects).not.toBeVisible();

    await viewerCtx.close();
  });

  test('agent sees management controls for tickets and customers but not knowledge', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const ownerPage = await ctx.newPage();
    await registerAndLogin(ownerPage, {
      email: `agent-own-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Agent Tester');
    await ownerPage.getByLabel('Email').fill(`agent-${uniqueSlug('t')}@example.com`);
    await ownerPage.locator('select').selectOption('Agent');
    await ownerPage.getByRole('button', { name: 'Send invite' }).click();

    const inviteLink = await ownerPage.locator('code').textContent();
    const url = new URL(inviteLink!);
    const token = url.searchParams.get('token');
    await ownerPage.getByRole('button', { name: 'Done' }).click();
    await ctx.close();

    const agentCtx = await browser.newContext();
    const agentPage = await agentCtx.newPage();
    await agentPage.goto(`/accept-invite?token=${token}`);
    await waitForHydration(agentPage);
    await agentPage.fill('input[type="password"]', 'AgentPass123!');
    await agentPage.getByRole('button', { name: 'Join organization' }).click();
    await agentPage.waitForURL('/dashboard', { timeout: 15000 });

    await sidebarLink(agentPage, '/documents').click();
    await agentPage.waitForURL('/documents');
    await expect(agentPage.getByRole('button', { name: /Add document/i })).not.toBeVisible();

    await sidebarLink(agentPage, '/customers').click();
    await agentPage.waitForURL('/customers');
    await expect(agentPage.getByRole('button', { name: /Add customer/i })).toBeVisible();

    await sidebarLink(agentPage, '/tickets').click();
    await agentPage.waitForURL('/tickets');
    await expect(agentPage.getByRole('button', { name: /New ticket/i })).toBeVisible();

    // Agents respond to conversations, so the conversation controls are available to them
    // even though knowledge management is not.
    await sidebarLink(agentPage, '/conversations').click();
    await agentPage.waitForURL('/conversations');
    await expect(agentPage.getByRole('button', { name: /New conversation/i })).toBeVisible();

    await sidebarLink(agentPage, '/team').click();
    await agentPage.waitForURL('/team');
    await expect(agentPage.getByRole('button', { name: /Invite teammate/i })).not.toBeVisible();

    await agentCtx.close();
  });

  test('admin sees the same management controls as owner', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const ownerPage = await ctx.newPage();
    await registerAndLogin(ownerPage, {
      email: `admin-own-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Admin Tester');
    await ownerPage.getByLabel('Email').fill(`admin-${uniqueSlug('t')}@example.com`);
    await ownerPage.locator('select').selectOption('Admin');
    await ownerPage.getByRole('button', { name: 'Send invite' }).click();

    const inviteLink = await ownerPage.locator('code').textContent();
    const url = new URL(inviteLink!);
    const token = url.searchParams.get('token');
    await ownerPage.getByRole('button', { name: 'Done' }).click();
    await ctx.close();

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await adminPage.goto(`/accept-invite?token=${token}`);
    await waitForHydration(adminPage);
    await adminPage.fill('input[type="password"]', 'AdminPass123!');
    await adminPage.getByRole('button', { name: 'Join organization' }).click();
    await adminPage.waitForURL('/dashboard', { timeout: 15000 });

    await sidebarLink(adminPage, '/documents').click();
    await expect(adminPage.getByRole('button', { name: /Add document/i })).toBeVisible();

    await sidebarLink(adminPage, '/customers').click();
    await expect(adminPage.getByRole('button', { name: /Add customer/i })).toBeVisible();

    await sidebarLink(adminPage, '/team').click();
    await expect(adminPage.getByRole('button', { name: /Invite teammate/i })).toBeVisible();

    await adminCtx.close();
  });

  test('sidebar shows current role in the footer', async ({ page }) => {
    await registerAndLogin(page, {
      email: `role-footer-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/documents').click();
    await page.waitForURL('/documents');

    const roleText = await page.locator('text=Signed in as').textContent();
    expect(roleText).toContain('owner');
  });
});
