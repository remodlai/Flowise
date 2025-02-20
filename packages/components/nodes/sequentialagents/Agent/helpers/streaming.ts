import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { Serialized } from '@langchain/core/load/serializable'
import { RunnableConfig } from '@langchain/core/runnables'
import { TokenEventType } from '../../../../src/Interface'
import { IStreamParams, IStreamConfig } from './types'
import logger from '../../../../src/utils/logger'

/**
 * Creates callback handlers for streaming tokens and tool events
 */
export function createStreamingCallbacks(params: IStreamParams) {
    const { chatId, shouldStreamResponse, sseStreamer, isConnectedToEnd } = params;
    
    let isStreamingStarted = false;
    let currentNodeId = '';
    let isCurrentNodeFinal = false;

    return BaseCallbackHandler.fromMethods({
        handleLLMNewToken(token: string, _idx: any, _runId: string, _parentRunId?: string, tags?: string[]) {
            try {
                // Validate inputs
                if (!shouldStreamResponse || !sseStreamer) return;
                if (!token || typeof token !== 'string') return;
                const trimmedToken = token.trim();
                if (!trimmedToken) return;

                // Extract node ID and metadata safely
                try {
                    if (Array.isArray(tags)) {
                        // Extract nodeId from metadata
                        const nodeIdTag = tags.find(tag => tag.startsWith('nodeId:'));
                        if (nodeIdTag) {
                            const [_, id] = nodeIdTag.split(':');
                            if (id) currentNodeId = id;
                        }

                        // Extract nodeName from metadata
                        const nodeNameTag = tags.find(tag => tag.startsWith('nodeName:'));
                        if (nodeNameTag) {
                            const [_, name] = nodeNameTag.split(':');
                            logger.debug('[Streaming] Processing node:', { name, id: currentNodeId });
                        }
                    }

                    // Determine if this is a final node
                    isCurrentNodeFinal = Boolean(currentNodeId && isConnectedToEnd);
                } catch (metadataError) {
                    logger.error('[Streaming] Error processing metadata:', {
                        tags,
                        error: metadataError.message || metadataError
                    });
                    // Use safe defaults
                    currentNodeId = '';
                    isCurrentNodeFinal = false;
                }

                // Initialize streaming if needed
                if (!isStreamingStarted) {
                    isStreamingStarted = true
                    try {
                        sseStreamer.streamStartEvent(chatId, '')
                        sseStreamer.streamTokenStartEvent(chatId)
                        
                        // Send agentReasoningStart with proper flag before token streaming
                        sseStreamer.streamAgentReasoningStartEvent(chatId, isCurrentNodeFinal ? "startFinalResponseStream" : "")
                    } catch (error) {
                        logger.error('[Streaming] Failed to initialize stream:', {
                            chatId,
                            error: error.message || error
                        });
                        return;
                    }
                }

                // Set token type based on whether current node connects to end
                const tokenType = isCurrentNodeFinal
                    ? TokenEventType.FINAL_RESPONSE 
                    : TokenEventType.AGENT_REASONING

                // Stream token with error handling
                try {
                    sseStreamer.streamTokenEvent(chatId, trimmedToken, tokenType)
                } catch (error) {
                    logger.error('[Streaming] Failed to stream token:', {
                        chatId,
                        tokenType,
                        error: error.message || error
                    });
                }
            } catch (error) {
                logger.error('[Streaming] Token handling error:', {
                    chatId,
                    error: error.message || error
                });
            }
        },

        handleLLMEnd() {
            if (isStreamingStarted && shouldStreamResponse && sseStreamer) {
                sseStreamer.streamTokenEndEvent(chatId)
                sseStreamer.streamAgentReasoningEndEvent(chatId)
                isStreamingStarted = false
            }
        },

        handleToolStart(tool: Serialized, input: string) {
            if (shouldStreamResponse && sseStreamer?.streamToolEvent) {
                sseStreamer.streamToolEvent(chatId, {
                    tool: tool.toString(),
                    status: 'start',
                    input,
                    type: TokenEventType.TOOL_RESPONSE
                })
            }
        },

        handleToolEnd(output: string) {
            if (shouldStreamResponse && sseStreamer?.streamToolEvent) {
                sseStreamer.streamToolEvent(chatId, {
                    output,
                    status: 'end',
                    type: TokenEventType.TOOL_RESPONSE
                })
            }
        },

        handleChainStart() {
            // Reset streaming state for new chain
            isStreamingStarted = false
            currentNodeId = ''
            isCurrentNodeFinal = false
        },

        handleChainEnd() {
            // Ensure token stream is properly ended
            if (isStreamingStarted && shouldStreamResponse && sseStreamer) {
                sseStreamer.streamTokenEndEvent(chatId)
                sseStreamer.streamAgentReasoningEndEvent(chatId)
                isStreamingStarted = false
            }
        }
    })
}

/**
 * Creates streaming configuration for the agent
 */
export function createStreamConfig(config: RunnableConfig): IStreamConfig {
    try {
        // Ensure we have a valid config object with defaults
        const baseConfig = config || {};
        const configurable = baseConfig.configurable || {};
        
        // Validate and sanitize nodeId
        const nodeId = configurable.nodeId ? String(configurable.nodeId).trim() : undefined;
        
        // Validate nodesConnectedToEnd array
        const nodesConnectedToEnd = Array.isArray(configurable.nodesConnectedToEnd) 
            ? configurable.nodesConnectedToEnd.filter(id => typeof id === 'string' && id.trim())
            : [];
        
        // Create stream config with required fields and validation
        const streamConfig: IStreamConfig = {
            ...baseConfig,
            streamMode: "values",
            version: "v1",  // Explicitly set version to v1 as required by LangGraph
            configurable: {
                ...configurable,
                shouldStreamResponse: configurable.shouldStreamResponse ?? true,
                isConnectedToEnd: nodeId ? nodesConnectedToEnd.includes(nodeId) : false,
                thread_id: configurable.thread_id ? String(configurable.thread_id) : undefined,
                nodeId,
                bindModel: configurable.bindModel
            },
            metadata: {
                ...baseConfig.metadata,
                nodeId,
                nodeName: configurable.nodeName ? String(configurable.nodeName) : undefined
            }
        };

        // Additional validation
        if (!streamConfig.configurable) {
            logger.warn('[Streaming] Missing configurable in stream config');
            streamConfig.configurable = {
                shouldStreamResponse: true,
                isConnectedToEnd: false
            };
        }

        // Log configuration for debugging
        logger.debug('[Streaming] Created stream config:', {
            nodeId,
            isConnectedToEnd: streamConfig.configurable.isConnectedToEnd,
            nodesConnectedToEnd
        });

        return streamConfig;
    } catch (error) {
        logger.error('[Streaming] Error creating stream config:', error);
        // Return safe default config
        return {
            streamMode: "values",
            version: "v1",
            configurable: {
                shouldStreamResponse: true,
                isConnectedToEnd: false
            }
        };
    }
}
