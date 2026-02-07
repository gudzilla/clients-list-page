import axios, { AxiosError } from 'axios';
import type { BackendErrorResponse } from '../features/clients/types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Унификация ошибок бэкенда.
 * Прокидывает типизированный BackendErrorResponse для обработки в компонентах.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    if (error.response?.data && error.response.data.errorName) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);
