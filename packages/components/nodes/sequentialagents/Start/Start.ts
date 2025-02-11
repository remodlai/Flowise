import { START } from '@langchain/langgraph'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { INode, INodeData, INodeParams, ISeqAgentNode, ICommonObject } from '../../../src/Interface'
import { Moderation } from '../../moderation/Moderation'
import { SaverOptions } from '../../memory/AgentMemory/interface'

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
    credential: INodeParams
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

    private async initializeAgentMemory(options: ICommonObject) {
        const { appDataSource, databaseEntities, sessionId, chatId, chatflowid } = options

        const saverOptions: SaverOptions = {
            datasourceOptions: appDataSource.options,
            threadId: sessionId,
            appDataSource,
            databaseEntities,
            chatflowid
        }

        // Initialize AgentMemory using dynamic import with type assertion
        const AgentMemoryModule = await import('../../memory/AgentMemory/AgentMemory') as { nodeClass: new () => INode }
        const agentMemory = new AgentMemoryModule.nodeClass()
        
        // Create proper INodeData object for initialization
        const nodeData: INodeData = {
            id: `agentMemory_${sessionId}`,
            type: 'AgentMemory',
            category: 'Memory',
            name: 'agentMemory',
            label: 'Agent Memory',
            version: 2.0,
            icon: 'agentmemory.svg',
            baseClasses: ['AgentMemory'],
            inputs: {}
        }

        if (!agentMemory.init) {
            throw new Error('AgentMemory initialization method not found')
        }

        return agentMemory.init(nodeData, '', { ...options, saverOptions })
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const moderations = (nodeData.inputs?.inputModeration as Moderation[]) ?? []
        const model = nodeData.inputs?.model as BaseChatModel
        const providedAgentMemory = nodeData.inputs?.agentMemory
        const initialState = nodeData.inputs?.state ?? {}

        // Initialize AgentMemory if not provided
        const agentMemory = providedAgentMemory ?? await this.initializeAgentMemory(options)

        // Create checkpoint system
        const checkpointMemory = await agentMemory.createCheckpointer({
            configurable: { 
                thread_id: options.sessionId,
                checkpoint_id: options.chatId 
            }
        })

        // Initialize state with overrideConfig if present
        if (options.overrideConfig) {
            const mergedState = {
                messages: [], // Base message state
                ...initialState,
                ...(options.overrideConfig?.state || {}) // Merge overrideConfig state
            }

            await checkpointMemory.putTuple({
                configurable: { 
                    thread_id: options.sessionId,
                    checkpoint_id: options.chatId 
                }
            }, {
                channel_values: mergedState,
                channel_versions: {},
                versions_seen: {},
                pending_sends: []
            })
        } else {
            // Initialize with default state if no overrideConfig
            await checkpointMemory.putTuple({
                configurable: { 
                    thread_id: options.sessionId,
                    checkpoint_id: options.chatId 
                }
            }, {
                channel_values: {
                    messages: [],
                    ...initialState
                },
                channel_versions: {},
                versions_seen: {},
                pending_sends: []
            })
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
