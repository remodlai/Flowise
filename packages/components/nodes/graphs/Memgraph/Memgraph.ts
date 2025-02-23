import { getBaseClasses, getCredentialData } from '../../../src/utils'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { MemgraphGraph } from '@langchain/community/graphs/memgraph_graph'
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph'

class Memgraph_Graphs implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Memgraph'
        this.name = 'Memgraph'
        this.version = 1.0
        this.type = 'Memgraph'
        this.icon = 'memgraph.svg'
        this.category = 'Graph'
        this.description = 'Connect with Memgraph graph database'
        this.baseClasses = [this.type, ...getBaseClasses(MemgraphGraph)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['memgraphApi']
        }
        this.inputs = [
            {
                label: 'Database',
                name: 'database',
                type: 'string',
                placeholder: 'memgraph',
                optional: true
            },
            {
                label: 'Timeout (ms)',
                name: 'timeoutMs',
                type: 'number',
                default: 5000,
                optional: true
            },
            {
                label: 'Enhanced Schema',
                name: 'enhancedSchema',
                type: 'boolean',
                default: false,
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const database = nodeData.inputs?.database as string
        const timeoutMs = nodeData.inputs?.timeoutMs as number
        const enhancedSchema = nodeData.inputs?.enhancedSchema as boolean
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const neo4jConfig = {
            url: credentialData?.url,
            username: credentialData?.username,
            password: credentialData?.password
        }

        const memgraphGraph = await MemgraphGraph.initialize({
            ...neo4jConfig,
            ...(database && { database }),
            ...(timeoutMs && { timeoutMs }),
            ...(enhancedSchema && { enhancedSchema })
        })

        return memgraphGraph
    }
}

module.exports = { nodeClass: Memgraph_Graphs }
