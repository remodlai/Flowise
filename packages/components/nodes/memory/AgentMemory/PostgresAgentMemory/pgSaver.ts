import { BaseCheckpointSaver, ChannelVersions, PendingWrite, SendProtocol, Checkpoint, CheckpointMetadata, CheckpointTuple as LangGraphCheckpointTuple } from '@langchain/langgraph-checkpoint'
import { RunnableConfig } from '@langchain/core/runnables'
import { BaseMessage } from '@langchain/core/messages'
import { DataSource } from 'typeorm'
import { SaverOptions, SerializerProtocol } from '../interface'
import { IMessage, MemoryMethods } from '../../../../src/Interface'
import { mapChatMessageToBaseMessage } from '../../../../src/utils'
import { Pool } from 'pg'

export class PostgresSaver extends BaseCheckpointSaver<string> implements MemoryMethods {
    private threadId: string
    private config: SaverOptions
    protected isSetup: boolean = false
    protected checkpointSerializer: SerializerProtocol<Checkpoint>
    protected metadataSerializer: SerializerProtocol<CheckpointMetadata>
    protected pool: Pool

    constructor(config: SaverOptions) {
        super()
        const { datasourceOptions } = config
        if (!datasourceOptions) {
            throw new Error('No datasource options provided')
        }
        // Prevent using default MySQL port
        if (datasourceOptions.port === 3006) {
            throw new Error('Invalid port number')
        }

        this.pool = new Pool({
            user: datasourceOptions.username,
            password: datasourceOptions.password,
            host: datasourceOptions.host,
            port: datasourceOptions.port,
            database: datasourceOptions.database
        })
        
        this.config = config
        this.threadId = config.threadId
        
        // Initialize serializers with improved message handling
        const defaultSerializer = {
            dumpsTyped: async <T>(obj: T): Promise<string> => {
                if (obj && typeof obj === 'object') {
                    // Handle BaseMessage serialization
                    if ('messages' in obj) {
                        return JSON.stringify({
                            ...obj,
                            messages: (obj as any).messages.map((msg: BaseMessage) => ({
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
                        return {
                            ...parsed,
                            messages: await Promise.all(
                                parsed.messages.map(async (msg: any) => {
                                    const message = await mapChatMessageToBaseMessage(msg)
                                    return Array.isArray(message) ? message[0] : message
                                })
                            )
                        } as T
                    }
                }
                return parsed as T
            }
        }
        this.checkpointSerializer = defaultSerializer
        this.metadataSerializer = defaultSerializer
    }

    protected async setup(): Promise<void> {
        if (this.isSetup) return

        try {
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS checkpoints (
                    thread_id TEXT NOT NULL,
                    checkpoint_id TEXT NOT NULL,
                    parent_id TEXT,
                    checkpoint BYTEA,
                    metadata BYTEA,
                    PRIMARY KEY (thread_id, checkpoint_id)
                )
            `)
            this.isSetup = true
        } catch (error) {
            console.error('Error creating checkpoints table:', error)
            throw new Error('Failed to create checkpoints table')
        }
    }

    async getTuple(config: RunnableConfig): Promise<LangGraphCheckpointTuple | undefined> {
        await this.setup()
        const thread_id = config.configurable?.thread_id || this.threadId
        const checkpoint_id = config.configurable?.checkpoint_id

        try {
            let query: string
            let values: any[]

            if (checkpoint_id) {
                query = 'SELECT checkpoint, parent_id, metadata FROM checkpoints WHERE thread_id = $1 AND checkpoint_id = $2'
                values = [thread_id, checkpoint_id]
            } else {
                query = 'SELECT thread_id, checkpoint_id, parent_id, checkpoint, metadata FROM checkpoints WHERE thread_id = $1 ORDER BY checkpoint_id DESC LIMIT 1'
                values = [thread_id]
            }

            const result = await this.pool.query(query, values)
            if (result.rows.length === 0) return undefined

            const row = result.rows[0]
            const checkpoint = await this.checkpointSerializer.loadsTyped(row.checkpoint.toString())
            const metadata = await this.metadataSerializer.loadsTyped(row.metadata.toString())

            return {
                config: {
                    configurable: {
                        thread_id: row.thread_id || thread_id,
                        checkpoint_id: row.checkpoint_id || checkpoint_id
                    }
                },
                checkpoint,
                metadata,
                parentConfig: row.parent_id
                    ? {
                          configurable: {
                              thread_id,
                              checkpoint_id: row.parent_id
                          }
                      }
                    : undefined
            }
        } catch (error) {
            console.error('Error retrieving checkpoint:', error)
            throw error
        }
    }

    async getChatMessages(
        overrideSessionId = '',
        returnBaseMessages = false,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]> {
        const sessionId = overrideSessionId || this.threadId
        const tuple = await this.getTuple({
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
            const emptyCheckpoint: Checkpoint = {
                v: 1,
                id: checkpoint.config.configurable?.checkpoint_id || '',
                ts: new Date().toISOString(),
                channel_values: {
                    messages: [],
                    state: {}
                },
                channel_versions: {},
                versions_seen: {},
                pending_sends: []
            }
            await this.put(
                checkpoint.config,
                emptyCheckpoint,
                {
                    source: 'input',
                    step: 0,
                    writes: null,
                    parents: {}
                } as CheckpointMetadata,
                {}
            )
        }
    }

    async put(
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        newVersions: ChannelVersions
    ): Promise<RunnableConfig> {
        await this.setup()

        if (!config.configurable?.checkpoint_id) return {}

        const thread_id = config.configurable?.thread_id || this.threadId
        const checkpoint_id = config.configurable.checkpoint_id
        const parent_id = config.configurable?.parent_checkpoint_id

        try {
            const checkpointStr = await this.checkpointSerializer.dumpsTyped(checkpoint)
            const metadataStr = await this.metadataSerializer.dumpsTyped(metadata)

            const query = `
                INSERT INTO checkpoints (thread_id, checkpoint_id, parent_id, checkpoint, metadata)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (thread_id, checkpoint_id)
                DO UPDATE SET
                    parent_id = EXCLUDED.parent_id,
                    checkpoint = EXCLUDED.checkpoint,
                    metadata = EXCLUDED.metadata
            `
            await this.pool.query(query, [
                thread_id,
                checkpoint_id,
                parent_id,
                Buffer.from(checkpointStr),
                Buffer.from(metadataStr)
            ])

            return {
                configurable: {
                    thread_id,
                    checkpoint_id,
                    parent_checkpoint_id: parent_id
                }
            }
        } catch (error) {
            console.error('Error storing checkpoint:', error)
            throw error
        }
    }

    async *list(config: RunnableConfig): AsyncGenerator<LangGraphCheckpointTuple> {
        await this.setup()
        const thread_id = config.configurable?.thread_id || this.threadId

        try {
            const query = 'SELECT checkpoint_id, parent_id, checkpoint, metadata FROM checkpoints WHERE thread_id = $1'
            const result = await this.pool.query(query, [thread_id])

            for (const row of result.rows) {
                const checkpoint = await this.checkpointSerializer.loadsTyped(row.checkpoint.toString())
                const metadata = await this.metadataSerializer.loadsTyped(row.metadata.toString())

                yield {
                    config: {
                        configurable: {
                            thread_id,
                            checkpoint_id: row.checkpoint_id
                        }
                    },
                    checkpoint,
                    metadata,
                    parentConfig: row.parent_id
                        ? {
                              configurable: {
                                  thread_id,
                                  checkpoint_id: row.parent_id
                              }
                          }
                        : undefined
                }
            }
        } catch (error) {
            console.error('Error listing checkpoints:', error)
            throw error
        }
    }

    async putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string): Promise<void> {
        await this.setup()
        
        try {
            for (const write of writes) {
                const checkpoint: Checkpoint = {
                    v: 1,
                    id: taskId,
                    ts: new Date().toISOString(),
                    channel_values: {
                        messages: [],
                        state: {}
                    },
                    channel_versions: {},
                    versions_seen: {},
                    pending_sends: [write as unknown as SendProtocol]
                }
                const metadata: CheckpointMetadata = {
                    source: 'input',
                    step: 0,
                    writes: null,
                    parents: {}
                }
                await this.put(
                    { configurable: { checkpoint_id: taskId } },
                    checkpoint,
                    metadata,
                    {}
                )
            }
        } catch (error) {
            console.error('Error writing pending writes:', error)
            throw error
        }
    }

    async putTuple(tuple: LangGraphCheckpointTuple): Promise<void> {
        const config = { configurable: { thread_id: this.threadId } };
        const currentState = await this.getTuple(config);

        if (!currentState) {
            // Initialize state if it doesn't exist
            await this.put(
                config,
                tuple.checkpoint,
                tuple.metadata || {
                    source: 'input',
                    step: 0,
                    writes: null,
                    parents: {}
                },
                {}
            );
            return;
        }

        // Update channel versions
        for (const key in tuple.checkpoint.channel_versions) {
            if (!(key in currentState.checkpoint.channel_versions)) {
                currentState.checkpoint.channel_versions[key] = 0;
            }
            const currentVersion = Number(currentState.checkpoint.channel_versions[key] || 0);
            currentState.checkpoint.channel_versions[key] = currentVersion + 1;

            // Update versions seen
            if (!(key in currentState.checkpoint.versions_seen)) {
                currentState.checkpoint.versions_seen[key] = {};
            }
            currentState.checkpoint.versions_seen[key][currentState.checkpoint.id] = currentVersion + 1;
        }

        // Merge channel_values
        currentState.checkpoint.channel_values = {
            ...currentState.checkpoint.channel_values,
            ...tuple.checkpoint.channel_values
        };

        // Update metadata and timestamp
        currentState.checkpoint.ts = new Date().toISOString();
        const metadata = tuple.metadata || {
            source: 'input',
            step: 0,
            writes: null,
            parents: {}
        };

        await this.put(
            config,
            currentState.checkpoint,
            metadata,
            currentState.checkpoint.channel_versions
        );
    }

    async close(): Promise<void> {
        await this.pool.end()
    }
}
