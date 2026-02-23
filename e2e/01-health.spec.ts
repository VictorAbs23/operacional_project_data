import { test, expect } from '@playwright/test';
import { ENDPOINTS } from './fixtures/test-data';

test.describe('Health Check - Infrastructure Validation', () => {
  test('API /health responds with 200 and valid JSON', async ({ request }) => {
    const res = await request.get(ENDPOINTS.health);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  test('Frontend loads the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    // Should have email and password inputs
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Unknown API route returns 404 or error', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.health.replace('/health', '/nonexistent')}`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('Protected API routes return 401 without token', async ({ request }) => {
    const protectedEndpoints = [
      ENDPOINTS.me,
      ENDPOINTS.users,
      ENDPOINTS.proposals,
      ENDPOINTS.dashboard + '/stats',
      ENDPOINTS.audit,
    ];

    for (const url of protectedEndpoints) {
      const res = await request.get(url);
      expect(res.status(), `Expected 401 for ${url}`).toBe(401);
    }
  });
});
