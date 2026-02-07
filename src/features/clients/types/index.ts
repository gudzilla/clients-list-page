/**
 * Единый источник правды для типов сторон.
 * Используем `as const` для обеспечения строгой типизации в TS и Zod.
 */
export const PARTY_TYPES = {
  INDIVIDUAL: 'individual',
  LEGAL: 'legal',
} as const;

export type PartyType = (typeof PARTY_TYPES)[keyof typeof PARTY_TYPES];

/**
 * Валидные значения для сортировки.
 * Используются в парсерах URL параметров для типобезопасной валидации.
 */
export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof VALID_SORT_ORDERS)[number];

/**
 * Основная модель Клиента.
 * Поля полностью соответствуют схеме БД (camelCase).
 */
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

/**
 * Упрощенная модель для селекта родительской организации.
 * Используется в useParentClientOptions для минимизации передаваемого по сети трафика.
 */
export interface ParentClientOption {
  clientId: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
}

/**
 * Параметры фильтрации и пагинации.
 * [REFACTOR]: Вместо offset лучше использовать page (Point 1),
 * если мы хотим сделать URL более дружелюбным для пользователя (например, ?page=2 вместо ?offset=20).
 */
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

/**
 * Данные для создания. Поля помечены как опциональные,
 * так как бэкенд может принимать null, но Zod на фронте обеспечит доп. валидацию.
 */
export interface CreateClient {
  name: string;
  fullName?: string | null;
  partyType: PartyType;
  inn?: string | null;
  regionId?: string | null;
  parentId?: string | null;
}

/**
 * Для обновления используем Partial от CreateClient,
 * так как PATCH позволяет обновлять поля точечно.
 */
export type UpdateClient = Partial<CreateClient>;

/**
 * Структура детальной валидации полей (например, "inn": "Неверный формат").
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Контракт ошибок бэкенда.
 * Позволяет в ClientFormModal реализовать switch-case по errorName.
 */
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
