import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Client,
  ClientsFilters,
  PaginatedResponse,
  CreateClientDto,
  UpdateClientDto,
  ClientSelectOption,
} from '../types';

const BASE_URL = '/api/clients';

// API функции
async function fetchClients(filters: ClientsFilters): Promise<PaginatedResponse<Client>> {
  const params = new URLSearchParams();

  if (filters.query) params.set('query', filters.query);
  if (filters.parentClientId) params.set('parentClientId', filters.parentClientId);
  if (filters.regionId) params.set('regionId', filters.regionId);
  if (filters.partyType) params.set('partyType', filters.partyType);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) throw new Error('Ошибка загрузки клиентов');
  return response.json();
}

async function fetchClient(id: string): Promise<Client> {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) throw new Error('Клиент не найден');
  return response.json();
}

async function fetchClientSelectOptions(): Promise<ClientSelectOption[]> {
  const response = await fetch(`${BASE_URL}/select-options`);
  if (!response.ok) throw new Error('Ошибка загрузки списка клиентов');
  return response.json();
}

async function createClient(data: CreateClientDto): Promise<Client> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка создания клиента');
  return response.json();
}

async function updateClient({ id, data }: { id: string; data: UpdateClientDto }): Promise<Client> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка обновления клиента');
  return response.json();
}

async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
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
    staleTime: 0,
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
        id: `temp-${Date.now()}`,
        name: newClientData.name,
        fullName: newClientData.fullName || null,
        partyType: newClientData.partyType,
        inn: newClientData.inn || null,
        parentClientId: newClientData.parentClientId || null,
        regionId: newClientData.regionId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Добавляем в начало списка
      if (previousData) {
        queryClient.setQueryData<PaginatedResponse<Client>>(['clients', currentFilters], {
          ...previousData,
          data: [optimisticClient, ...previousData.data],
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
          data: previousData.data.map((client) =>
            client.id === id
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
          data: previousData.data.filter((client) => client.id !== deletedId),
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
