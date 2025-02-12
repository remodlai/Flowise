import { START } from '@langchain/langgraph'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { INode, INodeData, INodeParams, ISeqAgentNode, ISeqAgentsState, ICommonObject, FlowiseCheckpoint, StateData } from '../../../src/Interface'
import { Moderation } from '../../moderation/Moderation'
import { BaseMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { updateStateMessages, MessagesState, createInitialState } from '../commonUtils'

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

    async init(nodeData: INodeData): Promise<any> {
        const moderations = (nodeData.inputs?.inputModeration as Moderation[]) ?? []
        const model = nodeData.inputs?.model as BaseChatModel
        const agentMemory = nodeData.inputs?.agentMemory

        // Create a default checkpointer if none provided
        const checkpointMemory = agentMemory ?? {
            getTuple: async () => {
                const checkpoint: FlowiseCheckpoint = {
                    v: 1,
                    id: 'default',
                    ts: new Date().toISOString(),
                    channel_values: {
                        messages: [] as BaseMessage[]
                    },
                    channel_versions: {},
                    versions_seen: {},
                    pending_sends: []
                }
                return {
                    checkpoint,
                    metadata: {
                        source: 'input',
                        step: 0,
                        writes: null,
                        parents: {}
                    }
                }
            },
            putTuple: async (tuple: any) => {},
            deleteTuple: async () => {},
            putWrites: async () => {},
            list: async function* () {
                yield* []
            },
            delete: async () => {}
        }

        // Create worker node to handle initial message
        const workerNode = async (state: MessagesState, config: RunnableConfig) => {
            // First try to get existing state from checkpoint
            let currentState: MessagesState
            
            try {
                const existingState = await checkpointMemory.getTuple()
                if (existingState?.checkpoint) {
                    // Use existing state if available, preserving custom values
                    currentState = {
                        ...state,  // Keep all custom values from State node
                        messages: state.messages || existingState.checkpoint.channel_values.messages || [], 
                        checkpoint: {
                            ...existingState.checkpoint,
                            channel_values: {
                                ...existingState.checkpoint.channel_values,
                                ...state  // Add custom state values to channel_values
                            }
                        }
                    }
                } else {
                    // Initialize new state while preserving custom values from State node
                    currentState = createInitialState(nodeData.id, state)
                }
            } catch (error) {
                // Fallback to new state while preserving custom values from State node
                currentState = createInitialState(nodeData.id, state)
            }

            // Get the input messages from config
            const configMessages = config.configurable?.messages as BaseMessage[]
            if (configMessages?.length) {
                // Ensure we're working with BaseMessage objects
                const validMessages = configMessages.filter(msg => msg instanceof BaseMessage)
                if (validMessages.length) {
                    // Update state with new messages using utility function
                    currentState = updateStateMessages(currentState, validMessages)
                }
            }

            // Return state with preserved history and proper structure
            return currentState
        }

        const returnOutput: ISeqAgentNode = {
            id: nodeData.id,
            node: workerNode,
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
