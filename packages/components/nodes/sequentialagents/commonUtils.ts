import { get } from 'lodash'
import { z } from 'zod'
import { DataSource } from 'typeorm'
import { NodeVM } from '@flowiseai/nodevm'
import { StructuredTool } from '@langchain/core/tools'
import { ChatMistralAI } from '@langchain/mistralai'
import { ChatAnthropic } from '@langchain/anthropic'
import { Runnable, RunnableConfig, mergeConfigs } from '@langchain/core/runnables'
import { AIMessage, BaseMessage, HumanMessage, MessageContentImageUrl, ToolMessage } from '@langchain/core/messages'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { addImagesToMessages, llmSupportsVision } from '../../src/multiModalUtils'
import {
    ICommonObject,
    IDatabaseEntity,
    INodeData,
    ISeqAgentsState,
    IVisionChatModal,
    ConversationHistorySelection
} from '../../src/Interface'
import { availableDependencies, defaultAllowBuiltInDep, getVars, prepareSandboxVars } from '../../src/utils'
import { ChatPromptTemplate, BaseMessagePromptTemplateLike } from '@langchain/core/prompts'
import { SendProtocol } from '@langchain/langgraph-checkpoint'
import { FlowiseCheckpoint } from '../../src/Interface'

export const checkCondition = (input: string | number | undefined, condition: string, value: string | number = ''): boolean => {
    if (!input && condition === 'Is Empty') return true
    else if (!input) return false

    // Function to check if a string is a valid number
    const isNumericString = (str: string): boolean => /^-?\d*\.?\d+$/.test(str)

    // Function to convert input to number if possible
    const toNumber = (val: string | number): number => {
        if (typeof val === 'number') return val
        return isNumericString(val) ? parseFloat(val) : NaN
    }

    // Convert input and value to numbers
    const numInput = toNumber(input)
    const numValue = toNumber(value)

    // Helper function for numeric comparisons
    const numericCompare = (comp: (a: number, b: number) => boolean): boolean => {
        if (isNaN(numInput) || isNaN(numValue)) return false
        return comp(numInput, numValue)
    }

    // Helper function for string operations
    const stringCompare = (strInput: string | number, strValue: string | number, op: (a: string, b: string) => boolean): boolean => {
        return op(String(strInput), String(strValue))
    }

    switch (condition) {
        // String conditions
        case 'Contains':
            return stringCompare(input, value, (a, b) => a.includes(b))
        case 'Not Contains':
            return stringCompare(input, value, (a, b) => !a.includes(b))
        case 'Start With':
            return stringCompare(input, value, (a, b) => a.startsWith(b))
        case 'End With':
            return stringCompare(input, value, (a, b) => a.endsWith(b))
        case 'Is':
            return String(input) === String(value)
        case 'Is Not':
            return String(input) !== String(value)
        case 'Is Empty':
            return String(input).trim().length === 0
        case 'Is Not Empty':
            return String(input).trim().length > 0

        // Numeric conditions
        case 'Greater Than':
            return numericCompare((a, b) => a > b)
        case 'Less Than':
            return numericCompare((a, b) => a < b)
        case 'Equal To':
            return numericCompare((a, b) => a === b)
        case 'Not Equal To':
            return numericCompare((a, b) => a !== b)
        case 'Greater Than or Equal To':
            return numericCompare((a, b) => a >= b)
        case 'Less Than or Equal To':
            return numericCompare((a, b) => a <= b)

        default:
            return false
    }
}

export interface MessagesState {
    messages: BaseMessage[]
    checkpoint: FlowiseCheckpoint
    //[key: string]: any  state values are not longer supported at root level
}

export const createInitialState = (nodeId: string, existingState: Partial<MessagesState> = {}): MessagesState => {
    const initialState = {
        messages: [],
        checkpoint: {
            v: 1,
            id: nodeId,
            ts: new Date().toISOString(),
            channel_values: {
                messages: []
            },
            channel_versions: {},
            versions_seen: {},
            pending_sends: []
        }
    }

    // Preserve any existing values including root level state
    return {
        ...initialState,
        ...existingState,
        checkpoint: {
            ...initialState.checkpoint,
            ...existingState.checkpoint,
            channel_values: {
                ...initialState.checkpoint.channel_values,
                ...existingState.checkpoint?.channel_values,
                messages: existingState.messages || initialState.messages
            }
        }
    }
}

export const updateStateMessages = (state: MessagesState, newMessages: BaseMessage[]): MessagesState => {
    return {
        ...state,  // Preserve root level state values
        messages: [...state.messages, ...newMessages],
        checkpoint: {
            ...state.checkpoint,
            channel_values: {
                ...state.checkpoint.channel_values,
                messages: [...(state.checkpoint.channel_values.messages || []), ...newMessages]
            }
        }
    }
}

