import { Response } from 'express'
import { IServerSideEventStreamer } from 'flowise-components'
import { Graph, StateGraph } from '@langchain/langgraph'
import { BaseMessage, MessageContent, MessageContentText } from '@langchain/core/messages'

// Define version tracking interfaces
interface VersionsSeen {
    [nodeId: string]: number
}

interface ChannelVersions {
    [key: string]: number
}

// Define checkpoint interface
interface Checkpoint {
    channel_values: {
        [key: string]: any
    }
    channel_versions: ChannelVersions
    versions_seen: {
        [key: string]: VersionsSeen
    }
}

// Define our state type
interface StateType {
    messages: BaseMessage[]
    checkpoint: Checkpoint
}

type Client = {
    clientType: 'INTERNAL' | 'EXTERNAL'
    response: Response
    started?: boolean
    graph?: StateGraph<StateType>
}

type StreamEvent = {
    state?: StateType
    event?: {
        name: 'start' | 'end' | 'error'
        data?: {
            error?: string
        }
    }
}

export class LangGraphStreamHandler implements IServerSideEventStreamer {
    private clients: { [id: string]: Client } = {}

    addExternalClient(chatId: string, res: Response, graph?: StateGraph<StateType>) {
        this.clients[chatId] = { clientType: 'EXTERNAL', response: res, started: false, graph }
    }

    addClient(chatId: string, res: Response, graph?: StateGraph<StateType>) {
        this.clients[chatId] = { clientType: 'INTERNAL', response: res, started: false, graph }
    }

    removeClient(chatId: string) {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'end',
                data: '[DONE]'
            }
            client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n')
            client.response.end()
            delete this.clients[chatId]
        }
    }

    streamCustomEvent(chatId: string, eventType: string, data: any) {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: eventType,
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamStartEvent(chatId: string, data: string) {
        const client = this.clients[chatId]
        if (client && !client.started) {
            const clientResponse = {
                event: 'start',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
            client.started = true
        }
    }

    streamTokenEvent(chatId: string, data: string) {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'token',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamSourceDocumentsEvent(chatId: string, data: any) {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'sourceDocuments',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamArtifactsEvent(chatId: string, data: any) {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'artifacts',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamUsedToolsEvent(chatId: string, data: any): void {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'usedTools',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamFileAnnotationsEvent(chatId: string, data: any): void {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'fileAnnotations',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamToolEvent(chatId: string, data: any): void {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'tool',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamAgentReasoningEvent(chatId: string, data: any): void {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'agentReasoning',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamNextAgentEvent(chatId: string, data: any): void {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'nextAgent',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamActionEvent(chatId: string, data: any): void {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'action',
                data: data
            }
            client.response.write('message:\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamAbortEvent(chatId: string): void {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'abort',
                data: '[DONE]'
            }
            client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamEndEvent(_: string) {
        // placeholder for future use
    }

    streamErrorEvent(chatId: string, msg: string) {
        const client = this.clients[chatId]
        if (client) {
            const clientResponse = {
                event: 'error',
                data: msg
            }
            client.response.write('message\ndata:' + JSON.stringify(clientResponse) + '\n\n')
        }
    }

    streamMetadataEvent(chatId: string, apiResponse: any) {
        const metadataJson: any = {}
        if (apiResponse.chatId) {
            metadataJson['chatId'] = apiResponse.chatId
        }
        if (apiResponse.chatMessageId) {
            metadataJson['chatMessageId'] = apiResponse.chatMessageId
        }
        if (apiResponse.question) {
            metadataJson['question'] = apiResponse.question
        }
        if (apiResponse.sessionId) {
            metadataJson['sessionId'] = apiResponse.sessionId
        }
        if (apiResponse.memoryType) {
            metadataJson['memoryType'] = apiResponse.memoryType
        }
        if (apiResponse.followUpPrompts) {
            metadataJson['followUpPrompts'] = JSON.parse(apiResponse.followUpPrompts)
        }
        if (Object.keys(metadataJson).length > 0) {
            this.streamCustomEvent(chatId, 'metadata', metadataJson)
        }
    }

    // LangGraph specific methods
    async streamGraphEvents(chatId: string, input: any) {
        const client = this.clients[chatId]
        if (!client || !client.graph) return

        const runnable = client.graph.compile()

        try {
            const stream = await runnable.stream(input)
            for await (const event of stream) {
                const streamEvent = event as StreamEvent
                if (streamEvent.state) {
                    // Handle messages
                    if (streamEvent.state.messages?.length > 0) {
                        const lastMessage = streamEvent.state.messages[streamEvent.state.messages.length - 1]
                        const content = lastMessage.content
                        if (typeof content === 'string') {
                            this.streamTokenEvent(chatId, content)
                        } else if (Array.isArray(content)) {
                            const textContent = content
                                .filter((part): part is MessageContentText => part.type === 'text')
                                .map(part => part.text)
                                .join(' ')
                            if (textContent) {
                                this.streamTokenEvent(chatId, textContent)
                            }
                        }
                    }

                    // Handle dynamic channel values
                    if (streamEvent.state.checkpoint?.channel_values) {
                        const channelValues = streamEvent.state.checkpoint.channel_values
                        
                        // Stream tool calls if present
                        if ('tool_calls' in channelValues) {
                            this.streamToolEvent(chatId, channelValues.tool_calls)
                        }
                        
                        // Stream actions if present
                        if ('actions' in channelValues) {
                            this.streamActionEvent(chatId, channelValues.actions)
                        }
                        
                        // Stream agent reasoning if present
                        if ('agent_reasoning' in channelValues) {
                            this.streamAgentReasoningEvent(chatId, channelValues.agent_reasoning)
                        }

                        // Stream any other custom channel values as custom events
                        Object.entries(channelValues).forEach(([key, value]) => {
                            if (!['tool_calls', 'actions', 'agent_reasoning'].includes(key)) {
                                this.streamCustomEvent(chatId, `channel_${key}`, value)
                            }
                        })
                    }
                }

                // Handle run events
                if (streamEvent.event) {
                    switch (streamEvent.event.name) {
                        case 'start':
                            this.streamStartEvent(chatId, 'Starting execution')
                            break
                        case 'end':
                            this.streamEndEvent(chatId)
                            break
                        case 'error':
                            this.streamErrorEvent(chatId, streamEvent.event.data?.error || 'Unknown error')
                            break
                    }
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error streaming graph events'
            this.streamErrorEvent(chatId, errorMessage)
        }
    }
} 