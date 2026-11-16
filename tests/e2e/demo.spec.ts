import { expect, test } from '@playwright/test';

test('owner can use the grounded SupportAI conversation demo', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'Owner', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Knowledge base articles')).toBeVisible();

  await page.getByRole('link', { name: 'Conversations', exact: true }).click();
  await page.getByRole('button', { name: /Conversation conversa/i }).first().click();
  await expect(page).toHaveURL(/\/conversations\/conversation-1$/);

  const question = page.getByRole('textbox', { name: 'Ask a question' });
  await question.fill('How long do I have to request a refund?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();

  await expect(page.getByText(/Eligible purchases can be refunded within 30 days/i)).toBeVisible();
  await expect(page.getByText('Refund policy > Eligibility')).toBeVisible();
});

test('agent can manage a support ticket in the demo', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Agent', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await page.getByRole('link', { name: 'Tickets', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tickets' })).toBeVisible();
  await page.getByText('Refund request for duplicate charge').click();
  await expect(page).toHaveURL(/\/tickets\/ticket-1$/);
  await expect(page.getByRole('heading', { name: 'Refund request for duplicate charge' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Update status' }).selectOption('resolved');
  await expect(page.getByText('Status updated.')).toBeVisible();

  await page.getByRole('textbox', { name: 'Internal note' }).fill('Demo review completed.');
  await page.getByRole('button', { name: /Send/i }).click();

  await expect(page.getByText('Demo review completed.')).toBeVisible();
});
