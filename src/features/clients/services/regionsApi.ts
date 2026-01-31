import { useQuery } from '@tanstack/react-query';
import type { Region } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchRegions(): Promise<Region[]> {
  const response = await fetch(`${BASE_URL}/regions`);
  if (!response.ok) throw new Error('Ошибка загрузки регионов');
  const data = await response.json();
  return data.items;
}

export function useRegions() {
  return useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
    staleTime: Infinity, // кешируем навсегда
  });
}
