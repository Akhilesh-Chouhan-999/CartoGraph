import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  REDIS_URL: z
    .url()
    .refine(
      (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
      'REDIS_URL must use redis:// or rediss://',
    )
    .default('redis://127.0.0.1:6379'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),

  JWT_EXPIRES_IN: z.string().default('7d'),

  GITHUB_TOKEN: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),

  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),

  LANGSMITH_API_KEY: z.string().optional(),

  LANGSMITH_TRACING: z.enum(['true', 'false']).default('false'),

  LANGSMITH_PROJECT: z.string().default('CartoGraph'),
});

class EnvConfig {
  public readonly nodeEnv: 'development' | 'test' | 'production';
  public readonly port: number;
  public readonly mongoUri: string;
  public readonly redisUrl: string;
  public readonly logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  public readonly clientUrl: string;
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly githubToken: string | undefined;
  public readonly openAiApiKey: string | undefined;
  public readonly openAiModel: string;
  public readonly langSmithApiKey: string | undefined;
  public readonly langSmithTracing: boolean;
  public readonly langSmithProject: string;

  constructor() {
    const result = envSchema.safeParse(process.env);

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
    this.jwtSecret = result.data.JWT_SECRET;
    this.jwtExpiresIn = result.data.JWT_EXPIRES_IN;
    this.githubToken = result.data.GITHUB_TOKEN;
    this.openAiApiKey = result.data.OPENAI_API_KEY;
    this.openAiModel = result.data.OPENAI_MODEL;
    this.langSmithApiKey = result.data.LANGSMITH_API_KEY;
    this.langSmithTracing = result.data.LANGSMITH_TRACING === 'true';
    this.langSmithProject = result.data.LANGSMITH_PROJECT;
  }
}

export default EnvConfig;
