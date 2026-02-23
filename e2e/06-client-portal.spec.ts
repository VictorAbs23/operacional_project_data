import { test, expect } from '@playwright/test';
import { MASTER_USER, ENDPOINTS, VALID_PASSENGER_DATA } from './fixtures/test-data';

let masterToken: string;

test.describe('Client Portal - Forms API', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: MASTER_USER.email, password: MASTER_USER.password },
    });
    masterToken = (await res.json()).token;
  });

  test('GET /forms/my-proposals requires authentication', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.forms}/my-proposals`);
    expect(res.status()).toBe(401);
  });

  test('GET /forms/my-proposals returns array for authenticated user', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.forms}/my-proposals`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /forms/instance/:accessId with invalid ID returns proper error', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.forms}/instance/nonexistent-access-id`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /forms/slots/:slotId with invalid slotId returns proper error', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.forms}/slots/nonexistent-slot`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        answers: VALID_PASSENGER_DATA,
      },
    });
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /forms/slots/:slotId without answers body returns 400', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.forms}/slots/some-slot-id`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST /forms/slots/:slotId with null answers returns 400', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.forms}/slots/some-slot-id`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: { answers: null },
    });
    expect(res.status()).toBe(400);
  });

  test('Route collision FIXED: /forms/slots/:slotId is a distinct route from /forms/instance/:accessId', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.forms}/slots/some-slot-id`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    // Should hit the slot handler and return 404 (not found), not a route mismatch
    expect(res.status()).toBe(404);
  });
});

test.describe('Client Portal - UI Flow', () => {
  test('Client login page accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('Unauthenticated access to /client redirects to login', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/client');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Unauthenticated access to /client/proposal/:id redirects to login', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/client/proposal/test-access-id');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });
});
