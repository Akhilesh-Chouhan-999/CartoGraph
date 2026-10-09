import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, AuthResult, SafeUser } from '../../types/domain.js';

export const authService = {
  /**
   * Authenticates the supplied email and password and returns the signed-in user.
   * @param email - The user email address.
   * @param password - The plaintext password to verify or hash.
   */
  login(email: string, password: string): Promise<AuthResult> {
    return responseData<AuthResult>(
      apiClient.post<ApiEnvelope<AuthResult>>('/auth/login', { email, password }),
    );
  },
  /**
   * Creates a user account after validating that the email is available.
   * @param name - The name value used by this operation.
   * @param email - The user email address.
   * @param password - The plaintext password to verify or hash.
   */
  register(name: string, email: string, password: string): Promise<AuthResult> {
    return responseData<AuthResult>(
      apiClient.post<ApiEnvelope<AuthResult>>('/auth/register', { name, email, password }),
    );
  },
  /**
   * Fetches the currently authenticated user profile.
   */
  me(): Promise<SafeUser> {
    return responseData<SafeUser>(apiClient.get<ApiEnvelope<SafeUser>>('/auth/me'));
  },
  /**
   * Ends the current user session and clears saved credentials.
   */
  logout(): Promise<{ message: string }> {
    return responseData<{ message: string }>(
      apiClient.post<ApiEnvelope<{ message: string }>>('/auth/logout'),
    );
  },
};
