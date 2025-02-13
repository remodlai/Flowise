An example sAgent Subgraph:
```typescript
// Example of modernized Agent node (Agent/Agent.ts)
import { 
    StateGraph, 
    END, 
    MessagesAnnotation,
    createReactAgent,
    AgentState,
    addMessages
} from '@langchain/langgraph'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { StructuredTool } from '@langchain/core/tools'

class Agent_SeqAgents implements INode {
    // ... existing class properties ...

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<ISeqAgentNode> {
        const {
            tools,
            systemMessagePrompt: systemPrompt,
            humanMessagePrompt: humanPrompt,
            agentName,
            model: llm,
            interrupt
        } = nodeData.inputs;

        // Create agent-specific state
        interface AgentState {
            messages: BaseMessage[];
            tools_used: IUsedTool[];
            artifacts: ICommonObject[];
            source_documents: IDocument[];
        }

        // Create agent graph
        const agentGraph = new StateGraph<AgentState>({
            channels: {
                ...MessagesAnnotation,
                tools_used: [],
                artifacts: [],
                source_documents: []
            }
        });

        // Create ReAct agent using modern pattern
        const agent = await createReactAgent({
            llm,
            tools,
            systemMessage: systemPrompt
        });

        // Add agent execution node
        agentGraph.addNode("agent_executor", agent);

        if (tools?.length) {
            // Add tool execution node
            agentGraph.addNode("tool_executor", async (state) => {
                const lastMessage = state.messages[state.messages.length - 1];
                if (!lastMessage.tool_calls?.length) return state;

                const results = await Promise.all(
                    lastMessage.tool_calls.map(async (call) => {
                        const tool = tools.find(t => t.name === call.name);
                        const result = await tool.invoke(call.args);
                        return {
                            tool: call.name,
                            toolInput: call.args,
                            toolOutput: result
                        };
                    })
                );

                return {
                    ...state,
                    tools_used: [...state.tools_used, ...results]
                };
            });

            // Add conditional routing
            agentGraph.addConditionalEdges(
                "agent_executor",
                (state) => {
                    const lastMessage = state.messages[state.messages.length - 1];
                    return lastMessage.tool_calls?.length ? "tool_executor" : END;
                },
                {
                    tool_executor: "tool_executor",
                    [END]: END
                }
            );
        }

        // Add interrupt handling if enabled
        if (interrupt) {
            agentGraph.addInterruptBefore(
                "tool_executor",
                async (state) => {
                    const lastMessage = state.messages[state.messages.length - 1];
                    if (!lastMessage.tool_calls?.length) return state;

                    const toolNames = lastMessage.tool_calls.map(call => call.name).join(", ");
                    const approvalMessage = `Do you want to proceed with using tools: ${toolNames}?`;

                    return {
                        ...state,
                        messages: addMessages(state.messages, [
                            new AIMessage({ content: approvalMessage })
                        ]),
                        should_interrupt: true
                    };
                }
            );
        }

        // Compile agent graph
        const compiledGraph = agentGraph.compile();

        // Return node interface that works with Flowise
        return {
            id: nodeData.id,
            name: agentName,
            type: 'agent',
            graph: compiledGraph,
            execute: async (state: ISeqAgentsState) => {
                const result = await compiledGraph.invoke({
                    messages: state.messages,
                    tools_used: [],
                    artifacts: [],
                    source_documents: []
                });

                return {
                    messages: result.messages,
                    tools_used: result.tools_used,
                    artifacts: result.artifacts,
                    source_documents: result.source_documents
                };
            }
        };
    }
}

// Example of modernized LLM node (LLMNode/LLMNode.ts)
class LLMNode_SeqAgents implements INode {
    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<ISeqAgentNode> {
        const {
            llm,
            systemPrompt,
            humanPrompt
        } = nodeData.inputs;

        // Create LLM-specific graph
        const llmGraph = new StateGraph({
            channels: MessagesAnnotation
        });

        // Add LLM processing node
        llmGraph.addNode("llm_processor", async (state) => {
            const messages = [
                ...(systemPrompt ? [new SystemMessage(systemPrompt)] : []),
                ...state.messages,
                ...(humanPrompt ? [new HumanMessage(humanPrompt)] : [])
            ];

            const result = await llm.invoke(messages);

            return {
                messages: addMessages(state.messages, [result])
            };
        });

        // Compile LLM graph
        const compiledGraph = llmGraph.compile();

        return {
            id: nodeData.id,
            name: nodeData.inputs.llmNodeName,
            type: 'llm',
            graph: compiledGraph,
            execute: async (state: ISeqAgentsState) => {
                return await compiledGraph.invoke({
                    messages: state.messages
                });
            }
        };
    }
}
```