export const updateStateValue = (
    state: MessagesState, 
    key: string, 
    value: any, 
    options: { 
        isAppend?: boolean,
        isReplace?: boolean 
    } = { isAppend: false, isReplace: true }
): MessagesState => {
    const currentValue = state.checkpoint.channel_values[key]
    let newValue = value

    if (options.isAppend && (Array.isArray(currentValue) || !currentValue)) {
        // Handle append operation
        const currentArray = Array.isArray(currentValue) ? currentValue : []
        const valueToAppend = Array.isArray(value) ? value : [value]
        newValue = [...currentArray, ...valueToAppend]
    } else if (!options.isReplace && value === null) {
        // Keep existing value if replace is false and new value is null
        newValue = currentValue
    }

    return {
        ...state,
        checkpoint: {
            ...state.checkpoint,
            channel_values: {
                ...state.checkpoint.channel_values,
                [key]: newValue
            }
        }
    }
}

export const transformObjectPropertyToFunction = (obj: ICommonObject, state: MessagesState) => {
    const transformedObject: ICommonObject = {}

    // If state is null or undefined, create initial state
    if (!state) {
        state = createInitialState('default', {})
    }

    // Ensure checkpoint exists and preserve any top-level values
    if (!state.checkpoint) {
        state = createInitialState('default', state)
    }

    for (const key in obj) {
        let value = obj[key]
        // get message from agent
        try {
            const parsedValue = JSON.parse(value)
            if (typeof parsedValue === 'object' && parsedValue.id) {
                const messages = state.messages ?? []
                const messageOutputs = messages.filter(
                    (message) => message.additional_kwargs && message.additional_kwargs?.nodeId === parsedValue.id
                )
                const messageOutput = messageOutputs[messageOutputs.length - 1]
                if (messageOutput) {
                    // if messageOutput.content is a string, set value to the content
                    if (typeof messageOutput.content === 'string') value = messageOutput.content
                    // if messageOutput.content is an array
                    else if (Array.isArray(messageOutput.content)) {
                        if (messageOutput.content.length === 0) {
                            throw new Error(`Message output content is an empty array for node ${parsedValue.id}`)
                        }
                        // Get the first element of the array
                        const messageOutputContentFirstElement: any = messageOutput.content[0]

                        if (typeof messageOutputContentFirstElement === 'string') value = messageOutputContentFirstElement
                        // If messageOutputContentFirstElement is an object and has a text property, set value to the text property
                        else if (typeof messageOutputContentFirstElement === 'object' && messageOutputContentFirstElement.text)
                            value = messageOutputContentFirstElement.text
                        // Otherwise, stringify the messageOutputContentFirstElement
                        else value = JSON.stringify(messageOutputContentFirstElement)
                    }
                }
            }
        } catch (e) {
            // do nothing
        }
        // get state value
        if (typeof value === 'string' && value.startsWith('$flow.state')) {
            // Handle array index access for messages array
            if (value.includes('messages[') && value.includes('].content')) {
                const matches = value.match(/messages\[(.*?)\]\.content/)
                if (matches && matches[1]) {
                    const index = matches[1]
                    const messages = state.messages ?? []
                    if (messages.length) {
                        const targetIndex = index === '-1' ? messages.length - 1 : parseInt(index)
                        const message = messages[targetIndex]
                        if (message && message.content) {
                            value = message.content
                        }
                    }
                }
            } else if (value === '$flow.state.<replace-with-key>') {
                // This is the template pattern - leave it as is for UI display
                value = value
            } else {
                // Handle regular state variable access
                const stateKey = value.replace('$flow.state.', '')
                
                // First try to get value from channel_values
                let stateValue = state.checkpoint?.channel_values?.[stateKey]

                // If not found in channel_values, try root level state (deprecated)
                //if (stateValue === undefined) {
                //    stateValue = state[stateKey]
                //}

                // If not found and it's 'messages', use messages array
                if (stateValue === undefined && stateKey === 'messages') {
                    stateValue = state.messages
                }

                // If not found anywhere, return empty string but don't warn
                // This is expected behavior when accessing optional state variables
                if (stateValue === undefined) {
                    value = ''
                } else {
                    value = stateValue
                    if (typeof value === 'object' && value !== null) {
                        value = JSON.stringify(value)
                    }
                }
            }
        }
        transformedObject[key] = () => value
    }

    return transformedObject
}

