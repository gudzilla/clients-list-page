import { useState } from 'react';
import type { ClientsFilters } from '../features/clients/types';

const DEFAULT_FILTERS: ClientsFilters = {
  limit: 10,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useFilters = () => {
  const [filters, setFilters] = useState<ClientsFilters>(DEFAULT_FILTERS);

  const updateFilters = (updates: Partial<ClientsFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return { filters, updateFilters, resetFilters };
};
