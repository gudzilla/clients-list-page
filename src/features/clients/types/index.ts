export type PartyType = 'individual' | 'legal';

export interface Client {
  clientId: string;
  name: string;
  fullName: string | null;
  partyType: PartyType;
  inn: string | null;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  regionId: string | null;
}

export interface ClientSelectOption {
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
  limit: number;
  offset: number;
}

export interface RegionsResponse {
  items: Region[];
}

export interface CreateClientDto {
  name: string;
  fullName?: string | null;
  partyType: PartyType;
  inn?: string | null;
  parentId?: string | null;
  regionId?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateClientDto extends Partial<CreateClientDto> {}

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
