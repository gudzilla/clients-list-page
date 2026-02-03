export const PARTY_TYPES = {
  INDIVIDUAL: 'individual',
  LEGAL: 'legal',
} as const;

export type PartyType = (typeof PARTY_TYPES)[keyof typeof PARTY_TYPES];

export interface Client {
  clientId: string;
  name: string;
  fullName: string | null;
  partyType: PartyType;
  inn: string | null;
  createdAt: string;
  updatedAt: string;
  regionId: string | null;
  parentId: string | null;
}

export interface ParentClientOption {
  clientId: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface ClientsFilters {
  query?: string;
  parentId?: string;
  regionId?: string;
  partyType?: PartyType;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClientsResponse {
  items: Client[];
  total: number;
}

export interface RegionsResponse {
  items: Region[];
}

export interface CreateClient {
  name: string;
  fullName?: string | null;
  partyType: PartyType;
  inn?: string | null;
  regionId?: string | null;
  parentId?: string | null;
}

export type UpdateClient = Partial<CreateClient>;

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export type BackendErrorName =
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'CLIENT_NOT_FOUND'
  | 'PARENT_CLIENT_NOT_FOUND'
  | 'CLIENT_ALREADY_EXISTS'
  | 'CLIENT_ALREADY_EXISTS_BY_INN';

export interface BackendErrorResponse {
  errorName: BackendErrorName;
  message: string;
  errors?: ValidationErrorDetail[];
}
