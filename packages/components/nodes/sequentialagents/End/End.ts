import { END } from '@langchain/langgraph'
import { RunnableConfig } from '@langchain/core/runnables'
import { BaseMessage, SystemMessage, HumanMessage } from '@langchain/core/messages'
import { INode, INodeData, INodeParams, ISeqAgentNode, ISeqAgentsState, INodeOutputsValue } from '../../../src/Interface'
import { FlowiseCheckpoint, StateData } from '../../memory/AgentMemory/interface'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

interface IExtendedSeqAgentsState extends Omit<ISeqAgentsState, 'messages'> {
    messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => BaseMessage[]
        default: () => BaseMessage[]
    }
    state: Record<string, any>
    checkpoint?: FlowiseCheckpoint
}

class End_SeqAgents implements INode {
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
    outputs: INodeOutputsValue[]
    hideOutput: boolean

    constructor() {
        this.label = 'End'
        this.name = 'seqEnd'
        this.version = 2.2
        this.type = 'End'
        this.icon = 'end.svg'
        this.category = 'Sequential Agents'
        this.description = 'End conversation'
        this.baseClasses = [this.type]
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-10.-end-node'
        this.inputs = [
            {
                label: 'Sequential Node',
                name: 'sequentialNode',
                type: 'Agent | Condition | LLMNode | ToolNode | CustomFunction | ExecuteFlow',
                description:
                    'Can be connected to one of the following nodes: Agent, Condition, LLM Node, Tool Node, Custom Function, Execute Flow'
            },
            {
                label: 'Enable Streaming',
                name: 'enableStreaming',
                type: 'boolean',
                description: 'Stream the response back to the user',
                default: false,
                optional: true
            },
            {
                label: 'Final Model',
                name: 'finalModel',
                type: 'BaseChatModel',
                description: 'Optional model to process the final response (e.g., for reformatting)',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Final System Prompt',
                name: 'finalSystemPrompt',
                type: 'string',
                description: 'System prompt for final model processing',
                rows: 4,
                optional: true,
                additionalParams: true
            }
        ]
        this.outputs = [
            {
                label: 'Memory Manager',
                name: 'memoryManager',
                baseClasses: ['MemoryManager', 'SummaryMemory', 'VectorMemory', 'CrossThreadMemory'],
                description: 'Connect to memory manager nodes for post-processing conversation history'
            }
        ]
        this.hideOutput = false
    }

    async init(nodeData: INodeData): Promise<any> {
        const sequentialNode = nodeData.inputs?.sequentialNode as ISeqAgentNode
        if (!sequentialNode) throw new Error('End must have a predecessor!')

        const endWorker = async (state: IExtendedSeqAgentsState, config: RunnableConfig) => {
            try {
                let checkpoint = state.checkpoint
                if (!checkpoint) {
                    // Create default checkpoint if none exists
                    const checkpointId = config?.configurable?.checkpoint_id || nodeData.id
                    const threadId = config?.configurable?.thread_id || 'default'
                    checkpoint = {
                        v: 1,
                        id: checkpointId,
                        ts: new Date().toISOString(),
                        channel_values: {
                            messages: state.messages.value([], []),
                            state: state.state
                        },
                        channel_versions: {},
                        versions_seen: {},
                        pending_sends: []
                    }
                    state.checkpoint = checkpoint
                }

                // Get the final state
                const messages = state.messages.value([], [])
                const lastMessage = messages[messages.length - 1]

                // If streaming is enabled and we have a final model
                if (nodeData.inputs?.enableStreaming && nodeData.inputs?.finalModel) {
                    const finalModel = nodeData.inputs.finalModel as BaseChatModel
                    const systemPrompt = nodeData.inputs?.finalSystemPrompt || ''

                    // Configure the final model with streaming tag
                    const taggedModel = finalModel.withConfig({
                        tags: ['final_node']
                    })

                    // Process final response if needed
                    const finalResponse = await taggedModel.invoke([
                        ...(systemPrompt ? [new SystemMessage(systemPrompt)] : []),
                        new HumanMessage({ content: lastMessage.content })
                    ])

                    // Preserve message ID for state management
                    finalResponse.id = lastMessage.id

                    // Update checkpoint with processed response
                    checkpoint.channel_values = {
                        ...checkpoint.channel_values,
                        messages: [...messages.slice(0, -1), finalResponse],
                        state: state.state
                    }

                    // Mark checkpoint as completed
                    checkpoint.ts = new Date().toISOString()
                    checkpoint.v += 1

                    return {
                        ...state,
                        checkpoint,
                        messages: [...messages.slice(0, -1), finalResponse],
                        state: state.state,
                        _stream: true,
                        _tags: ['final_node']
                    }
                }

                // Regular non-streaming response
                checkpoint.channel_values = {
                    ...checkpoint.channel_values,
                    messages: messages,
                    state: state.state
                }

                // Mark checkpoint as completed
                checkpoint.ts = new Date().toISOString()
                checkpoint.v += 1

                return {
                    ...state,
                    checkpoint,
                    messages,
                    state: state.state
                }
            } catch (error) {
                console.error('Error in End node:', error)
                throw error
            }
        }

        const returnOutput: ISeqAgentNode = {
            id: nodeData.id,
            node: endWorker,
            name: END,
            label: END,
            type: 'end',
            output: END,
            predecessorAgents: [sequentialNode]
        }

        return returnOutput
    }
}

module.exports = { nodeClass: End_SeqAgents }
