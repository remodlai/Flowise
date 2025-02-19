import path from 'path'
import { getBaseClasses, getUserHome } from '../../../../src/utils'
import { SaverOptions } from '../interface'
import { ICommonObject, IDatabaseEntity, INode, INodeData, INodeParams, MemoryMethods, FlowiseMemory } from '../../../../src/Interface'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { DataSource } from 'typeorm'
import { BufferMemoryInput } from 'langchain/memory'

class SQLiteMemory extends FlowiseMemory implements MemoryMethods {
    sessionId: string
    dbPath: string
    saver: SqliteSaver

    constructor(fields: BufferMemoryInput & { dbPath: string; sessionId: string }) {
        super(fields)
        this.dbPath = fields.dbPath
        this.sessionId = fields.sessionId
        this.saver = new SqliteSaver({ dbPath: this.dbPath })
    }

    async clearChatMessages(overrideSessionId?: string): Promise<void> {
        const id = overrideSessionId || this.sessionId
        if (!id) return
        await this.clear()
    }

    async getChatMessages(): Promise<any> {
        // Getting chat messages is handled at the database level
        return []
    }

    async addChatMessages(): Promise<void> {
        // Adding chat messages is handled at the database level
        return
    }
}

class SQLiteAgentMemory_Memory implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    badge: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams

    constructor() {
        this.label = 'SQLite Agent Memory'
        this.name = 'sqliteAgentMemory'
        this.version = 1.0
        this.type = 'SQLiteAgentMemory'
        this.icon = 'sqlite.png'
        this.category = 'Memory'
        this.description = 'Memory for agentflow to remember the state of the conversation using SQLite database'
        this.baseClasses = [this.type, ...getBaseClasses(SqliteSaver)]
        this.inputs = [
            /*{
                label: 'Database File Path',
                name: 'databaseFilePath',
                type: 'string',
                placeholder: 'C:\\Users\\User\\.flowise\\database.sqlite',
                description: 'Path to the SQLite database file. Leave empty to use default application database',
                optional: true
            },*/
            {
                label: 'Additional Connection Configuration',
                name: 'additionalConfig',
                type: 'json',
                additionalParams: true,
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const additionalConfig = nodeData.inputs?.additionalConfig as string
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        const chatflowid = options.chatflowid as string
        const appDataSource = options.appDataSource as DataSource

        let additionalConfiguration = {}
        if (additionalConfig) {
            try {
                additionalConfiguration = typeof additionalConfig === 'object' ? additionalConfig : JSON.parse(additionalConfig)
            } catch (exception) {
                throw new Error('Invalid JSON in the Additional Configuration: ' + exception)
            }
        }

        const threadId = options.sessionId || options.chatId
        const database = path.join(process.env.DATABASE_PATH ?? path.join(getUserHome(), '.flowise'), 'database.sqlite')

        // Initialize SQLiteMemory with the database path and session ID
        return new SQLiteMemory({
            returnMessages: true,
            memoryKey: 'chat_history',
            dbPath: database,
            sessionId: threadId
        })
    }
}

module.exports = { nodeClass: SQLiteAgentMemory_Memory }
