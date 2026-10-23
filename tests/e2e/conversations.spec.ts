import { test, expect } from '@playwright/test';
import { assistantMessages, citations, registerAndLogin, sidebarLink, uniqueSlug, waitForDocumentReady, waitForHydration } from './helpers';

test.describe('Conversations', () => {
  test('owner can create a conversation and it appears in the list', async ({ page }) => {
    await registerAndLogin(page, {
      email: `conv-user-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');

    await page.getByRole('button', { name: /New conversation/i }).click();
    await page.waitForURL(/\/conversations\/[a-f0-9-]+/, { timeout: 15000 });

    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');

    const listCount = await page.locator('li').count();
    expect(listCount).toBeGreaterThanOrEqual(1);
  });

  test('can ask a question and see an AI response with citations', async ({ page }) => {
    // Upload -> background ingestion -> retrieval -> local LLM generation (llama3.1:8b on CPU).
    // Every stage is real here, so this is by far the slowest test in the suite. A warm model
    // answers in ~12s, but the first ask after an Ollama restart loads ~4.9GB of weights and
    // measured ~295s - so the budget is sized for the cold path. It's a ceiling, not an
    // expectation; a warm run finishes in well under a minute.
    test.setTimeout(900000);

    await registerAndLogin(page, {
      email: `ask-user-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/documents').click();
    await page.waitForURL('/documents');
    await page.getByRole('button', { name: /Add document/i }).click();
    await page.getByRole('button', { name: /Upload file/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'faqs.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Q: What is the return policy?\nA: Returns are accepted within 30 days of purchase. Q: How do I contact support? A: You can reach support at support@example.com.'),
    });

    await waitForDocumentReady(page, 'faqs');

    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');
    await page.getByRole('button', { name: /New conversation/i }).click();
    await page.waitForURL(/\/conversations\/[a-f0-9-]+/, { timeout: 15000 });

    await page.fill('input[aria-label="Ask a question"]', 'What is the return policy?');
    await page.getByRole('button', { name: /^Ask$/i }).click();

    const answer = assistantMessages(page).first();
    await expect(answer).toBeVisible({ timeout: 600000 });
    await expect(answer).toContainText(/30 days/i);
    await expect(citations(page).first()).toBeVisible({ timeout: 10000 });
  });

  test('low-confidence answer shows a warning banner', async ({ page }) => {
    // Retrieval returns nothing here (no documents in this org), but generation is still
    // attempted, so with Ollama up this test also pays a llama3.1:8b load on a cold start. The
    // banner appears either way - the GenerationError path in rag.py sets low_confidence - so this
    // test does not actually require a working model, it just needs room for one to load.
    test.setTimeout(900000);

    await registerAndLogin(page, {
      email: `lowcon-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');
    await page.getByRole('button', { name: /New conversation/i }).click();
    await page.waitForURL(/\/conversations\/[a-f0-9-]+/, { timeout: 15000 });

    await page.fill('input[aria-label="Ask a question"]', 'What is quantum entanglement?');
    await page.getByRole('button', { name: /^Ask$/i }).click();

    await expect(page.locator('text=This answer may be incomplete')).toBeVisible({ timeout: 600000 });
  });

  test('owner can escalate a conversation', async ({ page }) => {
    await registerAndLogin(page, {
      email: `esc-user-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');
    await page.getByRole('button', { name: /New conversation/i }).click();
    await page.waitForURL(/\/conversations\/[a-f0-9-]+/, { timeout: 15000 });

    await page.getByRole('button', { name: /Escalate to human/i }).click();

    await expect(page.locator('text=Conversation escalated')).toBeVisible({ timeout: 10000 });

    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');
    await page.locator('text=escalated').first().waitFor({ timeout: 10000 });
  });

  test('conversation list shows status badges', async ({ page }) => {
    await registerAndLogin(page, {
      email: `status-user-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');

    await page.getByRole('button', { name: /New conversation/i }).click();
    await page.waitForURL(/\/conversations\/[a-f0-9-]+/, { timeout: 15000 });
    await sidebarLink(page, '/conversations').click();
    await page.waitForURL('/conversations');

    // The status pill is the rounded badge; the "Started ..." line is a separate .text-xs
    // element, so match the badge itself rather than any small text in the row.
    const badge = page.locator('li span.rounded-full').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(/(open|escalated|closed)/i);
  });

  test('agent can ask questions in a conversation', async ({ page, browser }) => {
    // Viewer is a strictly read-only role (frontend/src/lib/auth/permissions.ts, mirrored from
    // backend/scripts/seed_roles.py) - it has no conversations:respond, so the role that can
    // actually work a conversation is an agent. A viewer is asserted to be locked out in
    // role-gating.spec.ts.
    const ctx = await browser.newContext();
    const ownerPage = await ctx.newPage();
    await registerAndLogin(ownerPage, {
      email: `convown-${uniqueSlug('t')}@example.com`,
      orgSlug: uniqueSlug('testorg'),
    });

    await sidebarLink(ownerPage, '/team').click();
    await ownerPage.getByRole('button', { name: /Invite teammate/i }).click();
    await ownerPage.getByLabel('Full name').fill('Conv Agent');
    await ownerPage.getByLabel('Email').fill(`convagent-${uniqueSlug('t')}@example.com`);
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

    await sidebarLink(agentPage, '/conversations').click();
    await agentPage.waitForURL('/conversations');
    await expect(agentPage.getByRole('button', { name: /New conversation/i })).toBeVisible();
    await agentPage.getByRole('button', { name: /New conversation/i }).click();
    await agentPage.waitForURL(/\/conversations\/[a-f0-9-]+/, { timeout: 15000 });

    const questionInput = agentPage.locator('input[aria-label="Ask a question"]');
    await expect(questionInput).toBeEnabled();
    // Typing enables Ask; a disabled Ask would mean the form is wired wrong.
    await questionInput.fill('What is the return policy?');
    await expect(agentPage.getByRole('button', { name: /^Ask$/i })).toBeEnabled();

    await agentCtx.close();
  });
});
