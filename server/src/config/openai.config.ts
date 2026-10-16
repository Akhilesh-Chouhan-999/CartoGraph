import EnvConfig from './env.config.js';

/**
 * Provides OpenAI model configuration.
 */
class OpenAiConfig {
  public readonly apiKey: string | undefined;
  public readonly model: string;

  constructor(env = new EnvConfig()) {
    this.apiKey = env.openAiApiKey;
    this.model = env.openAiModel;
  }
}

export default OpenAiConfig;
