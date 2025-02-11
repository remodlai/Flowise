import { BaseCheckpointSaver, ChannelVersions, PendingWrite, SendProtocol, Checkpoint, CheckpointMetadata } from '@langchain/langgraph-checkpoint'
import { RunnableConfig } from '@langchain/core/runnables'
import { BaseMessage } from '@langchain/core/messages'
import { DataSource } from 'typeorm'
import { CheckpointTuple, SaverOptions, SerializerProtocol, CheckpointListOptions, FlowiseCheckpoint, StateData } from '../interface'
import { IMessage, MemoryMethods } from '../../../../src/Interface'
import { mapChatMessageToBaseMessage } from '../../../../src/utils'

export class SqliteSaver extends BaseCheckpointSaver<string> implements MemoryMethods {
    protected isSetup: boolean
    config: SaverOptions
    threadId: string
    tableName = 'checkpoints'
    protected checkpointSerializer: SerializerProtocol<FlowiseCheckpoint>
    protected metadataSerializer: SerializerProtocol<CheckpointMetadata>
    protected stateSerializer: SerializerProtocol<StateData>

    constructor(config: SaverOptions, serde?: SerializerProtocol<FlowiseCheckpoint>) {
        super()
        this.config = config
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
        this.checkpointSerializer = serde || defaultSerializer
        this.metadataSerializer = defaultSerializer
        this.stateSerializer = defaultSerializer
        const { threadId } = config
        this.threadId = threadId
    }

    sanitizeTableName(tableName: string): string {
        // Trim and normalize case, turn whitespace into underscores
        tableName = tableName.trim().toLowerCase().replace(/\s+/g, '_')

        // Validate using a regex (alphanumeric and underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name')
        }

