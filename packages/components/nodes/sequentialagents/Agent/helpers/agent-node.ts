import { AIMessage, BaseMessage } from '@langchain/core/messages'
import { ChatGenerationChunk, Generation } from '@langchain/core/outputs'
import { IDocument, IUsedTool, ICommonObject, ISeqAgentsState } from '../../../../src/Interface'
import { filterConversationHistory, restructureMessages, initializeState, validateState } from '../../commonUtils'
import { v4 as uuidv4 } from 'uuid'
import { IAgentParams, IStreamConfig, IAgentEvent } from './types'
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

export async function* agentNode(
    params: IAgentParams,
    config: IStreamConfig
): AsyncGenerator<IAgentEvent, { messages: AIMessage[]; state: ISeqAgentsState }, void> {
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

        // Initialize collectors with proper typing and safe defaults
        let collectedContent: string = '';
        let collectedTools: IUsedTool[] = [];
        let collectedDocs: IDocument[] = [];
        let collectedArtifacts: ICommonObject[] = [];
        let toolCalls: any[] = [];

        // Helper function for safe token concatenation
        const appendToken = (token: string): void => {
            if (typeof token === 'string') {
                collectedContent = collectedContent + token;
            }
        };

        // Get event stream from agent using initialized state
        let eventStream;
        try {
            try {
                // Create stream config with proper version and mode
                const streamEventConfig = {
                    version: "v1",
                    streamMode: "values",
                    configurable: {
                        shouldStreamResponse: streamConfig?.configurable?.shouldStreamResponse ?? true,
                        nodesConnectedToEnd: streamConfig?.configurable?.nodesConnectedToEnd,
                        bindModel: streamConfig?.configurable?.bindModel
                    },
                    callbacks: streamConfig?.callbacks,
                    metadata: {
                        ...streamConfig?.metadata,
                        nodeId: nodeData.id,
                        nodeName: name
                    }
                };

                // Get event stream with proper input format and validation
                const messages = initializedState.messages.default();
                if (!Array.isArray(messages)) {
                    throw new Error('Invalid messages array in state');
                }

                eventStream = await agent.streamEvents(
                    { messages },
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

                    // Validate event structure
                    if (!event || typeof event !== 'object' || !event.event) {
                        logger.warn('[Agent Node] Skipping invalid event:', {
                            nodeName: name,
                            nodeId: nodeData.id,
                            event: typeof event === 'object' ? JSON.stringify(event) : typeof event
                        });
                        continue;
                    }

                    // Safely access event data with type checking
                    const eventType = event.event;
                    const eventData = event.data || {};

                    // Cast event to proper type with validation
                    const typedEvent = event as IAgentEvent;
                    if (!typedEvent || typeof typedEvent !== 'object') {
                        logger.warn('[Agent Node] Invalid event type:', {
                            nodeName: name,
                            nodeId: nodeData.id,
                            eventType
                        });
                        continue;
                    }

                    switch (eventType) {
                        case 'on_llm_stream': {
                            try {
                                const chunk = eventData.chunk as Generation;
                                // Safely extract text with type checking
                                let text: string | undefined;
                                if (typeof chunk === 'string') {
                                    text = chunk;
                                } else if (chunk && typeof chunk === 'object') {
                                    text = chunk.text;
                                }

                                if (text && typeof text === 'string') {
                                    // Safely append to collected content
                                    appendToken(text);
                                    
                                    // Stream tokens with validation
                                    yield {
                                        event: 'on_llm_stream',
                                        data: {
                                            chunk: text
                                        }
                                    };
                                } else {
                                    logger.debug('[Agent Node] Skipping invalid token:', {
                                        nodeName: name,
                                        nodeId: nodeData.id,
                                        tokenType: typeof text
                                    });
                                }
                            } catch (streamError) {
                                logger.error('[Agent Node] Error processing LLM stream:', {
                                    nodeName: name,
                                    nodeId: nodeData.id,
                                    error: streamError.message || streamError
                                });
                            }
                            break;
                        }

                        case 'on_tool_start': {
                            try {
                                const toolStartData = eventData as { name?: string; input?: any };
                                if (toolStartData && typeof toolStartData === 'object' && toolStartData.name) {
                                    const toolCall = {
                                        id: uuidv4(),
                                        name: toolStartData.name,
                                        args: toolStartData.input || {}
                                    };
                                    
                                    // Safely add tool call
                                    if (!Array.isArray(toolCalls)) {
                                        toolCalls = [];
                                    }
                                    toolCalls.push(toolCall);

                                    logger.debug('[Agent Node] Tool start:', {
                                        nodeName: name,
                                        nodeId: nodeData.id,
                                        toolName: toolStartData.name
                                    });
                                }
                            } catch (toolError) {
                                logger.error('[Agent Node] Error processing tool start:', {
                                    nodeName: name,
                                    nodeId: nodeData.id,
                                    error: toolError.message || toolError
                                });
                            }
                            break;
                        }

                        case 'on_tool_end': {
                            try {
                                const toolEndData = eventData as { name?: string; input?: any; output?: string };
                                if (toolEndData && typeof toolEndData === 'object' && toolEndData.name && toolEndData.output) {
                                    const tool = {
                                        tool: toolEndData.name,
                                        toolInput: toolEndData.input || {},
                                        toolOutput: toolEndData.output
                                    };
                                    
                                    // Safely add tool
                                    if (!Array.isArray(collectedTools)) {
                                        collectedTools = [];
                                    }
                                    collectedTools.push(tool);

                                    logger.debug('[Agent Node] Tool end:', {
                                        nodeName: name,
                                        nodeId: nodeData.id,
                                        toolName: toolEndData.name
                                    });
                                }
                            } catch (toolError) {
                                logger.error('[Agent Node] Error processing tool end:', {
                                    nodeName: name,
                                    nodeId: nodeData.id,
                                    error: toolError.message || toolError
                                });
                            }
                            break;
                        }
                    }

                    // Handle additional data with validation
                    try {
                        // Initialize arrays if undefined
                        if (!Array.isArray(collectedDocs)) collectedDocs = [];
                        if (!Array.isArray(collectedArtifacts)) collectedArtifacts = [];

                        // Safely handle source documents
                        if (Array.isArray(eventData.sourceDocuments)) {
                            const validDocs = eventData.sourceDocuments.filter((doc: IDocument) => doc && typeof doc === 'object');
                            if (validDocs.length) {
                                collectedDocs = collectedDocs.concat(validDocs);
                            }
                        }

                        // Safely handle artifacts
                        if (Array.isArray(eventData.artifacts)) {
                            const validArtifacts = eventData.artifacts.filter((artifact: ICommonObject) => artifact && typeof artifact === 'object');
                            if (validArtifacts.length) {
                                collectedArtifacts = collectedArtifacts.concat(validArtifacts);
                            }
                        }
                    } catch (dataError) {
                        logger.error('[Agent Node] Error processing additional data:', {
                            nodeName: name,
                            nodeId: nodeData.id,
                            error: dataError.message || dataError
                        });
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

        // Create final message after all tokens are collected
        const finalMessage = new AIMessage({
            content: collectedContent,
            name,
            tool_calls: toolCalls.length ? toolCalls : undefined,
            additional_kwargs: {
                nodeId: nodeData.id,
                usedTools: collectedTools,
                sourceDocuments: collectedDocs,
                artifacts: collectedArtifacts,
                state: initializedState // Include current state for context
            }
        });

        // Create a new state object to avoid mutations
        const finalState = {
            ...initializedState,
            messages: {
                value: initializedState.messages.value,
                default: () => {
                    const existingMessages = initializedState.messages.default();
                    // Ensure proper array concatenation
                    return Array.isArray(existingMessages) 
                        ? existingMessages.concat([finalMessage])
                        : [finalMessage];
                }
            }
        };

        // Return final message and state without streaming state updates
        return {
            messages: [finalMessage],
            state: finalState
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
