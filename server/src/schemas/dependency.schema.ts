import { z } from 'zod';

import { objectIdSchema } from './analysis.schema.js';

export const dependencyPathSchema = z.object({
  sourceFileId: objectIdSchema,
  targetFileId: objectIdSchema,
});
