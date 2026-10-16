import { z } from 'zod';

export const oauthProviderSchema = z.enum(['google', 'github', 'gitlab']);

export const oauthExchangeSchema = z.object({
  code: z.string().min(32).max(128),
  clientState: z.string().min(32).max(128),
});

export const oauthClientStateSchema = z.string().min(32).max(128);

export const oauthLinkSchema = z.object({
  clientState: oauthClientStateSchema,
});
