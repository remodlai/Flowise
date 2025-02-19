import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../../src/utils'
import { SaverOptions } from '../interface'
import { ICommonObject, IDatabaseEntity, INode, INodeData, INodeParams, MemoryMethods, FlowiseMemory } from '../../../../src/Interface'
import { DataSource } from 'typeorm'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { Pool } from 'pg'
import { BufferMemoryInput } from 'langchain/memory'

class PostgresMemory extends FlowiseMemory implements MemoryMethods {
    sessionId: string
    pool: Pool
    saver: PostgresSaver

    constructor(fields: BufferMemoryInput & { pool: Pool; sessionId: string }) {
        super(fields)
        this.pool = fields.pool
        this.sessionId = fields.sessionId
        this.saver = new PostgresSaver(this.pool)
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

class PostgresAgentMemory_Memory implements INode {
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
        this.label = 'Postgres Agent Memory'
        this.name = 'postgresAgentMemory'
        this.version = 1.0
        this.type = 'AgentMemory'
        this.icon = 'postgres.svg'
        this.category = 'Memory'
        this.description = 'Memory for agentflow to remember the state of the conversation using Postgres database'
        this.baseClasses = [this.type, ...getBaseClasses(PostgresSaver)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Host',
                name: 'host',
                type: 'string'
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string'
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                default: '5432'
            },
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

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const user = getCredentialParam('user', credentialData, nodeData)
        const password = getCredentialParam('password', credentialData, nodeData)
        const _port = (nodeData.inputs?.port as string) || '5432'
        const port = parseInt(_port)

        // Create a new Postgres Pool with the connection details
        const pool = new Pool({
            host: nodeData.inputs?.host as string,
            port,
            database: nodeData.inputs?.database as string,
            user: user,
            password: password,
            ...additionalConfiguration
        })

        // Initialize PostgresMemory with the pool and session ID
        return new PostgresMemory({
            returnMessages: true,
            memoryKey: 'chat_history',
            pool,
            sessionId: threadId
        })
    }
}

module.exports = { nodeClass: PostgresAgentMemory_Memory }
