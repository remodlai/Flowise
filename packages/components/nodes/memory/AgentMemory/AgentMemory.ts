import path from 'path'
import { getBaseClasses, getCredentialData, getCredentialParam, getUserHome } from '../../../src/utils'
import { SaverOptions } from './interface'
import { ICommonObject, IDatabaseEntity, INode, INodeData, INodeParams } from '../../../src/Interface'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'
import { DataSource } from 'typeorm'

class AgentMemory_Memory implements INode {
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
        this.label = 'Agent Memory'
        this.name = 'agentMemory'
        this.version = 2.0
        this.type = 'AgentMemory'
        this.icon = 'agentmemory.svg'
        this.category = 'Memory'
        this.description = 'Memory for agentflow to remember the state of the conversation'
        this.baseClasses = [this.type, ...getBaseClasses(SqliteSaver)]
        this.badge = 'DEPRECATING'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['PostgresApi', 'MySQLApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Database',
                name: 'databaseType',
                type: 'options',
                options: [
                    {
                        label: 'SQLite',
                        name: 'sqlite'
                    },
                    {
                        label: 'PostgreSQL',
                        name: 'postgres'
                    },
                    {
                        label: 'MySQL',
                        name: 'mysql'
                    }
                ],
                default: 'sqlite'
            },
            {
                label: 'Database File Path',
                name: 'databaseFilePath',
                type: 'string',
                placeholder: 'C:\\Users\\User\\.flowise\\database.sqlite',
                description:
                    'If SQLite is selected, provide the path to the SQLite database file. Leave empty to use default application database',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Host',
                name: 'host',
                type: 'string',
                description: 'If PostgresQL/MySQL is selected, provide the host of the database',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string',
                description: 'If PostgresQL/MySQL is selected, provide the name of the database',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                description: 'If PostgresQL/MySQL is selected, provide the port of the database',
                additionalParams: true,
                optional: true
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
        const databaseFilePath = nodeData.inputs?.databaseFilePath as string
        const databaseType = nodeData.inputs?.databaseType as string

        let additionalConfiguration = {}
        if (additionalConfig) {
            try {
                additionalConfiguration = typeof additionalConfig === 'object' ? additionalConfig : JSON.parse(additionalConfig)
            } catch (exception) {
                throw new Error('Invalid JSON in the Additional Configuration: ' + exception)
            }
        }

        if (databaseType === 'sqlite') {
            const database = databaseFilePath
                ? path.resolve(databaseFilePath)
                : path.join(process.env.DATABASE_PATH ?? path.join(getUserHome(), '.flowise'), 'database.sqlite')
            return `sqlite://${database}`
        } else if (databaseType === 'postgres') {
            const credentialData = await getCredentialData(nodeData.credential ?? '', options)
            const user = getCredentialParam('user', credentialData, nodeData)
            const password = getCredentialParam('password', credentialData, nodeData)
            const _port = (nodeData.inputs?.port as string) || '5432'
            const port = parseInt(_port)
            const host = nodeData.inputs?.host as string
            const database = nodeData.inputs?.database as string
            return `postgres://${user}:${password}@${host}:${port}/${database}`
        }

        return undefined
    }
}

module.exports = { nodeClass: AgentMemory_Memory }
