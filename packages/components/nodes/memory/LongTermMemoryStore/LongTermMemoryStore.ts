import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph'
import { BaseStore } from '@langchain/langgraph'
import { ICommonObject } from '../../../src/Interface'

interface MemoryValue {
    content: string
    context: string
}

class LongTermMemoryStore_Memory implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Neo4j Long Term Memory Store'
        this.name = 'neo4jLongTermMemoryStore'
        this.version = 1.0
        this.type = 'longTermMemoryStore'
        this.icon = 'memory.svg'
        this.category = 'Memory'
        this.description = 'Persistent memory store using Neo4j for long-term agent memory storage and retrieval'
        this.baseClasses = [this.type, ...getBaseClasses(BaseStore)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['neo4jApi']
        }
        this.inputs = [
            {
                label: 'Collection Prefix',
                name: 'collectionPrefix',
                type: 'string',
                description: 'Prefix for the memory collection (e.g., "memories", "knowledge")',
                default: 'memories'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const url = getCredentialParam('url', credentialData, nodeData)
        const username = getCredentialParam('username', credentialData, nodeData)
        const password = getCredentialParam('password', credentialData, nodeData)
        const collectionPrefix = nodeData.inputs?.collectionPrefix as string || 'memories'

        const neo4jGraph = await Neo4jGraph.initialize({
            url,
            username,
            password
        })

        // Create our store implementation
        class Neo4jMemoryStore extends BaseStore {
            constructor(private graph: Neo4jGraph, private prefix: string) {
                super()
            }

            async mget(keys: string[]): Promise<(MemoryValue | undefined)[]> {
                const query = `
                    MATCH (m:Memory)
                    OPTIONAL MATCH (m)<-[:HAS_CONTEXT]-(u:User)
                    WHERE m.id IN $keys
                    RETURN m
                `

                const result = await this.graph.query(query, { keys })
                const records = (result as any).records || []
                
                return keys.map(key => {
                    const record = records.find((r: any) => r.get('m').properties.id === key)
                    if (!record) return undefined
                    
                    const node = record.get('m').properties
                    return {
                        content: node.content,
                        context: node.context
                    }
                })
            }

            async mset(keyValuePairs: [string, MemoryValue][]): Promise<void> {
                for (const [key, value] of keyValuePairs) {
                    const query = `
                        MERGE (m:Memory {id: $key})
                        SET m += {
                            content: $content,
                            context: $context,
                            collection: $collection,
                            timestamp: timestamp()
                        }
                    `

                    await this.graph.query(query, {
                        key,
                        content: value.content,
                        context: value.context,
                        collection: this.prefix
                    })
                }
            }

            async mdelete(keys: string[]): Promise<void> {
                const query = `
                    MATCH (m:Memory)
                    WHERE m.id IN $keys AND m.collection = $collection
                    DELETE m
                `

                await this.graph.query(query, {
                    keys,
                    collection: this.prefix
                })
            }

            async *yieldKeys(prefix?: string): AsyncGenerator<string> {
                const query = `
                    MATCH (m:Memory)
                    WHERE m.collection = $collection
                    ${prefix ? 'AND m.id STARTS WITH $prefix' : ''}
                    RETURN m.id as id
                `

                const result = await this.graph.query(query, {
                    collection: this.prefix,
                    ...(prefix && { prefix })
                })

                for (const record of (result as any).records || []) {
                    yield record.get('id')
                }
            }

            async batch<Op extends Operation[]>(
                operations: Op
            ): Promise<Array<{ key: string; value?: MemoryValue }>> {
                const results: Array<{ key: string; value?: MemoryValue }> = []
                
                for (const op of operations) {
                    if (op.type === 'get') {
                        const getOp = op as GetOperation
                        const values = await this.mget([getOp.key])
                        results.push({ key: getOp.key, value: values[0] })
                    } else if (op.type === 'set') {
                        const putOp = op as PutOperation
                        await this.mset([[putOp.key, putOp.value]])
                        results.push({ key: putOp.key })
                    } else if (op.type === 'delete') {
                        const deleteOp = op as DeleteOperation
                        await this.mdelete([deleteOp.key])
                        results.push({ key: deleteOp.key })
                    }
                }
                
                return results
            }
        }

        return new Neo4jMemoryStore(neo4jGraph, collectionPrefix)
    }
}

module.exports = { nodeClass: LongTermMemoryStore_Memory } 