        return tableName
    }

    private async getDataSource(): Promise<DataSource> {
        const { datasourceOptions } = this.config
        const dataSource = new DataSource(datasourceOptions)
        await dataSource.initialize()
        return dataSource
    }

    private async setup(dataSource: DataSource): Promise<void> {
        if (this.isSetup) {
            return
        }

        try {
            const queryRunner = dataSource.createQueryRunner()
            const tableName = this.sanitizeTableName(this.tableName)
            await queryRunner.manager.query(`
CREATE TABLE IF NOT EXISTS ${tableName} (
    thread_id TEXT NOT NULL,
    checkpoint_id TEXT NOT NULL,
    parent_id TEXT,
    checkpoint BLOB,
    metadata BLOB,
    PRIMARY KEY (thread_id, checkpoint_id));`)
            await queryRunner.release()
        } catch (error) {
            console.error(`Error creating ${this.tableName} table`, error)
            throw new Error(`Error creating ${this.tableName} table`)
        }

        this.isSetup = true
    }

    async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
        const dataSource = await this.getDataSource()
        await this.setup(dataSource)

        const thread_id = config.configurable?.thread_id || this.threadId
        const checkpoint_id = config.configurable?.checkpoint_id
        const tableName = this.sanitizeTableName(this.tableName)

        try {
            const queryRunner = dataSource.createQueryRunner()
            let sql: string
            let params: any[]

            if (checkpoint_id) {
                sql = `SELECT checkpoint, parent_id, metadata FROM ${tableName} WHERE thread_id = ? AND checkpoint_id = ?`
                params = [thread_id, checkpoint_id]
            } else {
                sql = `SELECT thread_id, checkpoint_id, parent_id, checkpoint, metadata 
                       FROM ${tableName} 
                       WHERE thread_id = ? 
                       ORDER BY checkpoint_id DESC LIMIT 1`
                params = [thread_id]
            }

            const rows = await queryRunner.manager.query(sql, params)
            await queryRunner.release()

            if (rows && rows.length > 0) {
                const row = rows[0]
                const checkpoint = await this.checkpointSerializer.loadsTyped(row.checkpoint)
                const metadata = await this.metadataSerializer.loadsTyped(row.metadata)

                // Ensure checkpoint has proper structure
                if (!checkpoint.channel_values) {
                    checkpoint.channel_values = {
                        messages: [],
                        state: {}
                    }
                }

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
            }
        } catch (error) {
            console.error(`Error retrieving checkpoint from ${tableName}:`, error)
            throw new Error(`Error retrieving checkpoint from ${tableName}: ${error.message}`)
        } finally {
            await dataSource.destroy()
        }
        return undefined
    }

    async putWrites(config: RunnableConfig, writes: PendingWrite[], taskId: string): Promise<void> {
        const dataSource = await this.getDataSource()
        await this.setup(dataSource)
        
        try {
            for (const write of writes) {
                const checkpoint: FlowiseCheckpoint = {
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
        } finally {
            await dataSource.destroy()
        }
    }

    async *list(
        config: RunnableConfig,
        options?: CheckpointListOptions
    ): AsyncGenerator<CheckpointTuple> {
        const dataSource = await this.getDataSource()
        await this.setup(dataSource)

        const queryRunner = dataSource.createQueryRunner()
        const thread_id = config.configurable?.thread_id || this.threadId
        const tableName = this.sanitizeTableName(this.tableName)
        
        try {
            let sql = `SELECT thread_id, checkpoint_id, parent_id, checkpoint, metadata 
                       FROM ${tableName} 
                       WHERE thread_id = ? ${options?.before ? 'AND checkpoint_id < ?' : ''} 
                       ORDER BY checkpoint_id DESC`
            
            if (options?.limit) {
                sql += ` LIMIT ${options.limit}`
            }
            
            const params = [thread_id]
            if (options?.before?.configurable?.checkpoint_id) {
                params.push(options.before.configurable.checkpoint_id)
            }

            const rows = await queryRunner.manager.query(sql, params)
            await queryRunner.release()

            if (rows && rows.length > 0) {
                for (const row of rows) {
                    const checkpoint = await this.checkpointSerializer.loadsTyped(row.checkpoint)
                    const metadata = await this.metadataSerializer.loadsTyped(row.metadata)

                    // Ensure checkpoint has proper structure
                    if (!checkpoint.channel_values) {
                        checkpoint.channel_values = {
                            messages: [],
                            state: {}
                        }
                    }

                    yield {
                        config: {
                            configurable: {
                                thread_id: row.thread_id,
                                checkpoint_id: row.checkpoint_id
                            }
                        },
                        checkpoint,
                        metadata,
                        parentConfig: row.parent_id
                            ? {
                                  configurable: {
                                      thread_id: row.thread_id,
                                      checkpoint_id: row.parent_id
                                  }
                              }
                            : undefined
                    }
                }
            }
        } catch (error) {
            console.error(`Error listing checkpoints from ${tableName}:`, error)
            throw new Error(`Error listing checkpoints from ${tableName}: ${error.message}`)
        } finally {
            await dataSource.destroy()
        }
    }

    async put(
        config: RunnableConfig,
        checkpoint: FlowiseCheckpoint,
        metadata: CheckpointMetadata,
        newVersions: ChannelVersions
    ): Promise<RunnableConfig> {
        const dataSource = await this.getDataSource()
        await this.setup(dataSource)

        if (!config.configurable?.checkpoint_id) return {}

        const thread_id = config.configurable?.thread_id || this.threadId
        const checkpoint_id = config.configurable.checkpoint_id
        const parent_id = config.configurable?.parent_checkpoint_id
        const tableName = this.sanitizeTableName(this.tableName)

        try {
            const queryRunner = dataSource.createQueryRunner()
            const checkpointStr = await this.checkpointSerializer.dumpsTyped(checkpoint)
            const metadataStr = await this.metadataSerializer.dumpsTyped(metadata)

            const sql = `INSERT OR REPLACE INTO ${tableName} (thread_id, checkpoint_id, parent_id, checkpoint, metadata)
                        VALUES (?, ?, ?, ?, ?)`
            await queryRunner.manager.query(sql, [thread_id, checkpoint_id, parent_id, checkpointStr, metadataStr])
            await queryRunner.release()

            return {
                configurable: {
                    thread_id,
                    checkpoint_id,
                    parent_checkpoint_id: parent_id
                }
            }
        } catch (error) {
            console.error(`Error inserting into ${tableName}`, error)
            throw new Error(`Error inserting into ${tableName}`)
        } finally {
            await dataSource.destroy()
        }
    }

    async delete(threadId: string): Promise<void> {
        if (!threadId) {
            return
        }

        const dataSource = await this.getDataSource()
        await this.setup(dataSource)
        const tableName = this.sanitizeTableName(this.tableName)
        const query = `DELETE FROM "${tableName}" WHERE thread_id = ?;`

        try {
            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.manager.query(query, [threadId])
            await queryRunner.release()
        } catch (error) {
            console.error(`Error deleting thread_id ${threadId}`, error)
        } finally {
            await dataSource.destroy()
        }
    }

    async getChatMessages(
        overrideSessionId = '',
        returnBaseMessages = false,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]> {
        if (!overrideSessionId) return []

        const chatMessage = await this.config.appDataSource.getRepository(this.config.databaseEntities['ChatMessage']).find({
            where: {
                sessionId: overrideSessionId,
                chatflowid: this.config.chatflowid
            },
            order: {
                createdDate: 'ASC'
            }
        })

        if (prependMessages?.length) {
            chatMessage.unshift(...prependMessages)
        }

        if (returnBaseMessages) {
            return await mapChatMessageToBaseMessage(chatMessage)
        }

        let returnIMessages: IMessage[] = []
        for (const m of chatMessage) {
            returnIMessages.push({
                message: m.content as string,
                type: m.role
            })
        }
        return returnIMessages
    }

    async addChatMessages(): Promise<void> {
        // Empty as its not being used
    }

    async clearChatMessages(overrideSessionId = ''): Promise<void> {
        await this.delete(overrideSessionId)
    }
}
