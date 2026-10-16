import { z } from 'zod';

const optionalEnvValue = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const mongoUriSchema = z
  .string()
  .trim()
  .min(1, 'MONGO_URI is required')
  .refine((value) => {
    try {
      const uri = new URL(value);
      const isMongoProtocol = uri.protocol === 'mongodb:' || uri.protocol === 'mongodb+srv:';
      return isMongoProtocol && uri.hostname !== '';
    } catch {
      return false;
    }
  }, 'MONGO_URI must be a valid mongodb:// or mongodb+srv:// URI');

const clientUrlSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => new URL(value))
  .refine(
    (url) => url.protocol === 'http:' || url.protocol === 'https:',
    'CLIENT_URL must use http:// or https://',
  )
  .transform((url) => url.origin);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  MONGO_URI: mongoUriSchema,

  REDIS_URL: z
    .url()
    .refine(
      (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
      'REDIS_URL must use redis:// or rediss://',
    )
    .default('redis://127.0.0.1:6379'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CLIENT_URL: clientUrlSchema.default('http://localhost:5173'),

  API_BASE_URL: clientUrlSchema.default('http://localhost:5000'),

  JWT_SECRET: z.string().trim().min(32, 'JWT_SECRET must contain at least 32 characters'),

  JWT_EXPIRES_IN: z.string().default('7d'),

  GITHUB_TOKEN: optionalEnvValue,

  GOOGLE_CLIENT_ID: optionalEnvValue,
  GOOGLE_CLIENT_SECRET: optionalEnvValue,
  GITHUB_OAUTH_CLIENT_ID: optionalEnvValue,
  GITHUB_OAUTH_CLIENT_SECRET: optionalEnvValue,
  GITLAB_CLIENT_ID: optionalEnvValue,
  GITLAB_CLIENT_SECRET: optionalEnvValue,
  GITLAB_BASE_URL: clientUrlSchema.default('https://gitlab.com'),

  OPENAI_API_KEY: optionalEnvValue,

  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),

  LANGSMITH_API_KEY: optionalEnvValue,

  LANGSMITH_TRACING: z.enum(['true', 'false']).default('false'),

  LANGSMITH_PROJECT: z.string().default('CartoGraph'),
});

/**
 * Loads and exposes env configuration.
 */
class EnvConfig {
  public readonly nodeEnv: 'development' | 'test' | 'production';
  public readonly port: number;
  public readonly mongoUri: string;
  public readonly redisUrl: string;
  public readonly logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  public readonly clientUrl: string;
  public readonly apiBaseUrl: string;
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly githubToken: string | undefined;
  public readonly googleClientId: string | undefined;
  public readonly googleClientSecret: string | undefined;
  public readonly githubOAuthClientId: string | undefined;
  public readonly githubOAuthClientSecret: string | undefined;
  public readonly gitlabClientId: string | undefined;
  public readonly gitlabClientSecret: string | undefined;
  public readonly gitlabBaseUrl: string;
  public readonly openAiApiKey: string | undefined;
  public readonly openAiModel: string;
  public readonly langSmithApiKey: string | undefined;
  public readonly langSmithTracing: boolean;
  public readonly langSmithProject: string;

  /**
   * Initializes the env config instance.
   */
  constructor() {
    const rawEnv = {
      ...process.env,
      MONGO_URI:
        process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<password>')
          ? process.env.MONGODB_URI
          : process.env.MONGO_URI,
    };
    const result = envSchema.safeParse(rawEnv);

    if (!result.success) {
      console.error('Invalid environment configuration:');

      for (const issue of result.error.issues) {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
      }

      throw new Error('Invalid environment configuration');
    }

    this.nodeEnv = result.data.NODE_ENV;
    this.port = result.data.PORT;
    this.mongoUri = result.data.MONGO_URI;
    this.redisUrl = result.data.REDIS_URL;
    this.logLevel = result.data.LOG_LEVEL;
    this.clientUrl = result.data.CLIENT_URL;
    this.apiBaseUrl = result.data.API_BASE_URL;
    this.jwtSecret = result.data.JWT_SECRET;
    this.jwtExpiresIn = result.data.JWT_EXPIRES_IN;
    this.githubToken = result.data.GITHUB_TOKEN;
    this.googleClientId = result.data.GOOGLE_CLIENT_ID;
    this.googleClientSecret = result.data.GOOGLE_CLIENT_SECRET;
    this.githubOAuthClientId = result.data.GITHUB_OAUTH_CLIENT_ID;
    this.githubOAuthClientSecret = result.data.GITHUB_OAUTH_CLIENT_SECRET;
    this.gitlabClientId = result.data.GITLAB_CLIENT_ID;
    this.gitlabClientSecret = result.data.GITLAB_CLIENT_SECRET;
    this.gitlabBaseUrl = result.data.GITLAB_BASE_URL;
    this.openAiApiKey = result.data.OPENAI_API_KEY;
    this.openAiModel = result.data.OPENAI_MODEL;
    this.langSmithApiKey = result.data.LANGSMITH_API_KEY;
    this.langSmithTracing = result.data.LANGSMITH_TRACING === 'true';
    this.langSmithProject = result.data.LANGSMITH_PROJECT;
  }
}

export default EnvConfig;
