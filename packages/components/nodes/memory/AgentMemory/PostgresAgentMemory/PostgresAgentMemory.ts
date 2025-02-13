import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../../src/utils'
import { SaverOptions } from '../interface'
import { ICommonObject, IDatabaseEntity, INode, INodeData, INodeParams } from '../../../../src/Interface'
import { DataSource } from 'typeorm'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

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
                label: 'Connection Type',
                name: 'connectionType',
                type: 'options',
                options: [
                    {
                        label: 'Direct Database',
                        name: 'direct'
                    },
                    {
                        label: 'Connection Pool',
                        name: 'pool'
                    }
                ],
                default: 'direct'
            },
            {
                label: 'Host',
                name: 'host',
                type: 'string',
                placeholder: 'localhost'
            },
            {
                label: 'Database',
                name: 'database',
                type: 'string',
                placeholder: 'flowise'
            },
            {
                label: 'Port',
                name: 'port',
                type: 'number',
                default: 5432,
                placeholder: '5432'
            },
            {
                label: 'Max Pool Size',
                name: 'maxPoolSize',
                type: 'number',
                description: 'Maximum number of clients the pool should contain',
                default: 10,
                optional: {
                    'inputs.connectionType': ['pool']
                }
            },
            {
                label: 'Idle Timeout',
                name: 'idleTimeout',
                type: 'number',
                description: 'Time in milliseconds a client must sit idle before being closed',
                default: 10000,
                optional: {
                    'inputs.connectionType': ['pool']
                }
            },
            {
                label: 'Connection Timeout',
                name: 'connectionTimeout',
                type: 'number',
                description: 'Time in milliseconds to wait for a connection',
                default: 0,
                optional: {
                    'inputs.connectionType': ['pool']
                }
            },
            {
                label: 'SSL Mode',
                name: 'ssl',
                type: 'options',
                options: [
                    {
                        label: 'Disable',
                        name: 'disable'
                    },
                    {
                        label: 'Allow',
                        name: 'allow'
                    },
                    {
                        label: 'Prefer',
                        name: 'prefer'
                    },
                    {
                        label: 'Require',
                        name: 'require'
                    },
                    {
                        label: 'Verify CA',
                        name: 'verify-ca'
                    },
                    {
                        label: 'Verify Full',
                        name: 'verify-full'
                    }
                ],
                default: 'disable',
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
        const connectionType = nodeData.inputs?.connectionType as string || 'direct'

        const datasourceOptions: ICommonObject = {
            ...additionalConfiguration,
            type: 'postgres',
            host: nodeData.inputs?.host as string,
            port,
            database: nodeData.inputs?.database as string,
            username: user,
            user: user,
            password: password
        }

        // Only add pool configuration if pool connection type is selected
        if (connectionType === 'pool') {
            if (nodeData.inputs?.maxPoolSize) datasourceOptions.max = parseInt((nodeData.inputs.maxPoolSize as string) || '10')
            if (nodeData.inputs?.idleTimeout) datasourceOptions.idleTimeoutMillis = parseInt((nodeData.inputs.idleTimeout as string) || '10000')
            if (nodeData.inputs?.connectionTimeout) datasourceOptions.connectionTimeoutMillis = parseInt((nodeData.inputs.connectionTimeout as string) || '0')
        }
        
        // Add SSL configuration if provided
        if (nodeData.inputs?.ssl && nodeData.inputs.ssl !== 'disable') {
            datasourceOptions.ssl = nodeData.inputs.ssl
        }

        // const args: SaverOptions = {
        //     datasourceOptions,
        //     threadId,
        //     appDataSource,
        //     databaseEntities,
        //     chatflowid
        // }
        const connString = `postgresql://${datasourceOptions.user}:${datasourceOptions.password}@${datasourceOptions.host}:${datasourceOptions.port}/${datasourceOptions.database}`
        const pgRecordManager = PostgresSaver.fromConnString(connString)
        return pgRecordManager
    }
}

module.exports = { nodeClass: PostgresAgentMemory_Memory }
