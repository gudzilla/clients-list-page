import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { PARTY_TYPES } from '../types';
import type { ClientsFilters, PartyType } from '../types';

const DEFAULT_FILTERS: ClientsFilters = {
  limit: 10,
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
        const newParams = new URLSearchParams(prevParams);

        // Объединяем текущие значения из URL + обновления
        // Важно: нужно получить текущее состояние именно из URLSearchParams для надежности,
        // но так как мы используем updates поверх prevParams, мы фактически мерджим.

        // Логика сброса offset: если меняется любой фильтр, кроме пагинации/сортировки - сбрасываем offset
        // НО: проще довериться явному offset: 0, если он передан в updates (как это делает таблица),
        // ИЛИ реализовать "умный сброс".
        // В текущем ТЗ: "предоставляет функции обновления, которые... провоцируют перерендер".
        // Сделаем надежно: пройдемся по всем ключам updates.

        // Сначала перенесем updates в URLSearchParams
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            newParams.delete(key);
          } else {
            // Не пишем дефолтные значения (опционально, для чистоты URL)
            // Для простоты реализации пока пишем все явные изменения
            newParams.set(key, String(value));
          }
        });

        // "Умный сброс" offset:
        // Если меняется критерий фильтрации (query, parentId, regionId, partyType),
        // а offset явно не передан в updates, то сбрасываем его.
        const filterKeys: (keyof ClientsFilters)[] = [
          'query',
          'parentId',
          'regionId',
          'partyType',
        ];
        const hasFilterChanges = filterKeys.some((key) => key in updates);

        if (hasFilterChanges && !('offset' in updates)) {
          newParams.set('offset', '0');
        }

        return newParams;
      });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    // Сбрасываем URL к пустому состоянию (или к дефолтным параметрам, если решим их явно писать)
    // В данном случае просто очищаем searchParams, хук чтения подставит DEFAULT_FILTERS
    setSearchParams({});
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
