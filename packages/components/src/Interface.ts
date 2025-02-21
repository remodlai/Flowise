import { BaseMessage } from '@langchain/core/messages'
import { BufferMemory, BufferWindowMemory, ConversationSummaryMemory, ConversationSummaryBufferMemory } from 'langchain/memory'
import { Moderation } from '../nodes/moderation/Moderation'
import { RunnableConfig } from '@langchain/core/runnables'

/**
 * Types
 */

export type NodeParamsType =
    | 'asyncOptions'
    | 'options'
    | 'multiOptions'
    | 'datagrid'
    | 'string'
    | 'number'
    | 'boolean'
    | 'password'
    | 'json'
    | 'code'
    | 'date'
    | 'file'
    | 'folder'
    | 'tabs'

export type CommonType = string | number | boolean | undefined | null

export type MessageType = 'apiMessage' | 'userMessage'

export type ImageDetail = 'auto' | 'low' | 'high'

/**
 * Others
 */

export interface ICommonObject {
    [key: string]: any | CommonType | ICommonObject | CommonType[] | ICommonObject[]
}

export interface IVariable {
    name: string
    value: string
    type: string
}

export type IDatabaseEntity = {
    [key: string]: any
}

export interface IAttachment {
    content: string
    contentType: string
    size?: number
    filename?: string
}

export interface INodeOptionsValue {
    label: string
    name: string
    description?: string
}

export interface INodeOutputsValue {
    label: string
    name: string
    baseClasses: string[]
    description?: string
    hidden?: boolean
    isAnchor?: boolean
}

export interface INodeParams {
    label: string
    name: string
    type: NodeParamsType | string
    default?: CommonType | ICommonObject | ICommonObject[]
    description?: string
    warning?: string
    options?: Array<INodeOptionsValue>
    datagrid?: Array<ICommonObject>
    credentialNames?: Array<string>
    optional?: boolean | INodeDisplay
    step?: number
    rows?: number
    list?: boolean
    acceptVariable?: boolean
    placeholder?: string
    fileType?: string
    additionalParams?: boolean
    loadMethod?: string
    hidden?: boolean
    hideCodeExecute?: boolean
    codeExample?: string
    hint?: Record<string, string>
    tabIdentifier?: string
    tabs?: Array<INodeParams>
    refresh?: boolean
    freeSolo?: boolean
    loadPreviousNodes?: boolean
}

export interface INodeExecutionData {
    [key: string]: CommonType | CommonType[] | ICommonObject | ICommonObject[]
}

export interface INodeDisplay {
    [key: string]: string[] | string
}

export interface INodeProperties {
    label: string
    name: string
    type: string
    icon: string
    version: number
    category: string // TODO: use enum instead of string
    baseClasses: string[]
    tags?: string[]
    description?: string
    filePath?: string
    badge?: string
    deprecateMessage?: string
    hideOutput?: boolean
    author?: string
    documentation?: string
}

export interface INode extends INodeProperties {
    inputs?: INodeParams[]
    output?: INodeOutputsValue[]
    loadMethods?: {
        [key: string]: (nodeData: INodeData, options?: ICommonObject) => Promise<INodeOptionsValue[]>
    }
    vectorStoreMethods?: {
        upsert: (nodeData: INodeData, options?: ICommonObject) => Promise<IndexingResult | void>
        search: (nodeData: INodeData, options?: ICommonObject) => Promise<any>
        delete: (nodeData: INodeData, ids: string[], options?: ICommonObject) => Promise<void>
    }
    init?(nodeData: INodeData, input: string, options?: ICommonObject): Promise<any>
    run?(nodeData: INodeData, input: string, options?: ICommonObject): Promise<string | ICommonObject>
}

export interface INodeData extends INodeProperties {
    id: string
    inputs?: ICommonObject
    outputs?: ICommonObject
    credential?: string
    instance?: any
    loadMethod?: string // method to load async options
}

export interface INodeCredential {
    label: string
    name: string
    description?: string
    inputs?: INodeParams[]
}

export interface IMessage {
    message: string
    type: MessageType
    role?: MessageType
    content?: string
}

