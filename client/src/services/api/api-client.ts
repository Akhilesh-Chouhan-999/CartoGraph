import axios, { AxiosError, type AxiosResponse } from 'axios';

import { clearToken, getToken } from '../auth/token-storage.js';
import type { ApiEnvelope, ApiErrorEnvelope } from '../../types/domain.js';

const rawBase = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '');
const baseURL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
      if (error.response?.status === 401) {
        clearToken();
        window.dispatchEvent(new Event('cartograph:unauthorized'));
      }
      const message = error.response?.data?.message ?? error.message ?? 'Request failed';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);

/**
 * Unwraps the response payload from the standard API envelope.
 * @param request - The request to send or process.
 */
export async function responseData<T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const response = await request;
  return response.data.data;
}

/**
 * Extracts a readable message from an API error response.
 * @param error - The error to normalize or report.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
