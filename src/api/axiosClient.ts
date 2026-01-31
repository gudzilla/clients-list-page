import axios, { AxiosError } from 'axios';
import type { BackendErrorResponse } from '../features/clients/types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    // Если есть ответ от сервера и он соответствует нашему формату ошибок
    if (error.response?.data && error.response.data.errorName) {
      // Прокидываем данные ошибки дальше, чтобы их было удобно читать в catch
      return Promise.reject(error.response.data);
    }
    // Иначе прокидываем исходную ошибку (сеть, 500 без тела и т.д.)
    return Promise.reject(error);
  }
);
