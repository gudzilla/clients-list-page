export const PARTY_TYPES = {
  INDIVIDUAL: 'individual',
  LEGAL: 'legal',
} as const;

export type PartyType = (typeof PARTY_TYPES)[keyof typeof PARTY_TYPES];

export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof VALID_SORT_ORDERS)[number];

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
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type ClientsApiParams = Omit<ClientsFilters, 'page' | 'pageSize'> & {
  limit?: number;
  offset?: number;
};

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
