import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Client,
  ClientsFilters,
  PaginatedResponse,
  CreateClientDto,
  UpdateClientDto,
  ClientSelectOption,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// API функции
async function fetchClients(filters: ClientsFilters): Promise<PaginatedResponse<Client>> {
  const params = new URLSearchParams();

  if (filters.query) params.set('query', filters.query);
  if (filters.parentId) params.set('parentId', filters.parentId);
  if (filters.regionId) params.set('regionId', filters.regionId);
  if (filters.partyType) params.set('partyType', filters.partyType);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const response = await fetch(`${BASE_URL}/clients?${params}`);
  if (!response.ok) throw new Error('Ошибка загрузки клиентов');
  return response.json();
}

async function fetchClient(id: string): Promise<Client> {
  const response = await fetch(`${BASE_URL}/clients/${id}`);
  if (!response.ok) throw new Error('Клиент не найден');
  return response.json();
}

async function fetchClientSelectOptions(): Promise<ClientSelectOption[]> {
  // Используем общий список для селекта, запрашиваем достаточное количество
  const params = new URLSearchParams({ limit: '100' });
  const response = await fetch(`${BASE_URL}/clients?${params}`);
  
  if (!response.ok) throw new Error('Ошибка загрузки списка клиентов');
  
  const data: PaginatedResponse<Client> = await response.json();
  
  return data.items.map((client) => ({
    clientId: client.clientId,
    name: client.name,
  }));
}

async function createClient(data: CreateClientDto): Promise<Client> {
  const response = await fetch(`${BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка создания клиента');
  return response.json();
}

async function updateClient({ id, data }: { id: string; data: UpdateClientDto }): Promise<Client> {
  const response = await fetch(`${BASE_URL}/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка обновления клиента');
  return response.json();
}

async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/clients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка удаления клиента');
}

// React Query хуки
export function useClients(filters: ClientsFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => fetchClients(filters),
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClient(id!),
    enabled: !!id,
  });
}

export function useClientSelectOptions() {
  return useQuery({
    queryKey: ['clientSelectOptions'],
    queryFn: fetchClientSelectOptions,
    staleTime: 60 * 1000, // кешируем на минуту
  });
}

// Optimistic create - добавляем клиента в начало списка мгновенно
export function useCreateClient(currentFilters: ClientsFilters) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onMutate: async (newClientData) => {
      // Отменяем исходящие запросы
      await queryClient.cancelQueries({ queryKey: ['clients', currentFilters] });

      // Сохраняем предыдущее состояние
      const previousData = queryClient.getQueryData<PaginatedResponse<Client>>(['clients', currentFilters]);

      // Создаём оптимистичного клиента
      const optimisticClient: Client = {
        clientId: `temp-${Date.now()}`,
        name: newClientData.name,
        fullName: newClientData.fullName || null,
        partyType: newClientData.partyType,
        inn: newClientData.inn || null,
        parentId: newClientData.parentId || null,
        regionId: newClientData.regionId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Добавляем в начало списка
      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<Client>>(['clients', currentFilters], {
          ...previousData,
          items: [optimisticClient, ...previousData.items],
          total: previousData.total + 1,
        });
      }

      return { previousData };
    },
    onError: (_err, _newClient, context) => {
      // Откатываем при ошибке
      if (context?.previousData) {
        queryClient.setQueryData(['clients', currentFilters], context.previousData);
      }
    },
    onSettled: () => {
      // Синхронизируем с сервером
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientSelectOptions'] });
    },
  });
}

// Optimistic update
export function useUpdateClient(currentFilters: ClientsFilters) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['clients', currentFilters] });

      const previousData = queryClient.getQueryData<PaginatedResponse<Client>>(['clients', currentFilters]);

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<Client>>(['clients', currentFilters], {
          ...previousData,
          items: previousData.items.map((client) =>
            client.clientId === id
              ? { ...client, ...data, updatedAt: new Date().toISOString() }
              : client
          ),
        });
      }

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['clients', currentFilters], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientSelectOptions'] });
    },
  });
}

// Optimistic delete
export function useDeleteClient(currentFilters: ClientsFilters) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClient,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['clients', currentFilters] });

      const previousData = queryClient.getQueryData<PaginatedResponse<Client>>(['clients', currentFilters]);

      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<Client>>(['clients', currentFilters], {
          ...previousData,
          items: previousData.items.filter((client) => client.clientId !== deletedId),
          total: previousData.total - 1,
        });
      }

      return { previousData };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['clients', currentFilters], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientSelectOptions'] });
    },
  });
}