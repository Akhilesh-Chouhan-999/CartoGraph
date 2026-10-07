import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, ChatAnswer, ChatMessage, ChatSession } from '../../types/domain.js';

export const chatService = {
  createSession(projectId: string, analysisId: string, title?: string): Promise<ChatSession> {
    return responseData(
      apiClient.post<ApiEnvelope<ChatSession>>('/chat/sessions', {
        projectId,
        analysisId,
        ...(title ? { title } : {}),
      }),
    );
  },
  getSession(sessionId: string): Promise<ChatSession> {
    return responseData<ChatSession>(
      apiClient.get<ApiEnvelope<ChatSession>>(`/chat/sessions/${sessionId}`),
    );
  },
  messages(sessionId: string): Promise<ChatMessage[]> {
    return responseData<ChatMessage[]>(
      apiClient.get<ApiEnvelope<ChatMessage[]>>(`/chat/sessions/${sessionId}/messages`),
    );
  },
  removeSession(sessionId: string): Promise<void> {
    return apiClient.delete(`/chat/sessions/${sessionId}`).then(() => undefined);
  },
  ask(analysisId: string, message: string, sessionId?: string): Promise<ChatAnswer> {
    return responseData(
      apiClient.post<ApiEnvelope<ChatAnswer>>(`/analyses/${analysisId}/chat`, {
        message,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
  },
};
