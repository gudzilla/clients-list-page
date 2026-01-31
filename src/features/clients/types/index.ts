export type PartyType = 'INDIVIDUAL' | 'LEGAL';

export interface Client {
  id: string;
  name: string;
  fullName: string | null;
  partyType: PartyType;
  inn: string | null;
  parentClientId: string | null;
  regionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSelectOption {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface ClientsFilters {
  query?: string;
  parentClientId?: string;
  regionId?: string;
  partyType?: PartyType;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateClientDto {
  name: string;
  fullName?: string;
  partyType: PartyType;
  inn?: string;
  parentClientId?: string;
  regionId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateClientDto extends Partial<CreateClientDto> {}
