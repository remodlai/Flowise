```typescript
import { 
    StateGraph, 
    END, 
    START,
    Annotation, 
    MessagesAnnotation, 
    MessagesState,
    addMessages 
} from '@langchain/langgraph'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { ToolCall } from '@langchain/core/tools'

// 1. Define proper state interface
interface FlowiseState extends MessagesState {
    current_node: string;
    next_node: string | typeof END;
    tools_used: ToolCall[];
    artifacts: any[];
    source_documents: Document[];
    memory: Record<string, any>;
}

// 2. Define state annotations (this is how LangGraph actually manages state)
const FlowiseStateAnnotations = {
    ...MessagesAnnotation,  // Include built-in message handling
    current_node: new Annotation({
        name: "current_node",
        default: START
    }),
    next_node: new Annotation({
        name: "next_node",
        default: START
    }),
    tools_used: new Annotation({
        name: "tools_used",
        default: [],
        reducer: (x: ToolCall[], y: ToolCall[]) => [...x, ...y]
    }),
    artifacts: new Annotation({
        name: "artifacts",
        default: [],
        reducer: (x: any[], y: any[]) => [...x, ...y]
    }),
    source_documents: new Annotation({
        name: "source_documents",
        default: [],
        reducer: (x: Document[], y: Document[]) => [...x, ...y]
    }),
    memory: new Annotation({
        name: "memory",
        default: {},
        reducer: (x: Record<string, any>, y: Record<string, any>) => ({...x, ...y})
    })
}

export const buildAgentGraph = async ({
    agentflow,
    flowConfig,
    incomingInput,
    nodes,
    edges,
    initializedNodes,
    depthQueue,
    chatHistory,
    ...options
}: BuildAgentGraphParams) => {
    try {
        // 3. Create graph with proper state definition
        const graph = new StateGraph<FlowiseState>({
            channels: FlowiseStateAnnotations
        });

        // 4. Get and validate start node
        const startNode = initializedNodes.find(node => node.data.name === 'seqStart');
        if (!startNode) throw new Error('Start node required');

        // 5. Initialize start node with proper state handling
        graph.addNode(START, async (state: FlowiseState, config: RunnableConfig) => {
            const result = await startNode.data.instance.execute(state, config);
            return {
                ...state,
                messages: addMessages(state.messages, result.messages),
                next_node: result.next_node
            };
        });

        // 6. Process nodes in dependency order
        for (const nodeId of getSortedDepthNodes(depthQueue)) {
            const node = initializedNodes.find(n => n.id === nodeId);
            if (!node) continue;

            // 7. Add node with proper state management
            graph.addNode(node.data.instance.name, async (state: FlowiseState, config: RunnableConfig) => {
                // Update current node in state
                state.current_node = node.data.instance.name;

                // Handle interrupts if configured
                if (node.data.inputs?.interrupt) {
                    const shouldInterrupt = await checkForInterrupt(state, node);
                    if (shouldInterrupt) {
                        return {
                            ...state,
                            next_node: `${node.data.instance.name}_interrupt`
                        };
                    }
                }

                // Execute node logic
                const result = await node.data.instance.execute(state, config);

                // Return updated state using proper reducers
                return {
                    ...state,
                    messages: addMessages(state.messages, result.messages),
                    tools_used: [...state.tools_used, ...(result.tools_used || [])],
                    artifacts: [...state.artifacts, ...(result.artifacts || [])],
                    source_documents: [...state.source_documents, ...(result.source_documents || [])],
                    next_node: result.next_node
                };
            });

            // 8. Add edges based on node type
            if (node.data.name === 'seqCondition') {
                // Handle conditional routing
                graph.addConditionalEdges(
                    node.data.instance.name,
                    async (state: FlowiseState) => {
                        const result = await node.data.instance.getNextNode(state);
                        return result.next_node;
                    },
                    node.data.instance.getRoutes()
                );
            } else if (node.data.name === 'seqToolNode') {
                // Handle tool node routing
                graph.addConditionalEdges(
                    node.data.instance.name,
                    (state: FlowiseState) => {
                        const lastMessage = state.messages[state.messages.length - 1];
                        return lastMessage.tool_calls?.length ? node.data.instance.name : END;
                    },
                    {
                        [node.data.instance.name]: node.data.instance.name,
                        [END]: END
                    }
                );
            } else {
                // Standard edge
                graph.addEdge(node.data.instance.name, node.data.instance.getNextNode());
            }
        }

        // 9. Configure and compile graph
        const memory = startNode.data.instance.checkpointMemory;
        const interruptNodes = initializedNodes
            .filter(n => n.data.inputs?.interrupt)
            .map(n => n.data.instance.name);

        const compiledGraph = graph.compile({
            checkpointer: memory,
            interruptBefore: interruptNodes
        });

        // 10. Create execution config
        const config = {
            callbacks: [
                new ConsoleCallbackHandler(options.logger),
                ...await additionalCallbacks(options)
            ],
            metadata: {
                flowId: flowConfig.chatflowid,
                sessionId: flowConfig.sessionId,
                chatId: flowConfig.chatId
            }
        };

        // 11. Return streaming interface
        return compiledGraph.stream(
            {
                messages: [new HumanMessage({ content: incomingInput.question })],
                current_node: START,
                next_node: START,
                tools_used: [],
                artifacts: [],
                source_documents: [],
                memory: {}
            },
            config
        );

    } catch (error) {
        throw new Error(`Error building agent graph: ${error.message}`);
    }
}```