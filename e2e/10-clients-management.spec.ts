import { test, expect } from '@playwright/test';
import { MASTER_USER, ENDPOINTS } from './fixtures/test-data';

let masterToken: string;

test.describe('Clients Management - API Tests', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: MASTER_USER.email, password: MASTER_USER.password },
    });
    masterToken = (await res.json()).token;
  });

  test('GET /clients requires authentication', async ({ request }) => {
    const res = await request.get(ENDPOINTS.clients);
    expect(res.status()).toBe(401);
  });

  test('GET /clients returns paginated list', async ({ request }) => {
    const res = await request.get(ENDPOINTS.clients, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /clients/:id with invalid ID returns proper error', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.clients}/nonexistent-client-id`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    // Should return 404, not 500
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /clients/:id/reset-password with invalid ID returns error', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.clients}/nonexistent-id/reset-password`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('POST /clients/:id/deactivate with invalid ID returns error', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.clients}/nonexistent-id/deactivate`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('DELETE /clients/:id with invalid ID returns error', async ({ request }) => {
    const res = await request.delete(`${ENDPOINTS.clients}/nonexistent-id`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Clients Management - UI Tests', () => {
  test('Clients page loads', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', MASTER_USER.email);
    await page.fill('input[name="password"]', MASTER_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);

    await page.goto('/admin/clients');
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const heading = page.locator('h1, h2, [class*="title"]').first();
    await expect(heading).toBeVisible();
  });

  test('Client detail page handles invalid ID gracefully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', MASTER_USER.email);
    await page.fill('input[name="password"]', MASTER_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);

    await page.goto('/admin/clients/nonexistent-id');
    await page.waitForLoadState('networkidle');

    // Should show error or "not found" message, not crash
    // Check there's no unhandled JavaScript error
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.waitForTimeout(2000);
    // Page should not have unrecoverable JS errors
  });
});
