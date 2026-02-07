import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { PARTY_TYPES, VALID_SORT_ORDERS } from '../types';
import type { ClientsFilters, PartyType } from '../types';

const DEFAULT_FILTERS: ClientsFilters = {
  pageSize: 20,
  page: 1,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Безопасный парсинг числа с fallback на дефолт.
 */
function parseNumber(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Type guard для проверки enum значений.
 */
function isValidEnum<T extends string>(
  value: string | null,
  validValues: readonly T[]
): value is T {
  return value !== null && validValues.includes(value as T);
}

/**
 * Парсинг URL параметров в типизированный объект ClientsFilters.
 */
function parseFiltersFromUrl(
  searchParams: URLSearchParams,
  defaults: ClientsFilters
): ClientsFilters {
  const params: ClientsFilters = { ...defaults };

  const pageSize = searchParams.get('pageSize');
  if (pageSize) params.pageSize = parseNumber(pageSize, defaults.pageSize!);

  const page = searchParams.get('page');
  if (page) params.page = parseNumber(page, defaults.page!);

  const sortBy = searchParams.get('sortBy');
  if (sortBy) params.sortBy = sortBy;

  const sortOrder = searchParams.get('sortOrder');
  if (isValidEnum(sortOrder, VALID_SORT_ORDERS)) {
    params.sortOrder = sortOrder;
  }

  const query = searchParams.get('query');
  if (query) params.query = query;

  const parentId = searchParams.get('parentId');
  if (parentId) params.parentId = parentId;

  const regionId = searchParams.get('regionId');
  if (regionId) params.regionId = regionId;

  const partyType = searchParams.get('partyType');
  if (partyType === PARTY_TYPES.INDIVIDUAL || partyType === PARTY_TYPES.LEGAL) {
    params.partyType = partyType as PartyType;
  }

  return params;
}

/**
 * Проверяет изменение фильтров (не пагинации).
 * Сравнивает РЕАЛЬНЫЕ значения, а не только наличие ключа.
 */
function hasFilterFieldChanges(
  updates: Partial<ClientsFilters>,
  current: ClientsFilters
): boolean {
  const filterKeys: (keyof ClientsFilters)[] = [
    'query',
    'parentId',
    'regionId',
    'partyType',
    'pageSize',
  ];

  return filterKeys.some(
    (key) => key in updates && updates[key] !== current[key]
  );
}

/**
 * Создает чистый URLSearchParams без дефолтных значений.
 */
function buildCleanUrlParams(
  filters: ClientsFilters,
  defaults: ClientsFilters
): URLSearchParams {
  const params = new URLSearchParams();

  (Object.keys(filters) as (keyof ClientsFilters)[]).forEach((key) => {
    const value = filters[key];
    const defaultValue = defaults[key];

    if (value !== undefined && value !== null && value !== '') {
      if (value !== defaultValue) {
        params.set(key, String(value));
      }
    }
  });

  return params;
}

/**
 * Хук для работы с фильтрами через URL параметры.
 * Реализует "URL as Single Source of Truth".
 */
export function useClientsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Парсинг URL в объект фильтров (мемоизировано для React Query)
  const filters = useMemo((): ClientsFilters => {
    return parseFiltersFromUrl(searchParams, DEFAULT_FILTERS);
  }, [searchParams]);

  // Обновление фильтров с автоматическим сбросом пагинации
  const updateFilters = useCallback(
    (updates: Partial<ClientsFilters>) => {
      setSearchParams(
        (prevParams) => {
          const currentFilters = parseFiltersFromUrl(
            prevParams,
            DEFAULT_FILTERS
          );

          const nextFilters: ClientsFilters = { ...currentFilters, ...updates };

          // Сброс пагинации при изменении фильтра
          const filterChanged = hasFilterFieldChanges(updates, currentFilters);
          const pageExplicitlySet = 'page' in updates;

          if (filterChanged && !pageExplicitlySet) {
            nextFilters.page = 1;
          }

          return buildCleanUrlParams(nextFilters, DEFAULT_FILTERS);
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Сброс всех фильтров
  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
