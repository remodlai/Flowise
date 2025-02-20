import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { Serialized } from '@langchain/core/load/serializable'
import { TokenEventType } from '../../../../src/Interface'
import { IStreamParams } from './types'
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

                // Extract node ID from metadata if available
                const metadata = tags?.find(tag => tag.startsWith('nodeId:'))
                if (metadata) {
                    currentNodeId = metadata.split(':')[1]
                    // Default to false if isConnectedToEnd is undefined
                    isCurrentNodeFinal = currentNodeId ? (isConnectedToEnd ?? false) : false
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
export function createStreamConfig(config: any) {
    // Ensure we have a valid config object
    const baseConfig = config || {};
    
    // Create stream config with required fields
    return {
        ...baseConfig,
        streamMode: "values",
        version: "v1",  // Explicitly set version to v1 as required by LangGraph
        configurable: {
            ...baseConfig.configurable,
            // Preserve any existing configurable options while ensuring required ones
            shouldStreamResponse: baseConfig.configurable?.shouldStreamResponse ?? true
        }
    }
}
