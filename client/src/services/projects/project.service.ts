import { apiClient, responseData } from '../api/api-client.js';
import type { Analysis, ApiEnvelope, Project } from '../../types/domain.js';

export interface ProjectInput {
  name: string;
  githubUrl: string;
  defaultBranch?: string;
}

export const PROJECTS_CHANGED_EVENT = 'cartograph:projects-changed';

export const projectService = {
  list(): Promise<Project[]> {
    return responseData<Project[]>(apiClient.get<ApiEnvelope<Project[]>>('/projects'));
  },
  get(projectId: string): Promise<Project> {
    return responseData<Project>(apiClient.get<ApiEnvelope<Project>>(`/projects/${projectId}`));
  },
  create(input: ProjectInput): Promise<Project> {
    return responseData<Project>(apiClient.post<ApiEnvelope<Project>>('/projects', input));
  },
  update(projectId: string, input: Partial<ProjectInput>): Promise<Project> {
    return responseData<Project>(
      apiClient.patch<ApiEnvelope<Project>>(`/projects/${projectId}`, input),
    );
  },
  remove(projectId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}`).then(() => undefined);
  },
  analyses(projectId: string): Promise<Analysis[]> {
    return responseData<Analysis[]>(
      apiClient.get<ApiEnvelope<Analysis[]>>(`/projects/${projectId}/analyses`),
    );
  },
};
