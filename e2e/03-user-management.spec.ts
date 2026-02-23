import { test, expect } from '@playwright/test';
import { MASTER_USER, ENDPOINTS } from './fixtures/test-data';

let masterToken: string;
const testUserEmail = `e2e-user-${Date.now()}@test.com`;

test.describe('User Management - MASTER-only Features', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: MASTER_USER.email, password: MASTER_USER.password },
    });
    const body = await res.json();
    masterToken = body.token;
  });

  test('POST /users creates a new ADMIN user', async ({ request }) => {
    const res = await request.post(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        email: testUserEmail,
        name: 'E2E Test Admin',
        role: 'ADMIN',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(testUserEmail);
    expect(body.user.role).toBe('ADMIN');
    expect(body.user.isActive).toBe(true);
    expect(body.user.mustChangePassword).toBe(true);
    expect(body).toHaveProperty('tempPassword');
    expect(body.tempPassword).toBeTruthy();
    expect(body.tempPassword.length).toBeGreaterThanOrEqual(8);
  });

  test('POST /users with duplicate email returns error', async ({ request }) => {
    const res = await request.post(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        email: testUserEmail,
        name: 'Duplicate User',
        role: 'ADMIN',
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /users with invalid role returns error', async ({ request }) => {
    const res = await request.post(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        email: 'invalid-role@test.com',
        name: 'Invalid Role',
        role: 'SUPERADMIN',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /users with CLIENT role returns error (clients created via dispatch)', async ({ request }) => {
    const res = await request.post(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        email: 'client-via-users@test.com',
        name: 'Invalid Client',
        role: 'CLIENT',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /users lists all users', async ({ request }) => {
    const res = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2); // At least 2 seed masters
  });

  test('GET /users/:id returns specific user', async ({ request }) => {
    // List users first
    const listRes = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const { data: users } = await listRes.json();
    const testUser = users.find((u: any) => u.email === testUserEmail);
    expect(testUser).toBeTruthy();

    const res = await request.get(`${ENDPOINTS.users}/${testUser.id}`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);
    const user = await res.json();
    expect(user.email).toBe(testUserEmail);
  });

  test('PATCH /users/:id updates user name', async ({ request }) => {
    const listRes = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const { data: users } = await listRes.json();
    const testUser = users.find((u: any) => u.email === testUserEmail);

    const res = await request.patch(`${ENDPOINTS.users}/${testUser.id}`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: { name: 'Updated E2E Admin' },
    });
    expect(res.status()).toBe(200);
    const updated = await res.json();
    expect(updated.name).toBe('Updated E2E Admin');
  });

  test('POST /users/:id/reset-password returns new temp password', async ({ request }) => {
    const listRes = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const { data: users } = await listRes.json();
    const testUser = users.find((u: any) => u.email === testUserEmail);

    const res = await request.post(`${ENDPOINTS.users}/${testUser.id}/reset-password`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('tempPassword');
    expect(body.tempPassword.length).toBeGreaterThanOrEqual(8);
  });

  test('POST /users/:id/deactivate disables the user', async ({ request }) => {
    const listRes = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const { data: users } = await listRes.json();
    const testUser = users.find((u: any) => u.email === testUserEmail);

    const res = await request.post(`${ENDPOINTS.users}/${testUser.id}/deactivate`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);

    // Verify user is deactivated
    const getRes = await request.get(`${ENDPOINTS.users}/${testUser.id}`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const user = await getRes.json();
    expect(user.isActive).toBe(false);
  });

  test('Deactivated user cannot login', async ({ request }) => {
    const listRes = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const { data: users } = await listRes.json();
    const testUser = users.find((u: any) => u.email === testUserEmail);

    // Reset password first to get a known password
    const resetRes = await request.post(`${ENDPOINTS.users}/${testUser.id}/reset-password`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const { tempPassword } = await resetRes.json();

    // Try login with deactivated user
    const loginRes = await request.post(ENDPOINTS.login, {
      data: { email: testUserEmail, password: tempPassword },
    });
    expect(loginRes.status()).toBe(401);
  });

  test('DELETE /users/:id deletes the user', async ({ request }) => {
    const listRes = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const { data: users } = await listRes.json();
    const testUser = users.find((u: any) => u.email === testUserEmail);

    const res = await request.delete(`${ENDPOINTS.users}/${testUser.id}`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    expect(res.status()).toBe(200);
  });
});

test.describe('User Management - Access Control', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: MASTER_USER.email, password: MASTER_USER.password },
    });
    const body = await res.json();
    masterToken = body.token;
  });

  test('ADMIN cannot access /users endpoints', async ({ request }) => {
    // Create an admin to test with
    const adminEmail = `e2e-admin-acl-${Date.now()}@test.com`;
    const createRes = await request.post(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: { email: adminEmail, name: 'ACL Test Admin', role: 'ADMIN' },
    });
    const { tempPassword } = await createRes.json();

    // Login as admin
    const loginRes = await request.post(ENDPOINTS.login, {
      data: { email: adminEmail, password: tempPassword },
    });
    const { token: adminToken } = await loginRes.json();

    // Try to access users endpoints
    const usersRes = await request.get(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(usersRes.status()).toBe(403);

    // Try to create a user
    const createUserRes = await request.post(ENDPOINTS.users, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { email: 'hack@test.com', name: 'Hacker', role: 'MASTER' },
    });
    expect(createUserRes.status()).toBe(403);
  });
});
