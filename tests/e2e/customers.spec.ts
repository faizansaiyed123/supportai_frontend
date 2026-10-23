import { test, expect } from '@playwright/test';
import { registerAndLogin, sidebarLink, uniqueSlug, waitForHydration } from './helpers';

test.describe('Customers', () => {
  test('owner can create a customer and it appears in the list', async ({ page }) => {
    await registerAndLogin(page, {
      email: `cust-owner-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.waitForURL('/customers');

    await expect(page.getByRole('button', { name: /Add customer/i })).toBeVisible();
    await page.getByRole('button', { name: /Add customer/i }).click();

    const customerName = `Customer ${Date.now()}`;
    await page.getByLabel('Name').fill(customerName);
    await page.getByLabel('Email').fill(`${customerName.toLowerCase().replace(/ /g, '.')}@example.com`);
    await page.getByLabel('External ID (optional)').fill('CUST-001');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();

    await expect(page.locator(`text=${customerName}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=CUST-001')).toBeVisible();
  });

  test('customer list is initially empty for new org', async ({ page }) => {
    await registerAndLogin(page, {
      email: `cust-empty-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.waitForURL('/customers');

    await expect(page.locator('text=No customers yet')).toBeVisible({ timeout: 10000 });
  });

  test('customer can be created with only an email', async ({ page }) => {
    await registerAndLogin(page, {
      email: `cust-email-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('Email').fill(`onlyemail-${uniqueSlug('t')}@example.com`);
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();

    await expect(page.locator('text=—').first()).toBeVisible({ timeout: 10000 });
  });

  test('customer can be created with only an external ID', async ({ page }) => {
    await registerAndLogin(page, {
      email: `cust-ext-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('External ID (optional)').fill('EXT-999');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();

    await expect(page.locator('text=EXT-999')).toBeVisible({ timeout: 10000 });
  });

  test('customer table shows all columns: Name, Email, External ID, Added', async ({ page }) => {
    await registerAndLogin(page, {
      email: `cust-cols-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/customers').click();
    await page.getByRole('button', { name: /Add customer/i }).click();
    await page.getByLabel('Name').fill('Column Test');
    await page.getByLabel('Email').fill('coltest@example.com');
    await page.getByLabel('External ID (optional)').fill('COL-001');
    await page.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();

    await expect(page.locator('text=Column Test')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=coltest@example.com')).toBeVisible();
    await expect(page.locator('text=COL-001')).toBeVisible();

    await page.locator('th', { hasText: 'Name' }).waitFor({ timeout: 10000 });
    await page.locator('th', { hasText: 'Email' }).waitFor();
    await page.locator('th', { hasText: 'External ID' }).waitFor();
    await page.locator('th', { hasText: 'Added' }).waitFor();
  });

  test('viewer cannot add customers', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const ownerPage = await ctx.newPage();
    await registerAndLogin(ownerPage, {
      email: `cvo-own-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Customer Viewer');
    await ownerPage.getByLabel('Email').fill(`custviewer-${uniqueSlug('t')}@example.com`);
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

    await sidebarLink(viewerPage, '/customers').click();
    await viewerPage.waitForURL('/customers');
    await expect(viewerPage.getByRole('button', { name: /Add customer/i })).not.toBeVisible();

    await viewerCtx.close();
  });
});
