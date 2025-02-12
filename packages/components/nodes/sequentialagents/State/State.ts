import { START } from '@langchain/langgraph'
import { NodeVM } from '@flowiseai/nodevm'
import { DataSource } from 'typeorm'
import { ICommonObject, IDatabaseEntity, INode, INodeData, INodeParams, ISeqAgentNode, FlowiseCheckpoint } from '../../../src/Interface'
import { availableDependencies, defaultAllowBuiltInDep, getVars, prepareSandboxVars } from '../../../src/utils'
import { createInitialState, updateStateValue, MessagesState } from '../commonUtils'

interface StateOperation {
    __stateOperation: 'append' | 'replace'
    value: any
}

interface StateValues {
    [key: string]: StateOperation
}

const defaultFunc = `{
    // Define initial state values
    state: {
        // Simple key-value pairs
        myKey: "myValue",
        
        // Array that can be appended to
        myArray: ["item1", "item2"],
        
        // Complex state example
        userPreferences: {
            theme: "dark",
            notifications: true
        }
    }
}`

const howToUse = `
Specify the Key, Operation Type, and Default Value for the state object. The Operation Type can be either "Replace" or "Append".

**Replace**
- Replace the existing value with the new value.
- If the new value is null, the existing value will be retained.

**Append**
- Append the new value to the existing value.
- Default value can be empty or an array. Ex: ["a", "b"]
- Final value is an array.
`
const TAB_IDENTIFIER = 'selectedStateTab'

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
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'State'
        this.name = 'seqState'
        this.version = 3.0
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
                type: 'tabs',
                tabIdentifier: TAB_IDENTIFIER,
                additionalParams: true,
                default: 'stateMemoryUI',
                tabs: [
                    {
                        label: 'Custom State (Table)',
                        name: 'stateMemoryUI',
                        type: 'datagrid',
                        description:
                            'Structure for state. By default, state contains "messages" that got updated with each message sent and received.',
                        hint: {
                            label: 'How to use',
                            value: howToUse
                        },
                        datagrid: [
                            { field: 'key', headerName: 'Key', editable: true },
                            {
                                field: 'type',
                                headerName: 'Operation',
                                type: 'singleSelect',
                                valueOptions: ['Replace', 'Append'],
                                editable: true
                            },
                            { field: 'defaultValue', headerName: 'Default Value', flex: 1, editable: true }
                        ],
                        optional: true,
                        additionalParams: true
                    },
                    {
                        label: 'Custom State (Code)',
                        name: 'stateMemoryCode',
                        type: 'code',
                        description: `JSON object representing the state`,
                        hideCodeExecute: true,
                        codeExample: defaultFunc,
                        optional: true,
                        additionalParams: true
                    }
                ]
            }
        ]
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`] as string
        const stateMemoryUI = nodeData.inputs?.stateMemoryUI as string
        const stateMemoryCode = nodeData.inputs?.stateMemoryCode as string
        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'stateMemoryUI'
        const stateMemory = nodeData.inputs?.stateMemory as string

        const processStateInput = (input: any): StateValues => {
            const stateValues: StateValues = {}
            
            if (Array.isArray(input)) {
                // Handle UI table input
                for (const item of input) {
                    const key = item.key || item.Key
                    if (!key) throw new Error('Key is required')
                    const type = item.type || item.Operation
                    const defaultValue = item.defaultValue || item['Default Value']

                    try {
                        if (type === 'Append') {
                            // For append operations, store the initial value and operation type
                            stateValues[key] = {
                                __stateOperation: 'append',
                                value: defaultValue ? JSON.parse(defaultValue) : []
                            }
                        } else {
                            // For replace operations, store the value directly
                            stateValues[key] = {
                                __stateOperation: 'replace',
                                value: defaultValue
                            }
                        }
                    } catch (e) {
                        throw new Error(`Invalid default value for key ${key}: ${e.message}`)
                    }
                }
            } else if (typeof input === 'object' && input !== null) {
                // Handle code input (direct object)
                if (input.state && typeof input.state === 'object') {
                    // New format with explicit state object
                    Object.entries(input.state).forEach(([key, value]) => {
                        stateValues[key] = {
                            __stateOperation: 'replace',
                            value: value
                        }
                    })
                } else {
                    // Legacy format or direct state object
                    Object.entries(input).forEach(([key, value]) => {
                        stateValues[key] = {
                            __stateOperation: 'replace',
                            value: value
                        }
                    })
                }
            }

            return stateValues
        }

        const createCheckpointer = (initialStateValues: StateValues) => {
            // Create initial state with proper structure
            let currentState = createInitialState(nodeData.id)

            // Apply initial values to channel_values
            if (initialStateValues) {
                Object.entries(initialStateValues).forEach(([key, stateOp]) => {
                    const operation = stateOp as StateOperation
                    if (operation.__stateOperation === 'append') {
                        const currentValue = currentState.checkpoint.channel_values[key]
                        const valueToAppend = Array.isArray(operation.value) ? operation.value : [operation.value]
                        currentState.checkpoint.channel_values = {
                            ...currentState.checkpoint.channel_values,
                            [key]: Array.isArray(currentValue) ? [...currentValue, ...valueToAppend] : valueToAppend
                        }
                    } else {
                        currentState.checkpoint.channel_values = {
                            ...currentState.checkpoint.channel_values,
                            [key]: operation.value
                        }
                    }
                })
            }

            return {
                getTuple: async (config?: any) => {
                    // Handle overrideConfig from API calls
                    if (config?.configurable?.state) {
                        Object.entries(config.configurable.state).forEach(([key, stateOp]) => {
                            const operation = stateOp as StateOperation
                            if (operation.__stateOperation === 'append') {
                                const currentValue = currentState.checkpoint.channel_values[key]
                                const valueToAppend = Array.isArray(operation.value) ? operation.value : [operation.value]
                                currentState.checkpoint.channel_values = {
                                    ...currentState.checkpoint.channel_values,
                                    [key]: Array.isArray(currentValue) ? [...currentValue, ...valueToAppend] : valueToAppend
                                }
                            } else {
                                currentState.checkpoint.channel_values = {
                                    ...currentState.checkpoint.channel_values,
                                    [key]: operation.value
                                }
                            }
                        })
                    }
                    return currentState
                },
                putTuple: async (tuple: MessagesState) => {
                    currentState = { ...currentState, ...tuple }
                },
                deleteTuple: async () => {
                    currentState = createInitialState(nodeData.id)
                }
            }
        }

        try {
            let stateValues: StateValues = {}

            if (stateMemory && stateMemory !== 'stateMemoryUI' && stateMemory !== 'stateMemoryCode') {
                const parsedSchema = typeof stateMemory === 'string' ? JSON.parse(stateMemory) : stateMemory
                stateValues = processStateInput(parsedSchema)
            } else if (selectedTab === 'stateMemoryUI' && stateMemoryUI) {
                const parsedSchema = typeof stateMemoryUI === 'string' ? JSON.parse(stateMemoryUI) : stateMemoryUI
                stateValues = processStateInput(parsedSchema)
            } else if (selectedTab === 'stateMemoryCode' && stateMemoryCode) {
                const variables = await getVars(appDataSource, databaseEntities, nodeData)
                const flow = {
                    chatflowId: options.chatflowid,
                    sessionId: options.sessionId,
                    chatId: options.chatId,
                    input
                }

                const sandbox = {
                    util: undefined,
                    Symbol: undefined,
                    child_process: undefined,
                    fs: undefined,
                    process: undefined,
                    '$vars': prepareSandboxVars(variables),
                    '$flow': flow
                }

                const builtinDeps = process.env.TOOL_FUNCTION_BUILTIN_DEP
                    ? defaultAllowBuiltInDep.concat(process.env.TOOL_FUNCTION_BUILTIN_DEP.split(','))
                    : defaultAllowBuiltInDep
                const externalDeps = process.env.TOOL_FUNCTION_EXTERNAL_DEP ? process.env.TOOL_FUNCTION_EXTERNAL_DEP.split(',') : []
                const deps = availableDependencies.concat(externalDeps)

                const vm = new NodeVM({
                    console: 'inherit',
                    sandbox,
                    require: {
                        external: { modules: deps },
                        builtin: builtinDeps
                    },
                    eval: false,
                    wasm: false,
                    timeout: 10000
                })

                const response = await vm.run(`module.exports = async function() {return ${stateMemoryCode}}()`, __dirname)
                if (typeof response !== 'object') throw new Error('State must be an object')
                stateValues = response
            }

            const returnOutput: ISeqAgentNode = {
                id: nodeData.id,
                node: stateValues,
                name: 'state',
                label: 'state',
                type: 'state',
                output: START,
                checkpointMemory: createCheckpointer(stateValues)
            }
            return returnOutput
        } catch (e) {
            throw new Error(`Error initializing state: ${e.message}`)
        }
    }
}

module.exports = { nodeClass: State_SeqAgents }
