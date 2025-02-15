import { Annotation, LangGraphRunnableConfig } from "@langchain/langgraph";
import { v4 as uuidv4 } from 'uuid';
export const ConfigurationAnnotation = Annotation.Root({
    userId: Annotation<string>(),
    sessionId: Annotation<string>(),
    runnableConfig: Annotation<LangGraphRunnableConfig>()
});

export type ConfigurationAnnotationType = typeof ConfigurationAnnotation.State;

export function ensureConfiguration(config?: LangGraphRunnableConfig) {
    const configurable = config?.configurable || {};
    return {
      userId: configurable?.userId || "default",
      sessionId: configurable?.sessionId || uuidv4(),

    };
  }