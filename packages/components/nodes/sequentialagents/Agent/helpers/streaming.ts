import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { Serialized } from '@langchain/core/load/serializable'
import { TokenEventType } from '../../../../src/Interface'
import { IStreamParams } from './types'

/**
 * Creates callback handlers for streaming tokens and tool events
 */
export function createStreamingCallbacks(params: IStreamParams) {
    const { chatId, shouldStreamResponse, sseStreamer, isConnectedToEnd } = params;
    
    return BaseCallbackHandler.fromMethods({
        handleLLMNewToken(token: string) {
            if (shouldStreamResponse && sseStreamer) {
                const tokenType = isConnectedToEnd ? 
                    TokenEventType.FINAL_RESPONSE : 
                    TokenEventType.AGENT_REASONING;
                
                sseStreamer.streamTokenEvent(chatId, token, tokenType);
            }
        },

        handleToolStart(tool: Serialized, input: string, runId: string) {
            if (shouldStreamResponse && sseStreamer?.streamToolEvent) {
                sseStreamer.streamToolEvent(chatId, {
                    tool: tool.toString(),
                    status: 'start',
                    input,
                    type: TokenEventType.TOOL_RESPONSE
                });
            }
        },

        handleToolEnd(output: string, runId: string) {
            if (shouldStreamResponse && sseStreamer?.streamToolEvent) {
                sseStreamer.streamToolEvent(chatId, {
                    output,
                    status: 'end',
                    type: TokenEventType.TOOL_RESPONSE
                });
            }
        }
    });
}

/**
 * Creates streaming configuration for the agent
 */
export function createStreamConfig(config: any, version: "v1" | "v2" = "v1") {
    return {
        ...config,
        version,
        streamMode: "values",
        encoding: "text/event-stream"
    };
}
