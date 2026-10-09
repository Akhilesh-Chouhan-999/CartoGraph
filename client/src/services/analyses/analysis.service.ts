import { apiClient, responseData } from '../api/api-client.js';
import type {
  Analysis,
  AnalysisStatusInfo,
  ApiEnvelope,
  ProjectStats,
} from '../../types/domain.js';

export const analysisService = {
  /**
   * Creates a analysis record from the validated input.
   * @param projectId - The project identifier.
   * @param commitSha - The exact commit SHA to analyze.
   */
  create(projectId: string, commitSha: string): Promise<{ analysisId: string }> {
    return responseData<{ analysisId: string }>(
      apiClient.post<ApiEnvelope<{ analysisId: string }>>('/analyses', { projectId, commitSha }),
    );
  },
  /**
   * Retrieves the selected analysis record.
   * @param analysisId - The analysis identifier.
   */
  get(analysisId: string): Promise<Analysis> {
    return responseData<Analysis>(apiClient.get<ApiEnvelope<Analysis>>(`/analyses/${analysisId}`));
  },
  /**
   * Retrieves the current status of the analysis.
   * @param analysisId - The analysis identifier.
   */
  status(analysisId: string): Promise<AnalysisStatusInfo> {
    return responseData<AnalysisStatusInfo>(
      apiClient.get<ApiEnvelope<AnalysisStatusInfo>>(`/analyses/${analysisId}/status`),
    );
  },
  /**
   * Retrieves file and dependency counts for the analysis.
   * @param analysisId - The analysis identifier.
   */
  stats(analysisId: string): Promise<ProjectStats> {
    return responseData<ProjectStats>(
      apiClient.get<ApiEnvelope<ProjectStats>>(`/analyses/${analysisId}/stats`),
    );
  },
};
