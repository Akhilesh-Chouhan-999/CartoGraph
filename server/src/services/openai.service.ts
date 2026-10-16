import { ChatOpenAI } from '@langchain/openai';

import OpenAiConfig from '../config/openai.config.js';
import { AppError } from '../errors/index.js';

/**
 * Creates configured OpenAI chat models for the repository agent.
 */
class OpenAiService {
  private readonly config = new OpenAiConfig();

  public createChatModel(): ChatOpenAI {
    if (!this.config.apiKey) throw new AppError('AI chat is not configured', 503);
    return new ChatOpenAI({
      apiKey: this.config.apiKey,
      model: this.config.model,
      temperature: 0,
    });
  }
}

export default OpenAiService;