export const processImageMessage = async (llm: BaseChatModel, nodeData: INodeData, options: ICommonObject) => {
    let multiModalMessageContent: MessageContentImageUrl[] = []

    if (llmSupportsVision(llm)) {
        const visionChatModel = llm as IVisionChatModal
        multiModalMessageContent = await addImagesToMessages(nodeData, options, llm.multiModalOption)

        if (multiModalMessageContent?.length) {
            visionChatModel.setVisionModel()
        } else {
            visionChatModel.revertToOriginalModel()
        }
    }

    return multiModalMessageContent
}

export const getVM = async (appDataSource: DataSource, databaseEntities: IDatabaseEntity, nodeData: INodeData, flow: ICommonObject) => {
    const variables = await getVars(appDataSource, databaseEntities, nodeData)

    let sandbox: any = {
        util: undefined,
        Symbol: undefined,
        child_process: undefined,
        fs: undefined,
        process: undefined
    }
    sandbox['$vars'] = prepareSandboxVars(variables)
    sandbox['$flow'] = flow

    const builtinDeps = process.env.TOOL_FUNCTION_BUILTIN_DEP
        ? defaultAllowBuiltInDep.concat(process.env.TOOL_FUNCTION_BUILTIN_DEP.split(','))
        : defaultAllowBuiltInDep
    const externalDeps = process.env.TOOL_FUNCTION_EXTERNAL_DEP ? process.env.TOOL_FUNCTION_EXTERNAL_DEP.split(',') : []
    const deps = availableDependencies.concat(externalDeps)

    const nodeVMOptions = {
        console: 'inherit',
        sandbox,
        require: {
            external: { modules: deps },
            builtin: builtinDeps
        },
        eval: false,
        wasm: false,
        timeout: 10000
    } as any

    return new NodeVM(nodeVMOptions)
}

export const customGet = (obj: any, path: string) => {
    if (path.includes('[-1]')) {
        const parts = path.split('.')
        let result = obj

        for (let part of parts) {
            if (part.includes('[') && part.includes(']')) {
                const [name, indexPart] = part.split('[')
                const index = parseInt(indexPart.replace(']', ''))

                result = result[name]
                if (Array.isArray(result)) {
                    if (index < 0) {
                        result = result[result.length + index]
                    } else {
                        result = result[index]
                    }
                } else {
                    return undefined
                }
            } else {
                result = get(result, part)
            }

            if (result === undefined) {
                return undefined
            }
        }

        return result
    } else {
        return get(obj, path)
    }
}

export const convertStructuredSchemaToZod = (schema: string | object): ICommonObject => {
    try {
        const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema
        const zodObj: ICommonObject = {}
        for (const sch of parsedSchema) {
            if (sch.type === 'String') {
                zodObj[sch.key] = z.string().describe(sch.description)
            } else if (sch.type === 'String Array') {
                zodObj[sch.key] = z.array(z.string()).describe(sch.description)
            } else if (sch.type === 'Number') {
                zodObj[sch.key] = z.number().describe(sch.description)
            } else if (sch.type === 'Boolean') {
                zodObj[sch.key] = z.boolean().describe(sch.description)
            } else if (sch.type === 'Enum') {
                zodObj[sch.key] = z.enum(sch.enumValues.split(',').map((item: string) => item.trim())).describe(sch.description)
            }
        }
        return zodObj
    } catch (e) {
        throw new Error(e)
    }
}

/**
 * Filter the conversation history based on the selected option.
 *
 * @param historySelection - The selected history option.
 * @param input - The user input.
 * @param messages - The current conversation messages.
 */
export function filterConversationHistory(
    historySelection: ConversationHistorySelection,
    input: string,
    messages: BaseMessage[]
): BaseMessage[] {
    switch (historySelection) {
        case 'user_question':
            return [new HumanMessage(input)]
        case 'last_message':
            return messages?.length ? [messages[messages.length - 1]] : []
        case 'empty':
            return []
        case 'all_messages':
            return messages ?? []
        default:
            throw new Error(`Unhandled conversationHistorySelection: ${historySelection}`)
    }
}

