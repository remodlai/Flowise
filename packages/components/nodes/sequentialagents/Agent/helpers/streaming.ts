import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { Serialized } from '@langchain/core/load/serializable'
import { TokenEventType } from '../../../../src/Interface'
import { IStreamParams } from './types'

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
            if (!shouldStreamResponse || !sseStreamer || !token.trim()) return;

            // Extract node ID from metadata if available
            const metadata = tags?.find(tag => tag.startsWith('nodeId:'))
            if (metadata) {
                currentNodeId = metadata.split(':')[1]
                // Default to false if isConnectedToEnd is undefined
                isCurrentNodeFinal = currentNodeId ? (isConnectedToEnd ?? false) : false
            }

            if (!isStreamingStarted) {
                isStreamingStarted = true
                sseStreamer.streamStartEvent(chatId, '')
                sseStreamer.streamTokenStartEvent(chatId)
                
                // Send agentReasoningStart with proper flag before token streaming
                sseStreamer.streamAgentReasoningStartEvent(chatId, isCurrentNodeFinal ? "startFinalResponseStream" : "")
            }

            // Set token type based on whether current node connects to end
            const tokenType = isCurrentNodeFinal
                ? TokenEventType.FINAL_RESPONSE 
                : TokenEventType.AGENT_REASONING

            sseStreamer.streamTokenEvent(chatId, token, tokenType)
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
    return {
        ...config,
        streamMode: "values",
        version: "v1"  // Explicitly set version to v1 as required by LangGraph
    }
}
