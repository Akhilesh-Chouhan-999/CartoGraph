import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, BlastRadius, DependencyPath, GraphData } from '../../types/domain.js';

export const graphService = {
  get(analysisId: string): Promise<GraphData> {
    return responseData<GraphData>(
      apiClient.get<ApiEnvelope<GraphData>>(`/analyses/${analysisId}/graph`),
    );
  },
  path(analysisId: string, sourceFileId: string, targetFileId: string): Promise<DependencyPath> {
    return responseData<DependencyPath>(
      apiClient.post<ApiEnvelope<DependencyPath>>(`/analyses/${analysisId}/path`, {
        sourceFileId,
        targetFileId,
      }),
    );
  },
  blastRadius(analysisId: string, fileId: string): Promise<BlastRadius> {
    return responseData<BlastRadius>(
      apiClient.get<ApiEnvelope<BlastRadius>>(
        `/analyses/${analysisId}/files/${fileId}/blast-radius`,
      ),
    );
  },
};
