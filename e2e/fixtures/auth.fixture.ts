import { test as base, type Page, type APIRequestContext } from '@playwright/test';
import { MASTER_USER, TEST_ADMIN, ENDPOINTS, API_URL } from './test-data';

/**
 * Custom Playwright fixtures that provide authenticated contexts
 * for different user roles (Master, Admin, Client).
 */

type AuthFixtures = {
  masterToken: string;
  adminToken: string;
  authenticatedPage: Page;
  apiContext: APIRequestContext;
};

async function loginViaAPI(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(ENDPOINTS.login, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${email}: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.token;
}

export const test = base.extend<AuthFixtures>({
  masterToken: async ({ request }, use) => {
    const token = await loginViaAPI(request, MASTER_USER.email, MASTER_USER.password);
    await use(token);
  },

  adminToken: async ({ request, masterToken }, use) => {
    // First create admin user via API (as master)
    const createRes = await request.post(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        email: TEST_ADMIN.email,
        name: TEST_ADMIN.name,
        role: TEST_ADMIN.role,
      },
    });

    let adminPassword = TEST_ADMIN.password;

    if (createRes.ok()) {
      const body = await createRes.json();
      adminPassword = body.tempPassword || TEST_ADMIN.password;

      // Change the temp password
      const adminToken = await loginViaAPI(request, TEST_ADMIN.email, adminPassword);
      await request.post(ENDPOINTS.changePassword, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          currentPassword: adminPassword,
          newPassword: TEST_ADMIN.password,
        },
      });
    }

    const token = await loginViaAPI(request, TEST_ADMIN.email, TEST_ADMIN.password);
    await use(token);
  },

  authenticatedPage: async ({ page }, use) => {
    // Login as master via UI
    await page.goto('/login');
    await page.fill('input[name="email"]', MASTER_USER.email);
    await page.fill('input[name="password"]', MASTER_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|client)/);
    await use(page);
  },

  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: API_URL,
    });
    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
