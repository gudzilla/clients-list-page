import { useCallback } from 'react';
import { PARTY_TYPES } from '../types';
import type { ClientsFilters, PartyType } from '../types';
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
} from 'nuqs';
import { type inferParserType } from 'nuqs/server';

const filtersParser = {
  query: parseAsString,
  parentId: parseAsString,
  regionId: parseAsString,

  partyType: parseAsStringEnum<PartyType>([
    PARTY_TYPES.INDIVIDUAL,
    PARTY_TYPES.LEGAL,
  ]),

  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),

  sortBy: parseAsString.withDefault('createdAt'),
  sortOrder: parseAsStringEnum(['asc', 'desc']).withDefault('desc'),
};

type ParsedFilters = {
  [K in keyof typeof filtersParser]: inferParserType<(typeof filtersParser)[K]>;
};

function hasFilterFieldChanges(
  updates: Partial<ClientsFilters>,
  current: ParsedFilters
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

export function useClientsFilters() {
  const [filters, setFilters] = useQueryStates(filtersParser, {
    history: 'replace',
  });

  const updateFilters = useCallback(
    (updates: Partial<ClientsFilters>) => {
      const filterChanged = hasFilterFieldChanges(updates, filters);
      const pageExplicitlySet = 'page' in updates;

      const nextUpdates =
        filterChanged && !pageExplicitlySet ? { ...updates, page: 1 } : updates;

      setFilters(nextUpdates);
    },
    [filters, setFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters(null);
  }, [setFilters]);

  return { filters, updateFilters, resetFilters };
}
