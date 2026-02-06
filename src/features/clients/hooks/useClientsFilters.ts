import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { PARTY_TYPES } from '../types';
import type { ClientsFilters, PartyType } from '../types';

/**
 * Дефолтные значения фильтров.
 * Вынесены в константу для корректного сравнения и "очистки" URL от лишних параметров.
 */
const DEFAULT_FILTERS: ClientsFilters = {
  limit: 20,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
/**
 * КЛЮЧЕВОЙ ХУК: Реализует паттерн "URL as a Single Source of Truth".
 * Вместо локального useState для фильтров, мы храним всё в поисковой строке браузера.
 * Это позволяет:
 * 1. Делиться ссылками с примененными фильтрами.
 * 2. Сохранять состояние при перезагрузке.
 * 3. Использовать нативную навигацию браузера (кнопка "Назад").
 */
export function useClientsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Преобразование URLSearchParams в объект ClientsFilters.
   * Обернуто в useMemo, так как этот объект является ключом для React Query (Query Key).
   * Если объект будет пересоздаваться без изменений данных — это вызовет лишние сетевые запросы.
   */
  const filters = useMemo((): ClientsFilters => {
    const params: ClientsFilters = { ...DEFAULT_FILTERS };

    // Парсинг числовых значений
    const limit = searchParams.get('limit');
    if (limit) params.limit = parseInt(limit, 10);

    /**
     * [REFACTOR]: (Point 1) Сейчас используется offset (смещение).
     * Для UX лучше перевести это в `page`.
     * Формула: offset = (page - 1) * limit.
     */
    const offset = searchParams.get('offset');
    if (offset) params.offset = parseInt(offset, 10);

    const sortBy = searchParams.get('sortBy');
    if (sortBy) params.sortBy = sortBy;

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder === 'asc' || sortOrder === 'desc')
      params.sortOrder = sortOrder;

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

  /**
   * Умное обновление параметров.
   * Функция не просто заменяет URL, а мержит изменения.
   */
  const updateFilters = useCallback(
    (updates: Partial<ClientsFilters>) => {
      setSearchParams(
        (prevParams: URLSearchParams) => {
          const currentParams = new URLSearchParams(prevParams);

          const getCurrentValue = (key: string): string | null =>
            currentParams.get(key);

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

          const nextValues: Record<string, string | number | undefined | null> =
            {};

          // Собираем актуальные значения (новые + текущие из URL)
          keys.forEach((key) => {
            if (key in updates) {
              nextValues[key] = updates[key];
            } else {
              const valFromUrl = getCurrentValue(key);
              if (valFromUrl !== null) {
                nextValues[key] = valFromUrl;
              } else {
                nextValues[key] = undefined;
              }
            }
          });

          // СБРОС ПАГИНАЦИИ: Если изменился любой фильтр (кроме самой пагинации),
          // мы должны вернуть пользователя на первую страницу (offset: 0).
          const filterKeys: (keyof ClientsFilters)[] = [
            'query',
            'parentId',
            'regionId',
            'partyType',
            'limit',
          ];
          const hasFilterChanges = filterKeys.some((key) => key in updates);

          /**
           * [ERROR]: Логическая ловушка.
           * Если компонент вызывает updateFilters({...filters, query: 'new'}),
           * то 'offset' уже ПРИСУТСТВУЕТ в updates (из-за деструктуризации старых фильтров).
           * В этом случае условие !('offset' in updates) вернет false,
           * и пагинация НЕ сбросится. Это приведет к тому, что пользователь
           * может остаться на пустой странице при поиске.
           *
           * [FIX / SOLUTION]: Вместо проверки наличия ключа `in updates`,
           * нужно сравнивать новое значение из `updates` с текущим из `filters`.
           * Если значение фильтра РЕАЛЬНО изменилось — принудительно ставим offset: 0.
           *
           * Пример кода для фикса:
           * const isRealChange = filterKeys.some(key => key in updates && updates[key] !== filters[key]);
           * if (isRealChange) nextValues['offset'] = 0;
           */
          if (hasFilterChanges && !('offset' in updates)) {
            nextValues['offset'] = 0;
          }
          const newParams = new URLSearchParams();

          // CLEAN URL: Не добавляем в URL параметры, которые равны дефолтным.
          // Это делает ссылки чище (вместо ?limit=20&offset=0 будет просто /)
          keys.forEach((key) => {
            let val = nextValues[key];
            const defaultVal = DEFAULT_FILTERS[key];

            if (val !== undefined && val !== null && val !== '') {
              if (typeof defaultVal === 'number' && typeof val === 'string') {
                val = parseInt(val, 10);
              }

              if (val !== defaultVal) {
                newParams.set(key, String(val));
              }
            }
          });

          return newParams;
        },
        { replace: true } // replace: true чтобы не спамить в историю браузера при каждом наборе в поиске
      );
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
