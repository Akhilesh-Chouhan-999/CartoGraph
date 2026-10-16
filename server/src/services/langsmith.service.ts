import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';

import LangSmithConfig from '../config/langsmith.config.js';

/**
 * Creates optional LangSmith callbacks for tracing chat runs.
 */
class LangSmithService {
  private readonly config = new LangSmithConfig();

  public getCallbacks(): LangChainTracer[] {
    if (!this.config.tracing || !this.config.apiKey) return [];
    return [new LangChainTracer({ projectName: this.config.project })];
  }
}

export default LangSmithService;
