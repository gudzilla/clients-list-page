import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../../../api/axiosClient';
import type {
  Client,
  ClientsFilters,
  ClientsResponse,
  CreateClientDto,
  UpdateClientDto,
  ClientSelectOption,
} from '../types';

// API функции
async function fetchClients(filters: ClientsFilters): Promise<ClientsResponse> {
  const response = await apiClient.get<ClientsResponse>('/clients', {
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
  const response = await apiClient.get<ClientsResponse>('/clients', {
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
    placeholderData: keepPreviousData,
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

// Create client - простая мутация с инвалидацией кэша
export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientSelectOptions'] });
    }
  });
}

// Update client - простая мутация с инвалидацией кэша
export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientSelectOptions'] });
    }
  });
}

// Delete client - простая мутация с инвалидацией кэша
export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientSelectOptions'] });
    }
  });
}