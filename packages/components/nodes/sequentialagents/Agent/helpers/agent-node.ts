ttasd import { AIMessage, BaseMessage } from '@langchain/core/messages'
import { ChatGenerationChunk, Generation } from '@langchain/core/outputs'
import { IDocument, IUsedTool, ICommonObject, ISeqAgentsState } from '../../../../src/Interface'
import { filterConversationHistory, restructureMessages, initializeState, validateState } from '../../commonUtils'
import { v4 as uuidv4 } from 'uuid'
import { IAgentParams, IStreamConfig } from './types'
import { createStreamConfig } from './streaming'
import logger from '../../../../src/utils/logger'

/**
 * Core agent node implementation that handles:
 * - Message history management
 * - Event streaming
 * - Tool execution
 * - State management
 */
const handleStateError = (error: any, context: any) => {
    logger.error('[Agent Node] State Error:', {
        ...context,
        error: error.message || error,
        stack: error.stack
    });
    
    // Return safe default state
    return {
        messages: {
            value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
            default: () => []
        }
    };
};

export async function* agentNode(params: IAgentParams, config: IStreamConfig) {
    const { state, agent, name, nodeData, options } = params;
    
    try {
        // Initialize and validate state structure
        let initializedState = validateState(state);
        
        try {
            // Process message history
            const historySelection = nodeData.inputs?.conversationHistorySelection || 'all_messages';
            const filteredMessages = filterConversationHistory(historySelection, options.input, initializedState);
            
            // Get existing messages from state
            const existingMessages = initializedState.messages.default();
            
            // Restructure and combine messages
            const restructuredMessages = restructureMessages(params.llm, { 
                messages: {
                    value: initializedState.messages.value,
                    default: () => filteredMessages
                }
            });

            // Combine existing messages with new ones
            const combinedMessages = [...existingMessages, ...restructuredMessages];
            
            // Update state's messages while preserving the reducer
            initializedState.messages = {
                value: initializedState.messages.value,
                default: () => combinedMessages
            };
        } catch (stateError) {
            logger.error('[Agent Node] Error processing state:', {
                nodeName: name,
                nodeId: nodeData.id,
                error: stateError.message || stateError
            });
            initializedState = handleStateError(stateError, {
                nodeName: name,
                nodeId: nodeData.id,
                state: initializedState
            });
        }

        // Setup streaming configuration
        const streamConfig = createStreamConfig(config);

        // Initialize collectors
        let collectedContent = '';
        let collectedTools: IUsedTool[] = [];
        let collectedDocs: IDocument[] = [];
        let collectedArtifacts: ICommonObject[] = [];
        let toolCalls: any[] = [];

        // Get event stream from agent using initialized state
        let eventStream;
        try {
            try {
                // Create stream config with proper version and mode
                const streamEventConfig = {
                    version: "v1",
                    streamMode: "values",
                    configurable: {
                        shouldStreamResponse: streamConfig?.configurable?.shouldStreamResponse ?? true
                    },
                    callbacks: streamConfig?.callbacks,
                    metadata: streamConfig?.metadata
                };

                // Get event stream with proper input format
                eventStream = await agent.streamEvents(
                    { messages: initializedState.messages.default() },
                    streamEventConfig
                );

                // Validate event stream before proceeding
                if (!eventStream) {
                    throw new Error("Failed to create event stream: Stream is undefined");
                }
            } catch (error) {
                logger.error('[Agent Node] Stream creation error:', {
                    nodeName: name,
                    nodeId: nodeData.id,
                    error: error.message || error
                });
                throw error;
            }
        } catch (error) {
            throw new Error(`Failed to create event stream: ${error}`);
        }

        // Process events with error handling
        try {
            for await (const event of eventStream) {
                try {
                    // Validate event before processing
                    if (!event || typeof event !== 'object') {
                        logger.warn('[Agent Node] Invalid event received:', {
                            nodeName: name,
                            nodeId: nodeData.id,
                            event
                        });
                        continue;
                    }

                    // Pass through valid event
                    yield event;

                    // Handle different event types
                    const eventType = event.event;
                    if (!eventType) {
                        continue; // Skip events without type
                    }

                    switch (eventType) {
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
                } catch (eventError) {
                    // Log event processing error but continue with next event
                    logger.error(`[Agent Node] Error processing event`, {
                        nodeName: name,
                        nodeId: nodeData.id,
                        eventType: event?.event,
                        error: eventError.message || eventError
                    });
                    continue;
                }
            }
        } catch (streamError) {
            const streamErrorContext = {
                nodeName: name,
                nodeId: nodeData.id,
                error: streamError.message || streamError
            };
            logger.error('[Agent Node] Stream processing error', streamErrorContext);
            throw new Error(`Error processing event stream: ${JSON.stringify(streamErrorContext)}`);
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
                artifacts: collectedArtifacts,
                state: initializedState // Include state in message for proper tracking
            }
        });

        // Update state with final message
        const currentMessages = initializedState.messages.default();
        initializedState.messages = {
            value: initializedState.messages.value,
            default: () => [...currentMessages, finalMessage]
        };

        return {
            messages: [finalMessage],
            state: initializedState
        };
    } catch (error) {
        // Add error context for better debugging
        const errorContext = {
            nodeName: name,
            nodeId: nodeData.id,
            error: error.message || error
        };
        throw new Error(`Agent node error: ${JSON.stringify(errorContext)}`);
    }
}
