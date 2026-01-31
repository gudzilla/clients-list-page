import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/axiosClient';
import type {
  Client,
  ClientsFilters,
  PaginatedResponse,
  CreateClientDto,
  UpdateClientDto,
  ClientSelectOption,
} from '../types';

// API функции
async function fetchClients(filters: ClientsFilters): Promise<PaginatedResponse<Client>> {
  const response = await apiClient.get<PaginatedResponse<Client>>('/clients', {
    params: filters,
  });
  return response.data;
}

async function fetchClient(id: string): Promise<Client> {
  const response = await apiClient.get<Client>(`/clients/${id}`);
  return response.data;
}

async function fetchClientSelectOptions(): Promise<ClientSelectOption[]> {
  // Используем общий список для селекта, запрашиваем достаточное количество
  const response = await apiClient.get<PaginatedResponse<Client>>('/clients', {
    params: { limit: 100 },
  });
  
  return response.data.items.map((client) => ({
    clientId: client.clientId,
    name: client.name,
  }));
}

async function createClient(data: CreateClientDto): Promise<Client> {
  const response = await apiClient.post<Client>('/clients', data);
  return response.data;
}

async function updateClient({ id, data }: { id: string; data: UpdateClientDto }): Promise<Client> {
  const response = await apiClient.patch<Client>(`/clients/${id}`, data);
  return response.data;
}

async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
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