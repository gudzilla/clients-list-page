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

  const filters = useMemo((): ClientsFilters => {
    const params: ClientsFilters = { ...DEFAULT_FILTERS };

    const limit = searchParams.get('limit');
    if (limit) params.limit = parseInt(limit, 10);

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

          const filterKeys: (keyof ClientsFilters)[] = [
            'query',
            'parentId',
            'regionId',
            'partyType',
            'limit',
          ];
          const hasFilterChanges = filterKeys.some((key) => key in updates);

          if (hasFilterChanges && !('offset' in updates)) {
            nextValues['offset'] = 0;
          }

          const newParams = new URLSearchParams();

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
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
