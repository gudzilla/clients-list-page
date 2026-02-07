import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axiosClient';
import type { Region, RegionsResponse } from '../types';

async function fetchRegions(): Promise<Region[]> {
  const response = await apiClient.get<RegionsResponse>('/regions');
  return response.data.items;
}

/**
 * ХУК ДЛЯ КЭШИРУЕМОГО СЕЛОКТА
 * [MVP OPTIMIZATION]: Регионы — это справочник, который меняется крайне редко.
 * Мы используем staleTime: Infinity, чтобы загрузить данные ровно 1 раз
 * за весь сеанс работы пользователя.
 */
export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: Infinity, // Данные никогда не считаются "протухшими"
  });
}