export interface IUsedTool {
    tool: string
    toolInput: object
    toolOutput: string | object
    sourceDocuments?: ICommonObject[]
}

export interface IMultiAgentNode {
    node: any
    name: string
    label: string
    type: 'supervisor' | 'worker'
    llm?: any
    parentSupervisorName?: string
    workers?: string[]
    workerPrompt?: string
    workerInputVariables?: string[]
    recursionLimit?: number
    moderations?: Moderation[]
    multiModalMessageContent?: MessageContentImageUrl[]
    checkpointMemory?: any
}


export { createAgentStreamingCallbacks } from '../nodes/sequentialagents/Agent/helpers/streaming'
type SeqAgentType = 'agent' | 'condition' | 'end' | 'start' | 'tool' | 'state' | 'llm' | 'utilities'
export type ConversationHistorySelection = 'user_question' | 'last_message' | 'all_messages' | 'empty'

export interface ISeqAgentNode {
    id: string
    node: any
    name: string
    label: string
    type: SeqAgentType
    output: string
    llm?: any
    startLLM?: any
    predecessorAgents?: ISeqAgentNode[]
    recursionLimit?: number
    moderations?: Moderation[]
    multiModalMessageContent?: MessageContentImageUrl[]
    checkpointMemory?: any
    //nextNodeName?: string
    agentInterruptToolNode?: any
    agentInterruptToolFunc?: any
}

export interface ITeamState {
    messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => BaseMessage[]
        default: () => BaseMessage[]
    }
    team_members: string[]
    next: string
    instructions: string
    summarization?: string
}

export interface ISeqAgentsState {
    messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => BaseMessage[]
        default: () => BaseMessage[]
    }
    // [key: string]: {
    //     value: (x: any, y: any) => any
    //     default: () => any
    // }
}

export interface IAgentReasoning {
    agentName: string
    messages: string[]
    next?: string
    instructions?: string
    usedTools?: IUsedTool[]
    sourceDocuments?: IDocument[]
    //artifacts?: ICommonObject[]
    state?: ICommonObject
    nodeName?: string
    //nodeId?: string
}

export interface IAction {
    id?: string
    elements?: Array<{ type: string; label: string }>
    mapping?: { approve: string; reject: string; toolCalls: any[] }
}

export interface IFileUpload {
    data?: string
    type: string
    name: string
    mime: string
}

export interface IMultiModalOption {
    image?: Record<string, any>
    audio?: Record<string, any>
}

export type MessageContentText = {
    type: 'text'
    text: string
}

export type MessageContentImageUrl = {
    type: 'image_url'
    image_url:
        | string
        | {
              url: string
              detail?: ImageDetail
          }
}

export interface IDocument<Metadata extends Record<string, any> = Record<string, any>> {
    pageContent: string
    metadata: Metadata
}

/**
 * Classes
 */

import { PromptTemplate as LangchainPromptTemplate, PromptTemplateInput } from '@langchain/core/prompts'
import { VectorStore } from '@langchain/core/vectorstores'
import { Document } from '@langchain/core/documents'

export class PromptTemplate extends LangchainPromptTemplate {
    promptValues: ICommonObject

    constructor(input: PromptTemplateInput) {
        super(input)
    }
}

export interface PromptRetrieverInput {
    name: string
    description: string
    systemMessage: string
}

const fixedTemplate = `Here is a question:
{input}
`
export class PromptRetriever {
    name: string
    description: string
    systemMessage: string

    constructor(fields: PromptRetrieverInput) {
        this.name = fields.name
        this.description = fields.description
        this.systemMessage = `${fields.systemMessage}\n${fixedTemplate}`
    }
}

export interface VectorStoreRetrieverInput {
    name: string
    description: string
    vectorStore: VectorStore
}

export class VectorStoreRetriever {
    name: string
    description: string
    vectorStore: VectorStore

    constructor(fields: VectorStoreRetrieverInput) {
        this.name = fields.name
        this.description = fields.description
        this.vectorStore = fields.vectorStore
    }
}

/**
 * Implement abstract classes and interface for memory
 */

