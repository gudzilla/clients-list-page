import axios, { AxiosError } from 'axios';
import type { BackendErrorResponse } from '../features/clients/types';

/**
 * Базовый клиент для запросов.
 * Использование централизованного клиента позволяет легко менять baseURL
 * и добавлять общие заголовки (например, Auth Token) в одном месте.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Интерцептор ответов.
 * КРИТИЧЕСКИЙ УЗЕЛ: Здесь происходит унификация ошибок.
 * Мы перехватываем ошибку бэкенда и "прокидываем" дальше только чистые данные ошибки (BackendErrorResponse).
 * Это позволяет в компонентах (например, ClientFormModal) не делать проверки на error.response.data,
 * а сразу работать с объектом ошибки.
 *
 * [REFACTOR]: Чтобы вынести логику обработки ошибок из компонентов (Point 3),
 * здесь можно добавить глобальный Toast-нотификатор для системных ошибок (500, 403).
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    // Если бэкенд вернул структурированную ошибку (наш контракт)
    if (error.response?.data && error.response.data.errorName) {
      return Promise.reject(error.response.data);
    }
    // Если это сетевая ошибка или ошибка без тела
    return Promise.reject(error);
  }
);
