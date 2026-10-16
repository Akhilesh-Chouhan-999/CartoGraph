import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import LangSmithService from '../services/langsmith.service.js';
import OpenAiService from '../services/openai.service.js';
import { GraphTools } from './graph.tools.js';
import { CARTOGRAPH_CONTEXT_PROMPT } from './prompts.js';
import type AnalysisService from '../services/analysis.service.js';

/**
 * Coordinates grounded AI responses for carto graph.
 */
class CartoGraphAgent {
  private readonly openAi = new OpenAiService();
  private readonly langSmith = new LangSmithService();
  private readonly graphTools: GraphTools;

  /**
   * Initializes the carto graph agent instance.
   * @param analysisService - The analysis service value used by this operation.
   */
  constructor(analysisService: AnalysisService) {
    this.graphTools = new GraphTools(analysisService);
  }

  /**
   * Produces a response to the supplied carto graph request.
   * @param input - The input value to process.
   */
  public async answer(input: {
    analysisId: string;
    userId: string;
    question: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  }): Promise<{ answer: string; citations: { path: string }[] }> {
    const usedPaths = new Set<string>();
    const tools = this.graphTools.create(input.analysisId, input.userId, (path) =>
      usedPaths.add(path),
    );
    const model = this.openAi.createChatModel().bindTools(tools);
    /**
     * Invokes the LangGraph agent with the supplied conversation state.
     */
    const callAgent = async (state: typeof MessagesAnnotation.State) => ({
      messages: [await model.invoke(state.messages)],
    });
    const workflow = new StateGraph(MessagesAnnotation)
      .addNode('agent', callAgent)
      .addNode('tools', new ToolNode(tools))
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', (state) => {
        const last = state.messages.at(-1);
        return last !== undefined &&
          'tool_calls' in last &&
          Array.isArray(last.tool_calls) &&
          last.tool_calls.length > 0
          ? 'tools'
          : END;
      })
      .addEdge('tools', 'agent')
      .compile();
    const history = (input.history ?? [])
      .slice(-12)
      .map((message) =>
        message.role === 'assistant'
          ? new AIMessage(message.content)
          : new HumanMessage(message.content),
      );
    const result = await workflow.invoke(
      {
        messages: [
          new SystemMessage(CARTOGRAPH_CONTEXT_PROMPT),
          ...history,
          new HumanMessage(input.question),
        ],
      },
      { callbacks: this.langSmith.getCallbacks() },
    );
    const finalMessage = result.messages.at(-1);
    const answer =
      typeof finalMessage?.content === 'string'
        ? finalMessage.content
        : 'I could not verify an answer from the available repository data.';
    return { answer, citations: [...usedPaths].sort().map((path) => ({ path })) };
  }
}

export default CartoGraphAgent;
