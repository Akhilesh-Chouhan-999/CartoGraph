import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, ChatAnswer, ChatMessage, ChatSession } from '../../types/domain.js';

export const chatService = {
  /**
   * Creates a chat session for the selected project and analysis.
   * @param projectId - The project identifier.
   * @param analysisId - The analysis identifier.
   * @param title - The title value used by this operation.
   */
  createSession(projectId: string, analysisId: string, title?: string): Promise<ChatSession> {
    return responseData(
      apiClient.post<ApiEnvelope<ChatSession>>('/chat/sessions', {
        projectId,
        analysisId,
        ...(title ? { title } : {}),
      }),
    );
  },
  /**
   * Retrieves a chat session after checking the requesting user owns its project.
   * @param sessionId - The chat session identifier.
   */
  getSession(sessionId: string): Promise<ChatSession> {
    return responseData<ChatSession>(
      apiClient.get<ApiEnvelope<ChatSession>>(`/chat/sessions/${sessionId}`),
    );
  },
  /**
   * Retrieves the messages saved in the selected chat session.
   * @param sessionId - The chat session identifier.
   */
  messages(sessionId: string): Promise<ChatMessage[]> {
    return responseData<ChatMessage[]>(
      apiClient.get<ApiEnvelope<ChatMessage[]>>(`/chat/sessions/${sessionId}/messages`),
    );
  },
  /**
   * Deletes a chat session and its saved conversation.
   * @param sessionId - The chat session identifier.
   */
  removeSession(sessionId: string): Promise<void> {
    return apiClient.delete(`/chat/sessions/${sessionId}`).then(() => undefined);
  },
  /**
   * Sends a repository question to the grounded AI agent and returns its answer.
   * @param analysisId - The analysis identifier.
   * @param message - The message content.
   * @param sessionId - The chat session identifier.
   */
  ask(analysisId: string, message: string, sessionId?: string): Promise<ChatAnswer> {
    return responseData(
      apiClient.post<ApiEnvelope<ChatAnswer>>(`/analyses/${analysisId}/chat`, {
        message,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
  },
};
