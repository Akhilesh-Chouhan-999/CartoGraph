import EnvConfig from './env.config.js';

/**
 * Provides optional LangSmith tracing configuration.
 */
class LangSmithConfig {
  public readonly apiKey: string | undefined;
  public readonly tracing: boolean;
  public readonly project: string;

  constructor(env = new EnvConfig()) {
    this.apiKey = env.langSmithApiKey;
    this.tracing = env.langSmithTracing;
    this.project = env.langSmithProject;
  }
}

export default LangSmithConfig;
