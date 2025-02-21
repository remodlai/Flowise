import { AIMessage, BaseMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { 
    INodeData, 
    ICommonObject, 
    ISeqAgentsState,
    TokenEventType,
    ConversationHistorySelection
} from '../../../../src/Interface'
import { AgentExecutor } from '../../../../src/agents'
import { 
    filterConversationHistory, 
    restructureMessages 
} from '../../commonUtils'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'

interface AgentNodeParams {
    state: ISeqAgentsState
    llm: BaseChatModel
    agent: AgentExecutor | any
    name: string
    nodeData: INodeData
    options: ICommonObject
    interrupt?: boolean
    isConnectedToEnd?: boolean
    multiModalMessageContent?: any[]
}

/**
 * Main agent node execution function
 */
export async function agentNode(
    params: AgentNodeParams,
    config: RunnableConfig
) {
    const {
        state,
        llm,
        agent,
        name,
        nodeData,
        options,
        interrupt,
        isConnectedToEnd
    } = params

    try {
        // Check for abort signal
        if (options.signal?.aborted) {
            throw new Error('Aborted!')
        }

        const historySelection = (nodeData.inputs?.conversationHistorySelection || 'all_messages') as ConversationHistorySelection
        // @ts-ignore
        state.messages = filterConversationHistory(historySelection, options.input, state)
        // @ts-ignore
        state.messages = restructureMessages(llm, state)

        // Add node metadata for streaming
        const streamConfig = {
            ...config,
            configurable: {
                ...(config.configurable || {}),
                nodeId: nodeData.id,
                isConnectedToEnd
            }
        }

        // Execute agent with streaming config
        const result = await agent.invoke(
            { ...state, signal: options.signal },
            streamConfig
        )

        // Create final message with proper state handling
        const finalMessage = new AIMessage({
            content: result.content || result.output || '',
            name,
            additional_kwargs: {
                nodeId: nodeData.id,
                usedTools: result.usedTools || [],
                sourceDocuments: result.sourceDocuments || [],
                artifacts: result.artifacts || [],
                state: {
                    ...state,
                    ...(result.state || {}),
                    messages: state.messages
                }
            }
        })

        // Update state with final message
        state.messages = {
            value: state.messages.value,
            default: () => [...state.messages.default(), finalMessage]
        }

        // Return final result
        return {
            messages: [finalMessage],
            state: {
                ...state,
                ...(result.state || {}),
                messages: state.messages
            },
            next: result.next
        }

    } catch (error) {
        throw new Error(`Agent node execution failed: ${error}`)
    }
}

/**
 * Create streaming callback handler
 */
export function createStreamingCallbacks(options: {
    chatId: string
    shouldStreamResponse: boolean
    sseStreamer: any
    isConnectedToEnd: boolean
}) {
    const { chatId, shouldStreamResponse, sseStreamer, isConnectedToEnd } = options

    if (!shouldStreamResponse || !sseStreamer) {
        return null
    }

    let isStreamingStarted = false

    return BaseCallbackHandler.fromMethods({
        handleLLMNewToken(token: string) {
            try {
                if (!token?.trim()) return

                // Initialize streaming if not started
                if (!isStreamingStarted) {
                    isStreamingStarted = true
                    sseStreamer.streamTokenStartEvent(chatId)
                    sseStreamer.streamAgentReasoningStartEvent(
                        chatId,
                        isConnectedToEnd ? "startFinalResponseStream" : ""
                    )
                }

                // Get token type based on node connection
                const tokenType = isConnectedToEnd ? 
                    TokenEventType.FINAL_RESPONSE : 
                    TokenEventType.AGENT_REASONING

                // Stream token with proper type
                sseStreamer.streamTokenEvent(chatId, token, tokenType)
            } catch (error) {
                console.error('[Streaming] Error in handleLLMNewToken:', error)
            }
        },

        handleLLMEnd() {
            try {
                if (isStreamingStarted) {
                    sseStreamer.streamTokenEndEvent(chatId)
                    sseStreamer.streamAgentReasoningEndEvent(chatId)
                    isStreamingStarted = false
                }
            } catch (error) {
                console.error('[Streaming] Error in handleLLMEnd:', error)
            }
        },

        // Don't stream tool operations - they'll be included in final output
        handleToolStart() {},
        handleToolEnd() {},

        // Handle chain events
        handleChainStart() {
            try {
                isStreamingStarted = false
            } catch (error) {
                console.error('[Streaming] Error in handleChainStart:', error)
            }
        },

        handleChainEnd() {
            try {
                if (isStreamingStarted) {
                    sseStreamer.streamTokenEndEvent(chatId)
                    sseStreamer.streamAgentReasoningEndEvent(chatId)
                    isStreamingStarted = false
                }
            } catch (error) {
                console.error('[Streaming] Error in handleChainEnd:', error)
            }
        }
    })
}