export interface MemoryMethods {
    getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseMemory extends BufferMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseWindowMemory extends BufferWindowMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseSummaryMemory extends ConversationSummaryMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export abstract class FlowiseSummaryBufferMemory extends ConversationSummaryBufferMemory implements MemoryMethods {
    abstract getChatMessages(
        overrideSessionId?: string,
        returnBaseMessages?: boolean,
        prependMessages?: IMessage[]
    ): Promise<IMessage[] | BaseMessage[]>
    abstract addChatMessages(msgArray: { text: string; type: MessageType }[], overrideSessionId?: string): Promise<void>
    abstract clearChatMessages(overrideSessionId?: string): Promise<void>
}

export type IndexingResult = {
    numAdded: number
    numDeleted: number
    numUpdated: number
    numSkipped: number
    totalKeys: number
    addedDocs: Document[]
}

export interface IVisionChatModal {
    id: string
    configuredModel: string
    multiModalOption: IMultiModalOption
    configuredMaxToken?: number
    setVisionModel(): void
    revertToOriginalModel(): void
    setMultiModalOption(multiModalOption: IMultiModalOption): void
}
export interface IStateWithMessages extends ICommonObject {
    messages: BaseMessage[]
    [key: string]: any
}

export enum TokenEventType {
    AGENT_REASONING = 'agentReasoning',
    FINAL_RESPONSE = 'finalResponse',
    TOOL_RESPONSE = 'toolResponse'
}

export interface IStreamParams {
    chatId: string;
    shouldStreamResponse?: boolean;
    sseStreamer?: IServerSideEventStreamer;
    isConnectedToEnd?: boolean;
}

export interface IStreamConfig extends Omit<RunnableConfig, 'configurable'> {
    configurable?: {
        thread_id?: string;
        shouldStreamResponse?: boolean;
        isConnectedToEnd?: boolean;
        nodeId?: string;
    } & Record<string, any>;
    streamMode?: string;
    version?: string;
}

export interface IServerSideEventStreamer {
    streamStartEvent(chatId: string, data: string | IAgentReasoning[] | ICommonObject): void
    streamTokenEvent(chatId: string, token: string, type?: TokenEventType): void
    streamAgentReasoningEvent(chatId: string, agentReasoning: IAgentReasoning[]): void
    streamNextAgentEvent(chatId: string, nextAgent: string): void
    streamSourceDocumentsEvent(chatId: string, sourceDocuments: IDocument[] | ICommonObject[]): void
    streamUsedToolsEvent(chatId: string, usedTools: IUsedTool[]): void
    streamArtifactsEvent(chatId: string, artifacts: ICommonObject[]): void
    streamActionEvent(chatId: string, action: IAction): void
    streamAbortEvent(chatId: string): void
    streamEndEvent(chatId: string): void
    // New event types for structured streaming
    streamAgentReasoningStartEvent(chatId: string, data?: any): void
    streamAgentReasoningEndEvent(chatId: string): void
    streamTokenStartEvent(chatId: string): void
    streamTokenEndEvent(chatId: string): void
    streamConditionEvent(chatId: string, condition: string): void
    // Keep existing events for backward compatibility
    streamToolEvent?(chatId: string, data: any): void
    streamFileAnnotationsEvent?(chatId: string, data: any): void
    streamCustomEvent(chatId: string, eventType: string, data: any): void
}

export enum FollowUpPromptProvider {
    ANTHROPIC = 'chatAnthropic',
    AZURE_OPENAI = 'azureChatOpenAI',
    GOOGLE_GENAI = 'chatGoogleGenerativeAI',
    MISTRALAI = 'chatMistralAI',
    OPENAI = 'chatOpenAI',
    GROQ = 'groqChat',
    OLLAMA = 'ollama'
}

export type FollowUpPromptProviderConfig = {
    [key in FollowUpPromptProvider]: {
        credentialId: string
        modelName: string
        prompt: string
        temperature: string
    }
}

export type FollowUpPromptConfig = {
    status: boolean
    selectedProvider: FollowUpPromptProvider
} & FollowUpPromptProviderConfig
