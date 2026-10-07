import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, DependencyRecord, FileRecord } from '../../types/domain.js';

export const fileService = {
  list(analysisId: string): Promise<FileRecord[]> {
    return responseData<FileRecord[]>(
      apiClient.get<ApiEnvelope<FileRecord[]>>(`/analyses/${analysisId}/files`),
    );
  },
  get(analysisId: string, fileId: string): Promise<FileRecord> {
    return responseData<FileRecord>(
      apiClient.get<ApiEnvelope<FileRecord>>(`/analyses/${analysisId}/files/${fileId}`),
    );
  },
  dependencies(analysisId: string, fileId: string): Promise<DependencyRecord[]> {
    return responseData<DependencyRecord[]>(
      apiClient.get<ApiEnvelope<DependencyRecord[]>>(
        `/analyses/${analysisId}/files/${fileId}/dependencies`,
      ),
    );
  },
  dependents(analysisId: string, fileId: string): Promise<DependencyRecord[]> {
    return responseData<DependencyRecord[]>(
      apiClient.get<ApiEnvelope<DependencyRecord[]>>(
        `/analyses/${analysisId}/files/${fileId}/dependents`,
      ),
    );
  },
};
