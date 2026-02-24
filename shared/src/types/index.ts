import type { Role } from '../constants/roles.js';
import type { PassengerSlotStatus, SyncStatus } from '../constants/status.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  isActive: boolean;
  profilePhotoUrl?: string | null;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SalesOrderRow {
  proposal: string;
  lineNumber: number;
  status: string;
  clientName: string;
  clientEmail: string;
  game: string;
  hotel: string;
  roomType: string;
  numberOfRooms: number;
  numberOfPax: number;
  checkIn: string;
  checkOut: string;
  ticketCategory: string;
  seller: string;
  company: string;
  cellPhone: string;
  rawData: Record<string, unknown>;
}

export interface SyncLogEntry {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: SyncStatus;
  rowsRead: number;
  rowsUpserted: number;
  rowsSkipped: number;
  error: string | null;
}

export interface ProposalSummary {
  id: string;
  proposal: string;
  clientName: string;
  clientEmail: string;
  game: string;
  hotel: string;
  status: string;
  captureStatus: string;
  totalSlots: number;
  filledSlots: number;
  progressPercent: number;
  seller: string;
  company: string;
  cellPhone: string;
  totalPax: number;
  deadline: string | null;
  dispatchedAt: string | null;
}

export interface PassengerSlotSummary {
  id: string;
  roomLabel: string;
  slotIndex: number;
  status: PassengerSlotStatus;
  passengerName: string | null;
}

export interface DashboardStats {
  totalDispatched: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  globalProgress: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  totalProposals: number;
  totalSlots: number;
  filledSlots: number;
  progressPercent: number;
  lastAccessAt: string | null;
}

export interface ClientDetailProposal {
  accessId: string;
  proposal: string;
  game: string;
  hotel: string;
  captureStatus: string;
  totalSlots: number;
  filledSlots: number;
  progressPercent: number;
  deadline: string | null;
  dispatchedAt: string | null;
  seller: string;
}

export interface ClientDetail {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  profilePhotoUrl: string | null;
  proposals: ClientDetailProposal[];
  stats: {
    totalProposals: number;
    totalSlots: number;
    filledSlots: number;
    progressPercent: number;
    completedProposals: number;
    inProgressProposals: number;
    pendingProposals: number;
  };
}
