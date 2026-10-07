import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

export const createAnalysisSchema = z.object({
  projectId: objectIdSchema,
  commitSha: z.string().regex(/^(?:[a-f\d]{40}|[a-f\d]{64})$/i, 'Invalid commit SHA'),
});

export const idParamsSchema = z.object({ id: objectIdSchema });
