import { z } from 'zod';

import { objectIdSchema } from './analysis.schema.js';

export const fileParamsSchema = z.object({ id: objectIdSchema, fileId: objectIdSchema });
export const analysisIdQuerySchema = z.object({ analysisId: objectIdSchema });
export const fileIdParamsSchema = z.object({ fileId: objectIdSchema });
