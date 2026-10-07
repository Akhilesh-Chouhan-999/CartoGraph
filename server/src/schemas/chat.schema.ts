import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  sessionId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
});

export const createChatSessionSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i),
  analysisId: z.string().regex(/^[a-f\d]{24}$/i),
  title: z.string().trim().max(120).optional(),
});
