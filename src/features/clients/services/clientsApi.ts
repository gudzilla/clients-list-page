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
} from '../types';

/**
 * ФУНКЦИИ-ФЕТЧЕРЫ
 * Инкапсулируют логику запросов.
 * Возвращают чистые данные (response.data), так как axios-интерцептор
 * уже обработал потенциальные ошибки.
 */
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

/**
 * Метод для получения списка для селекта.
 * Ограничиваем limit=20 для скорости, так как это вспомогательные данные.
 */
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

/**
 * ХУКИ ДЛЯ ТАБЛИЦЫ
 */
export function useClients(filters: ClientsFilters) {
  return useQuery({
    // Query Key включает фильтры: при изменении любого параметра (поиск, страница),
    // React Query автоматически запустит новый fetch.
    queryKey: ['clients', filters],
    queryFn: () => fetchClients(filters),
    // keepPreviousData: Позволяет не показывать лоадер "на всё окно" при переключении страниц,
    // оставляя старые данные в таблице, пока грузятся новые.
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
    enabled: !!id, // Запрос не уйдет, пока нет ID
  });
}

/**
 * ХУК ДЛЯ ДИНАМИЧЕСКОГО СЕЛЕКТА
 * [MVP STRATEGY]: Запрос заблокирован по дефолту (enabled: false).
 * Мы вызываем refetch() только при открытии выпадающего списка (onOpen).
 * Это гарантирует актуальность данных без лишней нагрузки на бэк.
 */
export function useParentClientOptions() {
  return useQuery({
    queryKey: ['parent-client-options'],
    queryFn: fetchParentClientOptions,
    enabled: false,
    gcTime: 0, // Не храним в кэше долго, так как данные должны быть свежими
    staleTime: 0,
  });
}

/**
 * МУТАЦИИ (CUD - Create, Update, Delete)
 * После успешного изменения данных мы "инвалидируем" ключ 'clients'.
 * Это заставляет таблицу автоматически перезапроситься, чтобы показать изменения
 * с учетом текущей серверной сортировки.
 */
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
      // Также инвалидируем конкретного клиента, если он где-то отображается отдельно
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
