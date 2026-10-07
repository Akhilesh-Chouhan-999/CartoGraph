import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, AuthResult, SafeUser } from '../../types/domain.js';

export const authService = {
  login(email: string, password: string): Promise<AuthResult> {
    return responseData<AuthResult>(
      apiClient.post<ApiEnvelope<AuthResult>>('/auth/login', { email, password }),
    );
  },
  register(name: string, email: string, password: string): Promise<AuthResult> {
    return responseData<AuthResult>(
      apiClient.post<ApiEnvelope<AuthResult>>('/auth/register', { name, email, password }),
    );
  },
  me(): Promise<SafeUser> {
    return responseData<SafeUser>(apiClient.get<ApiEnvelope<SafeUser>>('/auth/me'));
  },
  logout(): Promise<{ message: string }> {
    return responseData<{ message: string }>(
      apiClient.post<ApiEnvelope<{ message: string }>>('/auth/logout'),
    );
  },
};
