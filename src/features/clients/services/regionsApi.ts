import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axiosClient';
import type { Region, RegionsResponse } from '../types';

async function fetchRegions(): Promise<Region[]> {
  const response = await apiClient.get<RegionsResponse>('/regions');
  return response.data.items;
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: Infinity,
  });
}
