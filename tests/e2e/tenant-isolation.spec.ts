import { test, expect, Page } from '@playwright/test';
import { documentRow, registerAndLogin, sidebarLink, uniqueSlug, waitForDocumentReady } from './helpers';

test.describe('Tenant isolation', () => {
  test('Org A cannot access Org B documents, conversations, tickets, or customers', async ({ page, browser }) => {
    test.setTimeout(180000);

    const orgASlug = uniqueSlug('org-a');
    const orgBSlug = uniqueSlug('org-b');

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await registerAndLogin(pageA, {
      email: `orga-${uniqueSlug('t')}@example.com`,
      orgSlug: orgASlug,
    });

    await sidebarLink(pageA, '/customers').click();
    await pageA.getByRole('button', { name: /Add customer/i }).click();
    await pageA.getByLabel('Name').fill('Org A Customer');
    await pageA.locator('role=dialog').getByRole('button', { name: 'Add customer' }).click();
    await pageA.locator('text=Customer added').waitFor({ timeout: 10000 });

    await sidebarLink(pageA, '/documents').click();
    await pageA.getByRole('button', { name: /Add document/i }).click();
    await pageA.getByRole('button', { name: /Upload file/i }).click();
    await pageA.locator('input[type="file"]').setInputFiles({
      name: 'org-a-doc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This belongs to Org A only.'),
    });
    await waitForDocumentReady(pageA, 'org-a-doc');

    // Rows navigate on click (no anchor href), so get the id by opening the detail page
    // rather than scraping a link attribute.
    await documentRow(pageA, 'org-a-doc').click();
    await pageA.waitForURL(/\/documents\/[a-f0-9-]+/);
    const docId = pageA.url().split('/').pop();
    await sidebarLink(pageA, '/documents').click();
    await pageA.waitForURL('/documents');

    await sidebarLink(pageA, '/conversations').click();
    await pageA.waitForURL('/conversations');
    await pageA.getByRole('button', { name: /New conversation/i }).click();
    await pageA.waitForURL(/\/conversations\/[a-f0-9-]+/);
    const orgAConversationUrl = pageA.url();
    const orgAConversationId = orgAConversationUrl.split('/').pop();
    await sidebarLink(pageA, '/conversations').click();
    await pageA.locator('li').first().waitFor({ timeout: 10000 });

    await sidebarLink(pageA, '/tickets').click();
    await pageA.getByRole('button', { name: /New ticket/i }).click();
    await pageA.locator('select').first().selectOption({ label: 'Org A Customer' });
    await pageA.getByLabel('Title').fill('Org A Ticket');
    await pageA.getByRole('button', { name: 'Create ticket' }).click();
    await pageA.waitForURL(/\/tickets\/[a-f0-9-]+/);
    const orgATicketUrl = pageA.url();
    const orgATicketId = orgATicketUrl.split('/').pop();
    await sidebarLink(pageA, '/tickets').click();
    await pageA.locator('text=Org A Ticket').waitFor({ timeout: 10000 });

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await registerAndLogin(pageB, {
      email: `orgb-${uniqueSlug('t')}@example.com`,
      orgSlug: orgBSlug,
    });

    await sidebarLink(pageB, '/customers').click();
    await pageB.waitForURL('/customers');
    await expect(pageB.locator('text=No customers yet')).toBeVisible();

    await sidebarLink(pageB, '/documents').click();
    await pageB.waitForURL('/documents');
    await expect(pageB.locator('text=org-a-doc')).not.toBeVisible();

    // Direct navigation to another tenant's document id must 404, not render.
    expect(docId).toBeTruthy();
    await pageB.goto(`/documents/${docId}`);
    await expect(pageB.locator("text=Couldn't load this document")).toBeVisible({ timeout: 10000 });

    await sidebarLink(pageB, '/conversations').click();
    await pageB.waitForURL('/conversations');
    await expect(pageB.locator('li')).toHaveCount(0);

    if (orgAConversationId) {
      await pageB.goto(`/conversations/${orgAConversationId}`);
      await pageB.locator('body').waitFor({ timeout: 10000 });
      const bodyText = await pageB.locator('body').textContent();
      expect(bodyText).not.toContain('Org A');
    }

    await sidebarLink(pageB, '/tickets').click();
    await pageB.waitForURL('/tickets');
    await expect(pageB.locator('text=No tickets here')).toBeVisible();

    if (orgATicketId) {
      await pageB.goto(`/tickets/${orgATicketId}`);
      await pageB.locator('body').waitFor({ timeout: 10000 });
      const bodyText = await pageB.locator('body').textContent();
      expect(bodyText).not.toContain('Org A Ticket');
    }

    await ctxA.close();
    await ctxB.close();
  });

  test('Org B cannot see Org A members via team page', async ({ page, browser }) => {
    const orgASlug = uniqueSlug('org-a');
    const orgBSlug = uniqueSlug('org-b');

    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    const result = await registerAndLogin(pageA, {
      email: `team-own-${uniqueSlug('t')}@example.com`,
      orgSlug: orgASlug,
    });

    await sidebarLink(pageA, '/team').click();
    await pageA.locator('text=Test User').waitFor({ timeout: 10000 });

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    const resultB = await registerAndLogin(pageB, {
      email: `team-own-b-${uniqueSlug('t')}@example.com`,
      orgSlug: orgBSlug,
    });

    await sidebarLink(pageB, '/team').click();
    await pageB.waitForURL('/team');

    // Org B sees exactly its own owner. Asserting on content rather than a raw row count
    // matters: the table renders skeleton rows while loading, so a count read too early is a
    // race against the loading state rather than a statement about tenant isolation.
    await expect(pageB.locator('tr', { hasText: resultB.email })).toBeVisible();
    await expect(pageB.locator(`text=${result.email}`)).not.toBeVisible();
    await expect(pageB.locator('tbody tr')).toHaveCount(1);

    await ctxA.close();
    await ctxB.close();
  });
});
