import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { apiClient } from '../../../api/axiosClient';
import type {
  Client,
  ClientsFilters,
  ClientsResponse,
  CreateClient,
  UpdateClient,
  ParentClientOption,
  ClientsApiParams,
} from '../types';

async function fetchClients(filters: ClientsFilters): Promise<ClientsResponse> {
  const { page = 1, pageSize = 20, ...rest } = filters;
  const apiParams: ClientsApiParams = {
    ...rest,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };

  const response = await apiClient.get<ClientsResponse>('/clients', {
    params: apiParams,
  });
  return response.data;
}

async function fetchClient(id: string): Promise<Client> {
  const response = await apiClient.get<Client>(`/clients/${id}`);
  return response.data;
}

async function fetchParentClientOptions(): Promise<ParentClientOption[]> {
  const response = await apiClient.get<ClientsResponse>('/clients', {
    params: { limit: 20 },
  });

  return response.data.items.map((client) => ({
    clientId: client.clientId,
    name: client.name,
  }));
}

async function createClient(data: CreateClient): Promise<Client> {
  const response = await apiClient.post<Client>('/clients', data);
  return response.data;
}

async function updateClient({
  id,
  data,
}: {
  id: string;
  data: UpdateClient;
}): Promise<Client> {
  const response = await apiClient.patch<Client>(`/clients/${id}`, data);
  return response.data;
}

async function deleteClient(id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}

export function useClients(filters: ClientsApiParams) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => fetchClients(filters),
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => {
      if (!id) throw new Error('Unexpected: id is missing');
      return fetchClient(id);
    },
    enabled: !!id,
  });
}

export function useParentClientOptions() {
  return useQuery({
    queryKey: ['parent-client-options'],
    queryFn: fetchParentClientOptions,
    enabled: false,
    gcTime: 0,
    staleTime: 0,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
