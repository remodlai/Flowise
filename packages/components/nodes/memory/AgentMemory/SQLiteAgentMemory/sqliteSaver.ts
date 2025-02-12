import { BaseCheckpointSaver, ChannelVersions, PendingWrite, SendProtocol, Checkpoint, CheckpointMetadata, CheckpointTuple as LangGraphCheckpointTuple } from '@langchain/langgraph-checkpoint'
import { RunnableConfig } from '@langchain/core/runnables'
import { BaseMessage } from '@langchain/core/messages'
import { DataSource } from 'typeorm'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { SaverOptions, SerializerProtocol } from '../interface'
import { IMessage, MemoryMethods, FlowiseCheckpoint, StateData } from '../../../../src/Interface'
import { mapChatMessageToBaseMessage } from '../../../../src/utils'

export class SQLiteSaver extends SqliteSaver implements MemoryMethods {
    private threadId: string
    private config: SaverOptions
    protected isSetup: boolean = false
    protected checkpointSerializer: SerializerProtocol<FlowiseCheckpoint>
    protected metadataSerializer: SerializerProtocol<CheckpointMetadata>

    constructor(config: SaverOptions) {
        super({ dbPath: config.datasourceOptions.database })
        this.config = config
        this.threadId = config.threadId
        
        // Initialize serializers
        const defaultSerializer = {
            dumpsTyped: async <T>(obj: T): Promise<string> => {
                if (obj && typeof obj === 'object') {
                    // Handle BaseMessage serialization
                    if ('messages' in obj) {
                        const state = obj as StateData
                        return JSON.stringify({
                            ...state,
                            messages: state.messages.map((msg) => ({
                                type: msg._getType(),
                                data: msg.toDict()
                            }))
                        })
                    }
                }
                return JSON.stringify(obj)
            },
            loadsTyped: async <T>(data: string): Promise<T> => {
                const parsed = JSON.parse(data)
                if (parsed && typeof parsed === 'object') {
                    // Handle BaseMessage deserialization
                    if ('messages' in parsed) {
                        const state = parsed as any
                        return {
                            ...state,
                            messages: state.messages.map((msg: any) => {
                                const message = mapChatMessageToBaseMessage(msg)
                                return message
                            })
                        } as T
                    }
                }
                return parsed as T
            }
        }
        this.checkpointSerializer = defaultSerializer
        this.metadataSerializer = defaultSerializer
    }

    async getChatMessages(
        overrideSessionId = '',
        returnBaseMessages = false,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]> {
        const sessionId = overrideSessionId || this.threadId
        const tuple = await super.getTuple({
            configurable: {
                thread_id: sessionId
            }
        } as RunnableConfig)

        if (!tuple) {
            return prependMessages || []
        }

        const messages = (tuple.checkpoint.channel_values?.messages || []) as Array<any>
        if (returnBaseMessages) {
            const baseMessages = await Promise.all(
                messages.map(async (msg) => {
                    const converted = await mapChatMessageToBaseMessage(msg)
                    return Array.isArray(converted) ? converted[0] : converted
                })
            )
            return baseMessages
        }
        return messages as IMessage[]
    }

    async addChatMessages(): Promise<void> {
        // Messages are added through the checkpoint system
        return
    }

    async clearChatMessages(overrideSessionId = ''): Promise<void> {
        const sessionId = overrideSessionId || this.threadId
        await this.clearThread(sessionId)
    }

    private async clearThread(threadId: string): Promise<void> {
        if (!threadId) return
        const config: RunnableConfig = {
            configurable: {
                thread_id: threadId
            }
        }
        const checkpoints = await this.list(config)
        for await (const checkpoint of checkpoints) {
            await this.put(
                checkpoint.config,
                {
                    v: 1,
                    id: checkpoint.config.configurable?.checkpoint_id || '',
                    ts: new Date().toISOString(),
                    channel_values: {},
                    channel_versions: {},
                    versions_seen: {},
                    pending_sends: []
                } as Checkpoint,
                {
                    source: 'input',
                    step: 0,
                    writes: null,
                    parents: {}
                } as CheckpointMetadata
            )
        }
    }

    override async put(
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata
    ): Promise<RunnableConfig> {
        // Ensure proper checkpoint structure
        const fullCheckpoint: Checkpoint = {
            v: checkpoint.v || 1,
            id: checkpoint.id || config.configurable?.checkpoint_id || '',
            ts: checkpoint.ts || new Date().toISOString(),
            channel_values: checkpoint.channel_values || {},
            channel_versions: checkpoint.channel_versions || {},
            versions_seen: checkpoint.versions_seen || {},
            pending_sends: checkpoint.pending_sends || []
        }

        // Ensure proper metadata structure
        const fullMetadata: CheckpointMetadata = {
            source: metadata.source || 'unknown',
            step: metadata.step || 0,
            writes: metadata.writes || null,
            parents: metadata.parents || {}
        }

        return super.put(config, fullCheckpoint, fullMetadata)
    }
}
