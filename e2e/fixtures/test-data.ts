/**
 * Test data constants used across all E2E tests.
 * These mirror the seed data from backend/prisma/seed.ts
 * and representative test scenarios from the MVP spec.
 */

export const API_URL = process.env.API_URL || 'http://localhost:3333';

// --- Users (from seed) ---
export const MASTER_USER = {
  email: 'victorcesar2031@gmail.com',
  password: 'Dron3120@',
  name: 'Victor Cesar',
  role: 'MASTER' as const,
};

export const MASTER_USER_2 = {
  email: 'bianca.bianchi@absolut-sport.com.br',
  password: 'Dron3120@',
  name: 'Bianca Bianchi',
  role: 'MASTER' as const,
};

// --- Users to create during tests ---
export const TEST_ADMIN = {
  email: 'test-admin@absolut-sport.com.br',
  password: 'TestAdmin123!',
  name: 'Test Admin',
  role: 'ADMIN' as const,
};

export const TEST_CLIENT = {
  email: 'test-client@example.com',
  password: 'TestClient123!',
  name: 'Test Client',
  role: 'CLIENT' as const,
};

// --- Sample Sales Order Data (mimics Google Sheets import) ---
export const SAMPLE_PROPOSAL_SIMPLE = {
  proposal: '20250602',
  clientName: 'BTG Pactual',
  clientEmail: 'btg@example.com',
  game: 'M7 — New York',
  hotel: 'Distrikt Hotel NYC',
  roomType: 'KING',
  numberOfRooms: 2,
  numberOfPax: 2,
  checkIn: '11/06/2026',
  checkOut: '14/06/2026',
  ticketCategory: 'Cat 1',
  seller: 'BRA',
  status: 'CONFIRMED',
};

export const SAMPLE_PROPOSAL_MEDIUM = {
  proposal: '20260040',
  clientName: 'Personal Brasil',
  clientEmail: 'personal@example.com',
  game: 'M7 — New York',
  hotel: 'Hilton NY Times Square',
  status: 'CONFIRMED',
  lines: [
    {
      lineNumber: 1,
      roomType: 'SGL',
      numberOfRooms: 5,
      numberOfPax: 5,
      checkIn: '11/06/2026',
      checkOut: '14/06/2026',
    },
    {
      lineNumber: 2,
      roomType: 'DBL Twin',
      numberOfRooms: 5,
      numberOfPax: 10,
      checkIn: '11/06/2026',
      checkOut: '14/06/2026',
    },
  ],
};

export const SAMPLE_PROPOSAL_NOT_CONFIRMED = {
  proposal: '20250999',
  clientName: 'Pending Client',
  clientEmail: 'pending@example.com',
  game: 'Final',
  hotel: 'Marriott',
  roomType: 'QQ',
  numberOfRooms: 1,
  numberOfPax: 2,
  status: 'OPTION',
};

export const SAMPLE_PROPOSAL_NO_EMAIL = {
  proposal: '20250888',
  clientName: 'No Email Client',
  clientEmail: '',
  game: 'M101',
  hotel: 'Hilton Arlington',
  roomType: 'QQ',
  numberOfRooms: 1,
  numberOfPax: 2,
  status: 'CONFIRMED',
};

// --- Passenger form data ---
export const VALID_PASSENGER_DATA = {
  first_name: 'João',
  last_name: 'Silva',
  nationality: 'Brazilian',
  gender: 'Male',
  document_type: 'CPF',
  document_number: '123.456.789-00',
  issuing_country: 'Brazil',
  document_expiry: '2030-12-31',
  birth_date: '1990-05-15',
  team: 'Brazil',
  phone: '+5511999999999',
  email: 'joao.silva@example.com',
};

export const INCOMPLETE_PASSENGER_DATA = {
  first_name: 'Maria',
  last_name: '',
  nationality: '',
};

// --- Room type pax capacities (from MVP doc section 8.3) ---
export const ROOM_TYPE_CAPACITY: Record<string, number> = {
  SGL: 1,
  'DBL Twin': 2,
  'DBL Casal': 2,
  QQ: 2,
  KING: 1, // 1-2, but defaults to NUMBER_OF_PAX / NUMBER_OF_ROOMS
  TPL: 3,
  QDP: 4,
};

// --- API helper URLs ---
export const ENDPOINTS = {
  health: `${API_URL}/api/health`,
  login: `${API_URL}/api/auth/login`,
  logout: `${API_URL}/api/auth/logout`,
  me: `${API_URL}/api/auth/me`,
  changePassword: `${API_URL}/api/auth/change-password`,
  users: `${API_URL}/api/users`,
  clients: `${API_URL}/api/clients`,
  proposals: `${API_URL}/api/proposals`,
  proposalFilterOptions: `${API_URL}/api/proposals/filter-options`,
  forms: `${API_URL}/api/forms`,
  captures: `${API_URL}/api/captures`,
  dashboard: `${API_URL}/api/dashboard`,
  sync: `${API_URL}/api/sync`,
  exports: `${API_URL}/api/exports`,
  audit: `${API_URL}/api/audit`,
};
