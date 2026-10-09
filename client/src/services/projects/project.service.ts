import { apiClient, responseData } from '../api/api-client.js';
import type { Analysis, ApiEnvelope, Project } from '../../types/domain.js';

export interface ProjectInput {
  name: string;
  githubUrl: string;
  defaultBranch?: string;
}

export const PROJECTS_CHANGED_EVENT = 'cartograph:projects-changed';

export const projectService = {
  /**
   * Lists project records available to the current user.
   */
  list(): Promise<Project[]> {
    return responseData<Project[]>(apiClient.get<ApiEnvelope<Project[]>>('/projects'));
  },
  /**
   * Retrieves the selected project record.
   * @param projectId - The project identifier.
   */
  get(projectId: string): Promise<Project> {
    return responseData<Project>(apiClient.get<ApiEnvelope<Project>>(`/projects/${projectId}`));
  },
  /**
   * Creates a project record from the validated input.
   * @param input - The input value to process.
   */
  create(input: ProjectInput): Promise<Project> {
    return responseData<Project>(apiClient.post<ApiEnvelope<Project>>('/projects', input));
  },
  /**
   * Applies the supplied changes to the selected project.
   * @param projectId - The project identifier.
   * @param input - The input value to process.
   */
  update(projectId: string, input: Partial<ProjectInput>): Promise<Project> {
    return responseData<Project>(
      apiClient.patch<ApiEnvelope<Project>>(`/projects/${projectId}`, input),
    );
  },
  /**
   * Removes the selected project record.
   * @param projectId - The project identifier.
   */
  remove(projectId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}`).then(() => undefined);
  },
  /**
   * Retrieves the analysis history for the selected project.
   * @param projectId - The project identifier.
   */
  analyses(projectId: string): Promise<Analysis[]> {
    return responseData<Analysis[]>(
      apiClient.get<ApiEnvelope<Analysis[]>>(`/projects/${projectId}/analyses`),
    );
  },
};
