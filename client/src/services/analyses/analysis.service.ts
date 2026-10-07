import { apiClient, responseData } from '../api/api-client.js';
import type {
  Analysis,
  AnalysisStatusInfo,
  ApiEnvelope,
  ProjectStats,
} from '../../types/domain.js';

export const analysisService = {
  create(projectId: string, commitSha: string): Promise<{ analysisId: string }> {
    return responseData<{ analysisId: string }>(
      apiClient.post<ApiEnvelope<{ analysisId: string }>>('/analyses', { projectId, commitSha }),
    );
  },
  get(analysisId: string): Promise<Analysis> {
    return responseData<Analysis>(apiClient.get<ApiEnvelope<Analysis>>(`/analyses/${analysisId}`));
  },
  status(analysisId: string): Promise<AnalysisStatusInfo> {
    return responseData<AnalysisStatusInfo>(
      apiClient.get<ApiEnvelope<AnalysisStatusInfo>>(`/analyses/${analysisId}/status`),
    );
  },
  stats(analysisId: string): Promise<ProjectStats> {
    return responseData<ProjectStats>(
      apiClient.get<ApiEnvelope<ProjectStats>>(`/analyses/${analysisId}/stats`),
    );
  },
};
