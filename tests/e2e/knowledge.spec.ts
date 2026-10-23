import { test, expect } from '@playwright/test';
import { registerAndLogin, sidebarLink, uniqueSlug, waitForDocumentReady, waitForHydration } from './helpers';

test.describe('Knowledge base', () => {
  test('owner can upload a text document and see it in the list', async ({ page }) => {
    test.setTimeout(120000);

    await registerAndLogin(page, {
      email: `doc-uploader-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/documents').click();
    await page.waitForURL('/documents');

    await expect(page.getByRole('button', { name: /Add document/i })).toBeVisible();
    await page.getByRole('button', { name: /Add document/i }).click();
    await page.getByRole('button', { name: /Upload file/i }).click();

    const content = 'This is the content of a test knowledge document. It contains useful information about our product.';
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test-doc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(content),
    });

    await expect(page.locator('text=test-doc')).toBeVisible({ timeout: 10000 });
    await waitForDocumentReady(page, 'test-doc');
  });

  test('uploading an unsupported file type shows an error', async ({ page }) => {
    await registerAndLogin(page, {
      email: `doc-reject-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/documents').click();
    await page.waitForURL('/documents');
    await page.getByRole('button', { name: /Add document/i }).click();
    await page.getByRole('button', { name: /Upload file/i }).click();

    // PNG magic bytes under an .exe name: the backend sniffs real content (Sec. 10) and
    // rejects anything outside the text/pdf allowlist with 415, regardless of extension.
    await page.locator('input[type="file"]').setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
    });

    await expect(page.locator('text=Unsupported file type')).toBeVisible({ timeout: 15000 });
  });

  test('viewer cannot upload documents', async ({ page, browser }) => {
    const ctx = await browser.newContext();
    const ownerPage = await ctx.newPage();
    await registerAndLogin(ownerPage, {
      email: `owner-doc-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Doc Viewer');
    await ownerPage.getByLabel('Email').fill(`docviewer-${uniqueSlug('t')}@example.com`);
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

    await sidebarLink(viewerPage, '/documents').click();
    await viewerPage.waitForURL('/documents');
    await expect(viewerPage.getByRole('button', { name: /Add document/i })).not.toBeVisible();

    await viewerCtx.close();
  });

  test('document detail page shows document metadata', async ({ page }) => {
    test.setTimeout(120000);

    await registerAndLogin(page, {
      email: `detail-user-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/documents').click();
    await page.waitForURL('/documents');
    await page.getByRole('button', { name: /Add document/i }).click();
    await page.getByRole('button', { name: /Upload file/i }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'detail-doc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Detail page test content.'),
    });

    await waitForDocumentReady(page, 'detail-doc');

    const docRow = page.locator('tr', { hasText: 'detail-doc' });
    await expect(docRow).toBeVisible({ timeout: 10000 });
    await docRow.click();

    await page.waitForURL(/\/documents\/[a-f0-9-]+/);
    await expect(page.getByRole('heading', { name: 'detail-doc.txt' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible();
    await expect(page.locator('text=Original filename')).toBeVisible();
    // The title heading repeats the filename, so scope to the details row to avoid a
    // strict-mode violation against both matches.
    await expect(
      page.getByText('Original filename').locator('..').getByText('detail-doc.txt')
    ).toBeVisible();
  });

  test('owner can delete a document from the detail page', async ({ page }) => {
    test.setTimeout(120000);

    await registerAndLogin(page, {
      email: `delete-user-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/documents').click();
    await page.waitForURL('/documents');
    await page.getByRole('button', { name: /Add document/i }).click();
    await page.getByRole('button', { name: /Upload file/i }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'doc-to-delete.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This document will be deleted.'),
    });

    await waitForDocumentReady(page, 'doc-to-delete');

    const docRow = page.locator('tr', { hasText: 'doc-to-delete' });
    await expect(docRow).toBeVisible({ timeout: 10000 });
    await docRow.click();

    await page.waitForURL(/\/documents\/[a-f0-9-]+/);
    await page.getByRole('button', { name: 'Delete document' }).click();
    await page.getByRole('button', { name: /^Delete$/ }).click();

    await page.waitForURL('/documents', { timeout: 15000 });
    await expect(page.locator('text=doc-to-delete')).not.toBeVisible();
  });
});
