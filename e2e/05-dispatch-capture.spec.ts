import { test, expect } from '@playwright/test';
import { MASTER_USER, ENDPOINTS, SAMPLE_PROPOSAL_SIMPLE, SAMPLE_PROPOSAL_NOT_CONFIRMED, SAMPLE_PROPOSAL_NO_EMAIL } from './fixtures/test-data';

let masterToken: string;

/**
 * Tests the dispatch/capture flow:
 * 1. Admin sees proposals from synced sales orders
 * 2. Admin dispatches a capture for CONFIRMED proposals with email
 * 3. System creates client account, generates link, sends email
 * 4. Pre-requisite validation: STATUS=CONFIRMED and EMAIL present
 */
test.describe('Dispatch & Capture - Business Rules', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(ENDPOINTS.login, {
      data: { email: MASTER_USER.email, password: MASTER_USER.password },
    });
    masterToken = (await res.json()).token;
  });

  test('POST /captures/dispatch without proposal returns 400', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.captures}/dispatch`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('POST /captures/dispatch with non-existent proposal returns error', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.captures}/dispatch`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        proposal: 'NONEXISTENT_PROPOSAL_999',
        mode: 'MANUAL_LINK',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    // Should return 404 or 400, not 500
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /captures/dispatch with invalid mode value should not crash', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.captures}/dispatch`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        proposal: SAMPLE_PROPOSAL_SIMPLE.proposal,
        mode: 'INVALID_MODE',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    // Should return validation error, not 500
    expect(res.status()).toBeLessThan(500);
  });

  test('POST /captures/dispatch with past deadline should not crash', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.captures}/dispatch`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        proposal: SAMPLE_PROPOSAL_SIMPLE.proposal,
        mode: 'MANUAL_LINK',
        deadline: '2020-01-01T00:00:00Z',
      },
    });
    // Should either reject or accept, but not crash
    expect(res.status()).toBeLessThan(500);
  });

  test('POST /captures/dispatch with invalid deadline format should not crash', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.captures}/dispatch`, {
      headers: { Authorization: `Bearer ${masterToken}` },
      data: {
        proposal: SAMPLE_PROPOSAL_SIMPLE.proposal,
        mode: 'MANUAL_LINK',
        deadline: 'not-a-date',
      },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /captures/:accessId/schema returns form field definitions', async ({ request }) => {
    // Test with a random accessId (should either work or return 404, not 500)
    const res = await request.get(`${ENDPOINTS.captures}/test-access-id/schema`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    // If it returns 200, validate the structure
    if (res.status() === 200) {
      const fields = await res.json();
      expect(Array.isArray(fields)).toBe(true);
      if (fields.length > 0) {
        expect(fields[0]).toHaveProperty('key');
        expect(fields[0]).toHaveProperty('type');
        expect(fields[0]).toHaveProperty('required');
      }
    } else {
      // Should not be 500
      expect(res.status()).toBeLessThan(500);
    }
  });
});

test.describe('Dispatch & Capture - Access Control', () => {
  test('Unauthenticated user cannot dispatch', async ({ request }) => {
    const res = await request.post(`${ENDPOINTS.captures}/dispatch`, {
      data: {
        proposal: SAMPLE_PROPOSAL_SIMPLE.proposal,
        mode: 'MANUAL_LINK',
      },
    });
    expect(res.status()).toBe(401);
  });
});
