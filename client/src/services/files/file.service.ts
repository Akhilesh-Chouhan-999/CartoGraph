import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, DependencyRecord, FileRecord } from '../../types/domain.js';

export const fileService = {
  /**
   * Lists file records available to the current user.
   * @param analysisId - The analysis identifier.
   */
  list(analysisId: string): Promise<FileRecord[]> {
    return responseData<FileRecord[]>(
      apiClient.get<ApiEnvelope<FileRecord[]>>(`/analyses/${analysisId}/files`),
    );
  },
  /**
   * Retrieves the selected file record.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  get(analysisId: string, fileId: string): Promise<FileRecord> {
    return responseData<FileRecord>(
      apiClient.get<ApiEnvelope<FileRecord>>(`/analyses/${analysisId}/files/${fileId}`),
    );
  },
  /**
   * Retrieves dependency edges originating from the selected file.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  dependencies(analysisId: string, fileId: string): Promise<DependencyRecord[]> {
    return responseData<DependencyRecord[]>(
      apiClient.get<ApiEnvelope<DependencyRecord[]>>(
        `/analyses/${analysisId}/files/${fileId}/dependencies`,
      ),
    );
  },
  /**
   * Finds direct and transitive files that depend on the specified node.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  dependents(analysisId: string, fileId: string): Promise<DependencyRecord[]> {
    return responseData<DependencyRecord[]>(
      apiClient.get<ApiEnvelope<DependencyRecord[]>>(
        `/analyses/${analysisId}/files/${fileId}/dependents`,
      ),
    );
  },
};