export const restructureMessages = (llm: BaseChatModel, messages: BaseMessage[]): BaseMessage[] => {
    const restructuredMessages: BaseMessage[] = []
    for (const message of messages) {
        // Sometimes Anthropic can return a message with content types of array, ignore that EXECEPT when tool calls are present
        if ((message as any).tool_calls?.length && message.content !== '') {
            message.content = JSON.stringify(message.content)
        }

        if (typeof message.content === 'string') {
            restructuredMessages.push(message)
        }
    }

    const isToolMessage = (message: BaseMessage) => message instanceof ToolMessage || message.constructor.name === 'ToolMessageChunk'
    const isAIMessage = (message: BaseMessage) => message instanceof AIMessage || message.constructor.name === 'AIMessageChunk'
    const isHumanMessage = (message: BaseMessage) => message instanceof HumanMessage || message.constructor.name === 'HumanMessageChunk'

    /*
     * MistralAI does not support:
     * 1.) Last message as AI Message or Tool Message
     * 2.) Tool Message followed by Human Message
     */
    if (llm instanceof ChatMistralAI) {
        if (restructuredMessages.length > 1) {
            for (let i = 0; i < restructuredMessages.length; i++) {
                const message = restructuredMessages[i]

                // If last message is denied Tool Message, add a new Human Message
                if (isToolMessage(message) && i === restructuredMessages.length - 1 && message.additional_kwargs?.toolCallsDenied) {
                    restructuredMessages.push(new AIMessage({ content: `Tool calls got denied. Do you have other questions?` }))
                } else if (i + 1 < restructuredMessages.length) {
                    const nextMessage = restructuredMessages[i + 1]
                    const currentMessage = message

                    // If current message is Tool Message and next message is Human Message, add AI Message between Tool and Human Message
                    if (isToolMessage(currentMessage) && isHumanMessage(nextMessage)) {
                        restructuredMessages.splice(i + 1, 0, new AIMessage({ content: 'Tool calls executed' }))
                    }

                    // If last message is AI Message or Tool Message, add Human Message
                    if (i + 1 === restructuredMessages.length - 1 && (isAIMessage(nextMessage) || isToolMessage(nextMessage))) {
                        restructuredMessages.push(new HumanMessage({ content: nextMessage.content || 'Given the user question, answer user query' }))
                    }
                }
            }
        }
    } else if (llm instanceof ChatAnthropic) {
        /*
         * Anthropic does not support first message as AI Message
         */
        if (restructuredMessages.length) {
            const firstMessage = restructuredMessages[0]
            if (isAIMessage(firstMessage)) {
                restructuredMessages.shift()
                restructuredMessages.unshift(new HumanMessage({ ...firstMessage }))
            }
        }
    }

    return restructuredMessages
}

export class ExtractTool extends StructuredTool {
    name = 'extract'

    description = 'Extract structured data from the output'

    schema

    constructor(fields: ICommonObject) {
        super()
        this.schema = fields.schema
    }

    async _call(input: any) {
        return JSON.stringify(input)
    }
}

export interface RunnableCallableArgs extends Partial<any> {
    name?: string
    func: (...args: any[]) => any
    tags?: string[]
    trace?: boolean
    recurse?: boolean
}

export class RunnableCallable<I = unknown, O = unknown> extends Runnable<I, O> {
    lc_namespace: string[] = ['langgraph']

    func: (...args: any[]) => any

    tags?: string[]

    config?: RunnableConfig

    trace: boolean = true

    recurse: boolean = true

    constructor(fields: RunnableCallableArgs) {
        super()
        this.name = fields.name ?? fields.func.name
        this.func = fields.func
        this.config = fields.tags ? { tags: fields.tags } : undefined
        this.trace = fields.trace ?? this.trace
        this.recurse = fields.recurse ?? this.recurse

        if (fields.metadata) {
            this.config = { ...this.config, metadata: { ...this.config, ...fields.metadata } }
        }
    }

    async invoke(input: any, options?: Partial<RunnableConfig> | undefined): Promise<any> {
        if (this.func === undefined) {
            return this.invoke(input, options)
        }

        let returnValue: any

        if (this.trace) {
            returnValue = await this._callWithConfig(this.func, input, mergeConfigs(this.config, options))
        } else {
            returnValue = await this.func(input, mergeConfigs(this.config, options))
        }

        if (returnValue instanceof Runnable && this.recurse) {
            return await returnValue.invoke(input, options)
        }

        return returnValue
    }
}

export const checkMessageHistory = async (
    nodeData: INodeData,
    options: ICommonObject,
    prompt: ChatPromptTemplate,
    promptArrays: BaseMessagePromptTemplateLike[],
    sysPrompt: string
) => {
    const messageHistory = nodeData.inputs?.messageHistory

    if (messageHistory) {
        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        const vm = await getVM(appDataSource, databaseEntities, nodeData, {})
        try {
            const response = await vm.run(`module.exports = async function() {${messageHistory}}()`, __dirname)
            if (!Array.isArray(response)) throw new Error('Returned message history must be an array')
            if (sysPrompt) {
                // insert at index 1
                promptArrays.splice(1, 0, ...response)
            } else {
                promptArrays.unshift(...response)
            }
            prompt = ChatPromptTemplate.fromMessages(promptArrays)
        } catch (e) {
            throw new Error(e)
        }
    }

    return prompt
}
