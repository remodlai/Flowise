import { START } from '@langchain/langgraph'
import { BaseMessage } from '@langchain/core/messages'
import { ICommonObject, INode, INodeData, INodeParams, ISeqAgentNode } from '../../../src/Interface'

const howToUse = `
Specify the Key, Operation Type, and Default Value for the state object.

**Operations**
- Replace: Replaces the existing value with the new value
- Append: Adds new value(s) to the existing array. If target is not an array, it will be converted to one

**State Values**
- Values can be any valid JSON value (string, number, boolean, array, object)
- The 'messages' array is always available by default for chat history
- The 'messages' array always uses Append operation
`

class State_SeqAgents implements INode {
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
        this.label = 'State'
        this.name = 'seqState'
        this.version = 2.0
        this.type = 'State'
        this.icon = 'state.svg'
        this.category = 'Sequential Agents'
        this.description = 'A centralized state object, updated by nodes in the graph, passing from one node to another'
        this.baseClasses = [this.type]
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-3.-state-node'
        this.inputs = [
            {
                label: 'Custom State',
                name: 'stateMemory',
                type: 'datagrid',
                description: 'Structure for state. By default, state contains "messages" that got updated with each message sent and received.',
                hint: {
                    label: 'How to use',
                    value: howToUse
                },
                datagrid: [
                    { field: 'key', headerName: 'Key', editable: true },
                    {
                        field: 'operation',
                        headerName: 'Operation',
                        type: 'singleSelect',
                        valueOptions: ['Replace', 'Append'],
                        editable: true
                    },
                    { field: 'defaultValue', headerName: 'Default Value', flex: 1, editable: true }
                ],
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const stateMemoryStr = nodeData.inputs?.stateMemory as string
        const overrideConfig = nodeData.inputs?.overrideConfig as ICommonObject || {}

        // Initialize base state with messages array
        const baseState: ICommonObject = {
            messages: [] as BaseMessage[]
        }

        // Track operation types for each key
        const operationTypes: Record<string, 'Replace' | 'Append'> = {
            messages: 'Append' // messages always uses Append
        }

        // Process state configuration
        if (stateMemoryStr) {
            try {
                const stateConfig = typeof stateMemoryStr === 'string' ? JSON.parse(stateMemoryStr) : stateMemoryStr
                for (const item of stateConfig) {
                    const key = item.key
                    if (!key) throw new Error('Key is required')
                    
                    let defaultValue = item.defaultValue
                    // Try to parse defaultValue if it's a stringified JSON
                    if (typeof defaultValue === 'string' && defaultValue.trim().startsWith('{')) {
                        try {
                            defaultValue = JSON.parse(defaultValue)
                        } catch (e) {
                            // Keep as string if parsing fails
                        }
                    }

                    // Initialize as array if operation is Append
                    baseState[key] = item.operation === 'Append' ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue]) : defaultValue
                    operationTypes[key] = item.operation || 'Replace'
                }
            } catch (e) {
                throw new Error(`Error parsing state config: ${e}`)
            }
        }

        // Apply override config if present
        if (overrideConfig.stateMemory) {
            for (const override of overrideConfig.stateMemory) {
                const key = override.key
                if (!key) continue
                
                let value = override.defaultValue
                // Try to parse value if it's a stringified JSON
                if (typeof value === 'string' && value.trim().startsWith('{')) {
                    try {
                        value = JSON.parse(value)
                    } catch (e) {
                        // Keep as string if parsing fails
                    }
                }

                // Initialize as array if operation is Append
                baseState[key] = override.operation === 'Append' ? (Array.isArray(value) ? value : [value]) : value
                operationTypes[key] = override.operation || 'Replace'
            }
        }

        // Create checkpoint memory for state persistence
        const checkpointMemory = {
            getTuple: async () => baseState,
            putTuple: async (tuple: any) => {
                Object.entries(tuple).forEach(([key, value]) => {
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
                return baseState
            }
        }

        const returnOutput: ISeqAgentNode = {
            id: nodeData.id,
            node: baseState,
            name: 'state',
            label: 'state',
            type: 'state',
            output: START,
            checkpointMemory
        }

        return returnOutput
    }
}

module.exports = { nodeClass: State_SeqAgents }
