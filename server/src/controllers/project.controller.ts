import type { RequestHandler } from 'express';

import { AppError } from '../errors/index.js';
import { createProjectSchema, updateProjectSchema } from '../schemas/index.js';
import ProjectService from '../services/project.service.js';
import { idParamsSchema } from '../schemas/index.js';

/**
 * Handles HTTP requests for project operations.
 */
class ProjectController {
  private readonly projects = new ProjectService();

  /**
   * Creates a project record from the validated input.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public create: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const project = await this.projects.createProject(userId, createProjectSchema.parse(req.body));
    res.status(201).json({ success: true, data: project });
  };

  /**
   * Lists project records available to the current user.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public list: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    res.json({ success: true, data: await this.projects.getUserProjects(userId) });
  };

  /**
   * Retrieves the selected project record.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public get: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    res.json({ success: true, data: await this.projects.getProject(userId, id) });
  };

  /**
   * Applies the supplied changes to the selected project.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public update: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    const input = updateProjectSchema.parse(req.body);
    const patch = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.githubUrl === undefined ? {} : { githubUrl: input.githubUrl }),
      ...(input.defaultBranch === undefined ? {} : { defaultBranch: input.defaultBranch }),
    };
    res.json({ success: true, data: await this.projects.updateProject(userId, id, patch) });
  };

  /**
   * Removes the selected project record.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   */
  public remove: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (userId === undefined) throw new AppError('Authentication required', 401);
    const { id } = idParamsSchema.parse(req.params);
    await this.projects.deleteProject(userId, id);
    res.status(204).end();
  };
}

export default ProjectController;
