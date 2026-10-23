import { test, expect } from '@playwright/test';
import { registerAndLogin, sidebarLink, uniqueSlug } from './helpers';

test.describe('Security', () => {
  test('API returns security headers on every response', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/health');
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['content-security-policy']).toBeDefined();
  });

  test('API returns 401 for unauthenticated requests to protected endpoints', async ({ page }) => {
    const response = await page.request.get(
      'http://localhost:8000/api/orgs/00000000-0000-0000-0000-000000000000/documents'
    );
    expect(response.status()).toBe(401);
  });

  test('CORS allows frontend origin on auth endpoints', async ({ page }) => {
    const response = await page.request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'wrong',
        organization_slug: 'nonexistent',
      },
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    expect(response.headers()['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers()['access-control-allow-credentials']).toBe('true');
  });

  test('CORS rejects requests from disallowed origins', async ({ page }) => {
    const response = await page.request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'wrong',
        organization_slug: 'nonexistent',
      },
      headers: {
        Origin: 'https://evil.example',
      },
    });

    expect(response.headers()).not.toHaveProperty('access-control-allow-origin');
  });

  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await test.step('navigate to dashboard without auth', async () => {
      const response = await page.goto('/dashboard', { waitUntil: 'commit', timeout: 60000 });
      expect(response?.status()).toBe(200);
    });

    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Sign in to SupportAI/i })).toBeVisible();
  });

  test('conversations route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/conversations', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('tickets route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/tickets', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('documents route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/documents', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('customers route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/customers', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('team route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/team', { waitUntil: 'commit', timeout: 60000 });
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('password reset request returns 202 for unknown email (no enumeration)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await page.waitForURL(/\/password-reset/);

    await page.fill('input[type="email"]', 'nonexistent-organization@example.com');
    await page.getByRole('button', { name: 'Send reset instructions' }).click();

    await expect(page.locator('text=If that email is registered')).toBeVisible();
  });

  test('invalid JWT token is rejected by the API', async ({ page }) => {
    const response = await page.request.get(
      'http://localhost:8000/api/orgs/00000000-0000-0000-0000-000000000000/documents',
      {
        headers: {
          Authorization: 'Bearer this.is.not.a.valid.jwt',
        },
      }
    );
    expect(response.status()).toBe(401);
  });
});
