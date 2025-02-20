import { AIMessage, BaseMessage } from '@langchain/core/messages'
import { ChatGenerationChunk, Generation } from '@langchain/core/outputs'
import { IDocument, IUsedTool, ICommonObject, ISeqAgentsState } from '../../../../src/Interface'
import { filterConversationHistory, restructureMessages } from '../../commonUtils'
import { v4 as uuidv4 } from 'uuid'
import { IAgentParams, IStreamConfig } from './types'
import { createStreamConfig } from './streaming'

/**
 * Core agent node implementation that handles:
 * - Message history management
 * - Event streaming
 * - Tool execution
 * - State management
 */
export async function* agentNode(params: IAgentParams, config: IStreamConfig) {
    const { state, agent, name, nodeData, options } = params;
    
    try {
        // Process message history
        const historySelection = nodeData.inputs?.conversationHistorySelection || 'all_messages';
        const filteredMessages = filterConversationHistory(historySelection, options.input, state);
        
        // Create initial message state
        const initialMessageState: ISeqAgentsState['messages'] = {
            value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
            default: () => []
        };

        // Update state with restructured messages
        const restructuredMessages = restructureMessages(params.llm, { 
            messages: {
                value: initialMessageState.value,
                default: () => filteredMessages
            }
        });

        state.messages = {
            value: initialMessageState.value,
            default: () => restructuredMessages
        };

        // Setup streaming configuration
        const streamConfig = createStreamConfig(config);

        // Initialize collectors
        let collectedContent = '';
        let collectedTools: IUsedTool[] = [];
        let collectedDocs: IDocument[] = [];
        let collectedArtifacts: ICommonObject[] = [];
        let toolCalls: any[] = [];

        // Get event stream from agent
        const eventStream = await agent.streamEvents(
            { messages: state.messages },
            streamConfig
        );

        // Process events
        for await (const event of eventStream) {
            // Pass through event
            yield event;

            // Handle different event types
            switch (event.event) {
                case 'on_llm_stream': {
                    const chunk = event.data?.chunk as Generation;
                    const text = typeof chunk === 'string' ? chunk : chunk?.text;
                    if (text) collectedContent += text;
                    break;
                }

                case 'on_tool_start': {
                    const toolStartData = event.data as { name?: string; input?: any };
                    if (toolStartData.name) {
                        toolCalls.push({
                            id: uuidv4(),
                            name: toolStartData.name,
                            args: toolStartData.input || {}
                        });
                    }
                    break;
                }

                case 'on_tool_end': {
                    const toolEndData = event.data as { name?: string; input?: any; output?: string };
                    if (toolEndData.name && toolEndData.output) {
                        collectedTools.push({
                            tool: toolEndData.name,
                            toolInput: toolEndData.input || {},
                            toolOutput: toolEndData.output
                        });
                    }
                    break;
                }
            }

            // Handle additional data
            const eventData = event.data as { sourceDocuments?: IDocument[]; artifacts?: ICommonObject[] };
            if (eventData.sourceDocuments?.length) {
                collectedDocs = collectedDocs.concat(eventData.sourceDocuments);
            }
            if (eventData.artifacts?.length) {
                collectedArtifacts = collectedArtifacts.concat(eventData.artifacts);
            }
        }

        // Create final message
        const finalMessage = new AIMessage({
            content: collectedContent,
            name,
            tool_calls: toolCalls.length ? toolCalls : undefined,
            additional_kwargs: {
                nodeId: nodeData.id,
                usedTools: collectedTools,
                sourceDocuments: collectedDocs,
                artifacts: collectedArtifacts
            }
        });

        // Update state with final message
        const currentMessages = state.messages.default();
        state.messages = {
            value: initialMessageState.value,
            default: () => [...currentMessages, finalMessage]
        };

        return {
            messages: [finalMessage],
            state
        };
    } catch (error) {
        throw new Error(`Agent node error: ${error}`);
    }
}
