import { z } from 'zod';

const githubUrl = z.url().refine((input) => {
  try {
    const url = new URL(input);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      url.username === '' &&
      url.password === '' &&
      url.port === '' &&
      url.search === '' &&
      url.hash === '' &&
      url.pathname.split('/').filter(Boolean).length === 2
    );
  } catch {
    return false;
  }
}, 'Must be a public GitHub repository URL');

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  githubUrl,
  defaultBranch: z.string().trim().min(1).max(255).default('main'),
});

export const updateProjectSchema = createProjectSchema.partial();
