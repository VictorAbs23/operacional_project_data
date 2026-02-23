import api from './api';
import type { ProposalSummary, PaginatedResponse } from '@absolutsport/shared';

interface ProposalFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  game?: string;
  hotel?: string;
  seller?: string;
  search?: string;
}

export interface MatrixRow {
  // Sales Log (blue)
  proposal: string;
  clientName: string;
  clientEmail: string;
  game: string;
  hotel: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  ticketCategory: string;
  seller: string;
  status: string;
  numberOfRooms: number;
  numberOfPax: number;
  // Passenger (green)
  slotId: string;
  roomLabel: string;
  slotIndex: number;
  slotStatus: string;
  passengerName: string;
  nationality: string;
  gender: string;
  documentType: string;
  documentNumber: string;
  issuingCountry: string;
  expiryDate: string;
  birthDate: string;
  fanTeam: string;
  phone: string;
  email: string;
  // Admin (yellow)
  ticketStatus: string;
  hotelConfirmation: string;
  flightLocator: string;
  insuranceNumber: string;
  transferReference: string;
}

export interface AdminFieldsUpdate {
  ticket_status?: string;
  hotel_confirmation_number?: string;
  flight_locator?: string;
  insurance_number?: string;
  transfer_reference?: string;
}

export interface ProposalFilterOptions {
  games: string[];
  hotels: string[];
  sellers: string[];
}

export const proposalsApi = {
  list: (filters: ProposalFilters = {}) =>
    api.get<PaginatedResponse<ProposalSummary>>('/proposals', { params: filters }).then((r) => r.data),
  filterOptions: () =>
    api.get<ProposalFilterOptions>('/proposals/filter-options').then((r) => r.data),
  getById: (id: string) => api.get<ProposalSummary>(`/proposals/${id}`).then((r) => r.data),
  dispatch: (proposal: string, mode: 'EMAIL' | 'MANUAL_LINK', deadline?: string) =>
    api.post('/captures/dispatch', { proposal, mode, deadline }).then((r) => r.data),
  getMatrix: (id: string) =>
    api.get<MatrixRow[]>(`/proposals/${id}/matrix`).then((r) => r.data),
  updateAdminFields: (proposalId: string, slotId: string, data: AdminFieldsUpdate) =>
    api.patch(`/proposals/${proposalId}/slots/${slotId}/admin-fields`, data).then((r) => r.data),
};
