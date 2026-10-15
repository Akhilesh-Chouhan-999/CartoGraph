import { Types } from 'mongoose';

import { AppError } from '../errors/index.js';
import { ProjectRepository } from '../repositories/index.js';
import GitHubUrlUtil from '../utils/github-url.util.js';

/**
 * Coordinates project application logic.
 */
class ProjectService {
  private readonly projects = new ProjectRepository();
  private readonly urls = new GitHubUrlUtil();

  /**
   * Creates project data from the supplied input.
   * @param userId - The user identifier.
   * @param input - The input value to process.
   */
  public async createProject(
    userId: string,
    input: {
      name: string;
      githubUrl: string;
      defaultBranch?: string;
    },
  ) {
    const address = this.urls.parse(input.githubUrl);
    return this.projects.create({
      userId: new Types.ObjectId(userId),
      name: input.name,
      githubUrl: input.githubUrl,
      owner: address.owner,
      repository: address.repository,
      defaultBranch: input.defaultBranch ?? 'main',
    });
  }

  /**
   * Retrieves project data for the supplied criteria.
   * @param userId - The user identifier.
   * @param projectId - The project identifier.
   */
  public async getProject(userId: string, projectId: string) {
    const project = await this.projects.findById(projectId);
    if (project === null) throw new AppError('Project not found', 404);
    this.assertOwner(project.userId.toString(), userId);
    return project;
  }

  /**
   * Retrieves project data for the supplied criteria.
   * @param userId - The user identifier.
   */
  public async getUserProjects(userId: string) {
    return this.projects.findByUserId(userId);
  }

  /**
   * Updates project data with the supplied changes.
   * @param userId - The user identifier.
   * @param projectId - The project identifier.
   * @param input - The input value to process.
   */
  public async updateProject(
    userId: string,
    projectId: string,
    input: {
      name?: string;
      githubUrl?: string;
      defaultBranch?: string;
    },
  ) {
    const project = await this.getProject(userId, projectId);
    const address = input.githubUrl === undefined ? undefined : this.urls.parse(input.githubUrl);
    const patch = {
      ...input,
      ...(address === undefined ? {} : { owner: address.owner, repository: address.repository }),
    };
    const updated = await this.projects.updateById(project._id.toString(), patch);
    if (updated === null) throw new AppError('Project not found', 404);
    return updated;
  }

  /**
   * Removes the requested project data.
   * @param userId - The user identifier.
   * @param projectId - The project identifier.
   */
  public async deleteProject(userId: string, projectId: string): Promise<void> {
    const project = await this.getProject(userId, projectId);
    await this.projects.deleteById(project._id.toString());
  }

  /**
   * Verifies that the authenticated user owns the requested project.
   * @param ownerId - The owner id value used by this operation.
   * @param userId - The user identifier.
   */
  private assertOwner(ownerId: string, userId: string): void {
    if (ownerId !== userId) throw new AppError('Forbidden', 403);
  }
}

export default ProjectService;
