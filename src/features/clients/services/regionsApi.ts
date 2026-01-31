import { useQuery } from '@tanstack/react-query';
import type { Region } from '../types';

async function fetchRegions(): Promise<Region[]> {
  const response = await fetch('/api/regions');
  if (!response.ok) throw new Error('Ошибка загрузки регионов');
  return response.json();
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: Infinity, // кешируем навсегда
  });
}
