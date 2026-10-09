import { apiClient, responseData } from '../api/api-client.js';
import type { ApiEnvelope, BlastRadius, DependencyPath, GraphData } from '../../types/domain.js';

export const graphService = {
  /**
   * Retrieves the selected graph record.
   * @param analysisId - The analysis identifier.
   */
  get(analysisId: string): Promise<GraphData> {
    return responseData<GraphData>(
      apiClient.get<ApiEnvelope<GraphData>>(`/analyses/${analysisId}/graph`),
    );
  },
  /**
   * Finds the shortest verified dependency path between two files.
   * @param analysisId - The analysis identifier.
   * @param sourceFileId - The source file identifier.
   * @param targetFileId - The target file identifier.
   */
  path(analysisId: string, sourceFileId: string, targetFileId: string): Promise<DependencyPath> {
    return responseData<DependencyPath>(
      apiClient.post<ApiEnvelope<DependencyPath>>(`/analyses/${analysisId}/path`, {
        sourceFileId,
        targetFileId,
      }),
    );
  },
  /**
   * Retrieves the direct and transitive impact of changing a file.
   * @param analysisId - The analysis identifier.
   * @param fileId - The file identifier.
   */
  blastRadius(analysisId: string, fileId: string): Promise<BlastRadius> {
    return responseData<BlastRadius>(
      apiClient.get<ApiEnvelope<BlastRadius>>(
        `/analyses/${analysisId}/files/${fileId}/blast-radius`,
      ),
    );
  },
};
