import { START } from '@langchain/langgraph'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { BaseMessage } from '@langchain/core/messages'
import { ICommonObject, INode, INodeData, INodeParams, ISeqAgentNode } from '../../../src/Interface'
import { Moderation } from '../../moderation/Moderation'

interface StateConfig {
    Key: string
    Operation: 'Replace' | 'Append'
    'Default Value': any
}

class Start_SeqAgents implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    documentation?: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Start'
        this.name = 'seqStart'
        this.version = 2.0
        this.type = 'Start'
        this.icon = 'start.svg'
        this.category = 'Sequential Agents'
        this.description = 'Starting point of the conversation'
        this.baseClasses = [this.type]
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-1.-start-node'
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                description: `Only compatible with models that are capable of function calling: ChatOpenAI, ChatMistral, ChatAnthropic, ChatGoogleGenerativeAI, ChatVertexAI, GroqChat`
            },
            {
                label: 'Agent Memory',
                name: 'agentMemory',
                type: 'BaseCheckpointSaver',
                description: 'Save the state of the agent',
                optional: true
            },
            {
                label: 'State',
                name: 'state',
                type: 'State',
                description:
                    'State is an object that is updated by nodes in the graph, passing from one node to another. By default, state contains "messages" that got updated with each message sent and received.',
                optional: true
            },
            {
                label: 'Input Moderation',
                description: 'Detect text that could generate harmful output and prevent it from being sent to the language model',
                name: 'inputModeration',
                type: 'Moderation',
                optional: true,
                list: true
            }
        ]
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const moderations = (nodeData.inputs?.inputModeration as Moderation[]) ?? []
        const model = nodeData.inputs?.model as BaseChatModel
        const agentMemory = nodeData.inputs?.agentMemory
        const overrideConfig = options.overrideConfig || {}
        const sessionId = overrideConfig.sessionId || options.sessionId

        // Initialize base state with messages array
        const baseState: ICommonObject = {
            messages: [] as BaseMessage[]
        }

        // Track operation types for state updates
        const operationTypes: Record<string, 'Replace' | 'Append'> = {
            messages: 'Append' // messages always uses Append
        }

        // Get existing state from memory if available
        let checkpointMemory
        const memoryConfig = {
            configurable: {
                thread_id: sessionId,
                checkpoint_id: sessionId
            }
        }

        if (agentMemory) {
            if (typeof agentMemory.createCheckpointer === 'function') {
                // Get existing state first
                const existingCheckpoint = await agentMemory.getTuple?.(memoryConfig)
                const initialState = existingCheckpoint?.channel_values ?? baseState
                checkpointMemory = await agentMemory.createCheckpointer(initialState)
            } else if (typeof agentMemory.put === 'function' && typeof agentMemory.getTuple === 'function') {
                checkpointMemory = agentMemory
                
                // Get existing state
                const existingState = await checkpointMemory.getTuple(memoryConfig)
                
                if (!existingState) {
                    // Only create initial checkpoint if no state exists
                    const checkpoint = {
                        v: 1,
                        id: sessionId,
                        ts: new Date().toISOString(),
                        channel_values: baseState,
                        channel_versions: {},
                        versions_seen: {},
                        pending_sends: []
                    }
                    const metadata = {
                        source: 'input',
                        step: 0,
                        writes: null,
                        parents: {}
                    }
                    await checkpointMemory.put(memoryConfig, checkpoint, metadata, {})
                }
            }
        } else {
            // Create default memory with state persistence
            checkpointMemory = {
                getTuple: async () => {
                    // Apply override config if present
                    if (overrideConfig.stateMemory) {
                        const overrides = overrideConfig.stateMemory as StateConfig[]
                        for (const override of overrides) {
                            const key = override.Key
                            if (!key) continue
                            
                            let value = override['Default Value']
                            // Try to parse value if it's a stringified JSON
                            if (typeof value === 'string' && value.trim().startsWith('{')) {
                                try {
                                    value = JSON.parse(value)
                                } catch (e) {
                                    // Keep as string if parsing fails
                                }
                            }

                            // Initialize as array if operation is Append
                            baseState[key] = override.Operation === 'Append' ? 
                                (Array.isArray(value) ? value : [value]) : value
                            operationTypes[key] = override.Operation
                        }
                    }
                    return {
                        channel_values: baseState,
                        channel_versions: {},
                        versions_seen: {}
                    }
                },
                putTuple: async (tuple: any) => {
                    const state = tuple.channel_values || tuple
                    Object.entries(state).forEach(([key, value]) => {
                        const operation = operationTypes[key] || 'Replace'
                        
                        if (operation === 'Append') {
                            // Ensure baseState[key] is an array
                            if (!Array.isArray(baseState[key])) {
                                baseState[key] = baseState[key] !== undefined ? [baseState[key]] : []
                            }
                            
                            // Handle array or single value for appending
                            if (Array.isArray(value)) {
                                baseState[key] = baseState[key].concat(value)
                            } else if (value !== undefined && value !== null) {
                                baseState[key].push(value)
                            }
                        } else {
                            // Replace operation
                            if (value !== undefined && value !== null) {
                                baseState[key] = value
                            }
                        }
                    })
                    return {
                        channel_values: baseState,
                        channel_versions: tuple.channel_versions || {},
                        versions_seen: tuple.versions_seen || {}
                    }
                }
            }
        }

        const returnOutput: ISeqAgentNode = {
            id: nodeData.id,
            node: START,
            name: START,
            label: START,
            type: 'start',
            output: START,
            llm: model,
            startLLM: model,
            moderations,
            checkpointMemory
        }

        return returnOutput
    }
}

module.exports = { nodeClass: Start_SeqAgents }

