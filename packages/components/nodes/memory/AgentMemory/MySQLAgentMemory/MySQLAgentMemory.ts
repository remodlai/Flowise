import { INode, INodeData, INodeParams, ICommonObject } from '../../../../src/Interface'
import { MySQLSaver } from './mysqlSaver'

class MySQLAgentMemory_Memory implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'MySQL Agent Memory'
        this.name = 'mysqlAgentMemory'
        this.version = 1.0
        this.type = 'MySQLAgentMemory'
        this.icon = 'mysql.svg'
        this.category = 'Memory'
        this.description = 'Store agent state and conversation history in MySQL'
        this.baseClasses = ['BaseCheckpointSaver']
        this.inputs = [
            {
                label: 'Connection Host',
                name: 'host',
                type: 'string',
                placeholder: 'localhost'
            },
            {
                label: 'Connection Port',
                name: 'port',
                type: 'number',
                placeholder: '3306'
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string'
            },
            {
                label: 'Username',
                name: 'username',
                type: 'string'
            },
            {
                label: 'Password',
                name: 'password',
                type: 'password'
            },
            {
                label: 'Thread ID',
                name: 'threadId',
                type: 'string',
                description: 'Thread ID to store memory',
                placeholder: 'thread-id'
            }
        ]
    }

    async init(nodeData: INodeData, input: string, options?: ICommonObject): Promise<any> {
        const host = nodeData.inputs?.host as string
        const port = nodeData.inputs?.port as number
        const database = nodeData.inputs?.database as string
        const username = nodeData.inputs?.username as string
        const password = nodeData.inputs?.password as string
        const threadId = nodeData.inputs?.threadId as string || options?.sessionId || options?.chatId

        const datasourceOptions = {
            type: 'mysql',
            host,
            port,
            username,
            password,
            database,
            synchronize: true
        }

        return new MySQLSaver({
            datasourceOptions,
            threadId,
            appDataSource: options?.appDataSource as any,
            databaseEntities: options?.databaseEntities as any,
            chatflowid: options?.chatflowid as string
        })
    }
}

module.exports = { nodeClass: MySQLAgentMemory_Memory }
