import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { PARTY_TYPES } from '../types';
import type { ClientsFilters, PartyType } from '../types';

const DEFAULT_FILTERS: ClientsFilters = {
  limit: 20,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useClientsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Парсинг URL -> ClientsFilters
  const filters = useMemo((): ClientsFilters => {
    const params: ClientsFilters = { ...DEFAULT_FILTERS };

    // Limit & Offset (числа)
    const limit = searchParams.get('limit');
    if (limit) params.limit = parseInt(limit, 10);

    const offset = searchParams.get('offset');
    if (offset) params.offset = parseInt(offset, 10);

    // Сортировка
    const sortBy = searchParams.get('sortBy');
    if (sortBy) params.sortBy = sortBy;

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder === 'asc' || sortOrder === 'desc')
      params.sortOrder = sortOrder;

    // Фильтры
    const query = searchParams.get('query');
    if (query) params.query = query;

    const parentId = searchParams.get('parentId');
    if (parentId) params.parentId = parentId;

    const regionId = searchParams.get('regionId');
    if (regionId) params.regionId = regionId;

    const partyType = searchParams.get('partyType');
    if (
      partyType === PARTY_TYPES.INDIVIDUAL ||
      partyType === PARTY_TYPES.LEGAL
    ) {
      params.partyType = partyType as PartyType;
    }

    return params;
  }, [searchParams]);

  // 2. Обновление фильтров (ClientsFilters -> URL)
  const updateFilters = useCallback(
    (updates: Partial<ClientsFilters>) => {
      setSearchParams((prevParams: URLSearchParams) => {
        // Получаем текущее состояние фильтров из URL, чтобы корректно применить updates
        // Мы не можем полагаться на `filters` из замыкания, так как useCallback не должен зависеть от часто меняющегося filters.
        // Поэтому воссоздадим логику парсинга (упрощенно) или, что лучше, будем работать с URLSearchParams напрямую.

        const currentParams = new URLSearchParams(prevParams);

        // Вспомогательная функция для получения текущего значения (число или строка)
        const getCurrentValue = (key: string): string | null =>
          currentParams.get(key);

        // Применяем обновления к "виртуальному" объекту значений
        // Для этого нам нужно знать, какие ключи мы вообще поддерживаем
        const keys: (keyof ClientsFilters)[] = [
          'limit',
          'offset',
          'sortBy',
          'sortOrder',
          'query',
          'parentId',
          'regionId',
          'partyType',
        ];

        // Определяем новое значение для каждого ключа
        const nextValues: Record<string, string | number | undefined | null> =
          {};

        keys.forEach((key) => {
          if (key in updates) {
            nextValues[key] = updates[key];
          } else {
            // Если в updates нет, берем из URL или (важно!) оставляем как есть в URL
            // Но для логики сброса offset нам нужно знать значение.
            // Просто берем из URL.
            const valFromUrl = getCurrentValue(key);
            if (valFromUrl !== null) {
              nextValues[key] = valFromUrl;
              // Note: числа останутся строками, но для сравнения с DEFAULT_FILTERS ниже мы это учтем
            } else {
              nextValues[key] = undefined; // Значит сейчас действует дефолт
            }
          }
        });

        // Логика сброса offset
        const filterKeys: (keyof ClientsFilters)[] = [
          'query',
          'parentId',
          'regionId',
          'partyType',
        ];
        const hasFilterChanges = filterKeys.some((key) => key in updates);

        if (hasFilterChanges && !('offset' in updates)) {
          nextValues['offset'] = 0;
        }

        // Теперь формируем итоговый URLSearchParams
        const newParams = new URLSearchParams();

        keys.forEach((key) => {
          let val = nextValues[key];

          // Если значения нет в nextValues, значит оно не задано ни в URL, ни в updates -> действует дефолт
          // Но мы должны проверить, не нужно ли нам записать его явно?
          // Нет, мы пишем только то, что отличается от дефолта.

          // Получаем дефолтное значение для сравнения
          const defaultVal = DEFAULT_FILTERS[key];

          // Нормализация значения для сравнения (приводим к строке или числу как в дефолте)
          if (val !== undefined && val !== null && val !== '') {
            // Если val пришел из URL (строка), а дефолт число -> приводим val к числу
            if (typeof defaultVal === 'number' && typeof val === 'string') {
              val = parseInt(val, 10);
            }

            // Сравнение
            if (val !== defaultVal) {
              newParams.set(key, String(val));
            }
          }
        });

        return newParams;
      });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
