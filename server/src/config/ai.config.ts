import EnvConfig from './env.config.js';

class AiConfig {
  public readonly apiKey: string | undefined;
  public readonly langSmithApiKey: string | undefined;
  public readonly tracing: boolean;
  public readonly project: string;
  public readonly model: string;

  constructor(env = new EnvConfig()) {
    this.apiKey = env.openAiApiKey;
    this.model = env.openAiModel;
    this.langSmithApiKey = env.langSmithApiKey;
    this.tracing = env.langSmithTracing;
    this.project = env.langSmithProject;
  }
}

export default AiConfig;
