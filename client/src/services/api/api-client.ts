import axios, { AxiosError, type AxiosResponse } from 'axios';

import { clearToken, getToken } from '../auth/token-storage.js';
import type { ApiEnvelope, ApiErrorEnvelope } from '../../types/domain.js';

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: `${baseURL}/api`,
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

export async function responseData<T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const response = await request;
  return response.data.data;
}

export function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
