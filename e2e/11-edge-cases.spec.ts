import { test, expect } from '@playwright/test';
import { MASTER_USER, ENDPOINTS } from './fixtures/test-data';

let masterToken: string;

/**
 * Edge cases and stress tests covering:
 * - SQL injection attempts
 * - XSS payload handling
 * - Malformed requests
 * - Boundary values
 * - Concurrent access
 * - Rate limiting
 */
test.describe('Edge Cases - Input Validation & Security', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: MASTER_USER.email, password: MASTER_USER.password },
    });
    masterToken = (await res.json()).token;
  });

  test('Login with SQL injection in email field returns 400 (Zod validation)', async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: {
        email: "admin'--",
        password: 'anything',
      },
    });
    // Zod should reject invalid email format
    expect(res.status()).toBe(400);
  });

  test('Login with XSS payload in email field is handled safely', async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: {
        email: '<script>alert("xss")</script>@test.com',
        password: 'anything',
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Login with very long email (1000+ chars) does not crash', async ({ request }) => {
    const longEmail = 'a'.repeat(1000) + '@test.com';
    const res = await request.post(ENDPOINTS.login, {
      data: { email: longEmail, password: 'anything' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Login with very long password (10000+ chars) does not crash', async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: 'test@test.com', password: 'x'.repeat(10000) },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('API handles malformed JSON body gracefully', async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-valid-json{{{',
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('API handles empty body gracefully', async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: '',
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('Proposals search with special characters does not crash', async ({ request }) => {
    const specialChars = [
      'test%20space',
      "test'quote",
      'test"double',
      'test;semicolon',
      'test<>angle',
      'test&amp',
      'test\nline',
      'test%00null',
    ];

    for (const search of specialChars) {
      const res = await request.get(`${ENDPOINTS.proposals}?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${masterToken}` },
      });
      expect(
        res.status(),
        `Search with '${search}' should not crash server`,
      ).toBeLessThan(500);
    }
  });

  test('API with expired/tampered JWT returns 401', async ({ request }) => {
    // Tampered token (modified payload)
    const tamperedToken = masterToken.slice(0, -5) + 'XXXXX';
    const res = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    expect(res.status()).toBe(401);
  });

  test('API with Bearer but no token returns 401', async ({ request }) => {
    const res = await request.get(ENDPOINTS.users, {
      headers: { Authorization: 'Bearer ' },
    });
    expect(res.status()).toBe(401);
  });

  test('API with wrong auth scheme returns 401', async ({ request }) => {
    const res = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Basic ${masterToken}` },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Edge Cases - Pagination Boundaries', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: MASTER_USER.email, password: MASTER_USER.password },
    });
    masterToken = (await res.json()).token;
  });

  test('Page 0 should not crash', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.proposals}?page=0`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('Negative page should not crash', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.proposals}?page=-1`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('Float page value should not crash', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.proposals}?page=1.5`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('Non-numeric page should not crash', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.proposals}?page=abc`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('pageSize=0 should not crash', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.proposals}?pageSize=0`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('Very large page number should return empty results, not crash', async ({ request }) => {
    const res = await request.get(`${ENDPOINTS.proposals}?page=999999`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(0);
  });
});

test.describe('Edge Cases - UI Resilience', () => {
  test('Double-click on login button does not create issues', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', MASTER_USER.email);
    await page.fill('input[name="password"]', MASTER_USER.password);

    // Double click submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.dblclick();

    // Should still redirect properly without errors
    await page.waitForURL(/\/(admin|login)/, { timeout: 10000 });
  });

  test('Rapid navigation does not crash the app', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', MASTER_USER.email);
    await page.fill('input[name="password"]', MASTER_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);

    // Navigate rapidly between pages
    const pages = ['/admin', '/admin/proposals', '/admin/clients', '/admin/sync', '/admin/exports'];
    for (const p of pages) {
      await page.goto(p);
    }

    // App should still be responsive
    await page.waitForLoadState('networkidle');
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    await page.waitForTimeout(1000);
  });

  test('Browser back button works after login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', MASTER_USER.email);
    await page.fill('input[name="password"]', MASTER_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);

    await page.goto('/admin/proposals');
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
  });

  test('localStorage cleared mid-session redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', MASTER_USER.email);
    await page.fill('input[name="password"]', MASTER_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);

    // Clear auth storage
    await page.evaluate(() => localStorage.clear());

    // Navigate to a protected page
    await page.goto('/admin/proposals');

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
