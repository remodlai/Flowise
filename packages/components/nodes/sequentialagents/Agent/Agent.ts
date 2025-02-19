import { flatten, uniq } from 'lodash'
import { DataSource } from 'typeorm'
import { RunnableSequence, RunnablePassthrough, RunnableConfig } from '@langchain/core/runnables'
import { ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate, BaseMessagePromptTemplateLike } from '@langchain/core/prompts'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { formatToOpenAIToolMessages } from 'langchain/agents/format_scratchpad/openai_tools'
import { type ToolsAgentStep } from 'langchain/agents/openai/output_parser'
import { StringOutputParser } from '@langchain/core/output_parsers'
import {
    INode,
    INodeData,
    INodeParams,
    ISeqAgentsState,
    ICommonObject,
    MessageContentImageUrl,
    INodeOutputsValue,
    ISeqAgentNode,
    IDatabaseEntity,
    IUsedTool,
    IDocument,
    IStateWithMessages,
    ConversationHistorySelection,
    IMessage,
    TokenEventType
} from '../../../src/Interface'
import { ToolCallingAgentOutputParser, AgentExecutor, SOURCE_DOCUMENTS_PREFIX, ARTIFACTS_PREFIX } from '../../../src/agents'
import {
    extractOutputFromArray,
    getInputVariables,
    getVars,
    handleEscapeCharacters,
    prepareSandboxVars,
    removeInvalidImageMarkdown,
    transformBracesWithColon
} from '../../../src/utils'
import {
    customGet,
    getVM,
    processImageMessage,
    transformObjectPropertyToFunction,
    filterConversationHistory,
    restructureMessages,
    RunnableCallable,
    MessagesState,
    checkMessageHistory
} from '../commonUtils'
//@ts-ignore
import { END, StateGraph, Annotation, messagesStateReducer } from '@langchain/langgraph'
import { StructuredTool } from '@langchain/core/tools'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { Document } from '@langchain/core/documents'
import { Serialized } from '@langchain/core/load/serializable'

const defaultApprovalPrompt = `You are about to execute tool: {tools}. Ask if user want to proceed`
const examplePrompt = 'You are a research assistant who can search for up-to-date info using search engine.'
const customOutputFuncDesc = `This is only applicable when you have a custom State at the START node. After agent execution, you might want to update the State values`
const howToUseCode = `
1. Return the key value JSON object. For example: if you have the following State:
    \`\`\`json
    {
        "user": null
    }
    \`\`\`

    You can update the "user" value by returning the following:
    \`\`\`js
    return {
        "user": "john doe"
    }
    \`\`\`

2. If you want to use the agent's output as the value to update state, it is available as \`$flow.output\` with the following structure:
    \`\`\`json
    {
        "content": "Hello! How can I assist you today?",
        "usedTools": [
            {
                "tool": "tool-name",
                "toolInput": "{foo: var}",
                "toolOutput": "This is the tool's output"
            }
        ],
        "sourceDocuments": [
            {
                "pageContent": "This is the page content",
                "metadata": "{foo: var}"
            }
        ]
    }
    \`\`\`

    For example, if the \`toolOutput\` is the value you want to update the state with, you can return the following:
    \`\`\`js
    return {
        "user": $flow.output.usedTools[0].toolOutput
    }
    \`\`\`

3. You can also get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`
const howToUse = `
1. Key and value pair to be updated. For example: if you have the following State:
    | Key       | Operation     | Default Value     |
    |-----------|---------------|-------------------|
    | user      | Replace       |                   |

    You can update the "user" value with the following:
    | Key       | Value     |
    |-----------|-----------|
    | user      | john doe  |

2. If you want to use the Agent's output as the value to update state, it is available as available as \`$flow.output\` with the following structure:
    \`\`\`json
    {
        "content": "Hello! How can I assist you today?",
        "usedTools": [
            {
                "tool": "tool-name",
                "toolInput": "{foo: var}",
                "toolOutput": "This is the tool's output"
            }
        ],
        "sourceDocuments": [
            {
                "pageContent": "This is the page content",
                "metadata": "{foo: var}"
            }
        ]
    }
    \`\`\`

    For example, if the \`toolOutput\` is the value you want to update the state with, you can do the following:
    | Key       | Value                                     |
    |-----------|-------------------------------------------|
    | user      | \`$flow.output.usedTools[0].toolOutput\`  |

3. You can get default flow config, including the current "state":
    - \`$flow.sessionId\`
    - \`$flow.chatId\`
    - \`$flow.chatflowId\`
    - \`$flow.input\`
    - \`$flow.state\`

4. You can get custom variables: \`$vars.<variable-name>\`

`
const defaultFunc = `const result = $flow.output;

/* Suppose we have a custom State schema like this:
* {
    aggregate: {
        value: (x, y) => x.concat(y),
        default: () => []
    }
  }
*/

return {
  aggregate: [result.content]
};`

const messageHistoryExample = `const { AIMessage, HumanMessage, ToolMessage } = require('@langchain/core/messages');

return [
    new HumanMessage("What is 333382 🦜 1932?"),
    new AIMessage({
        content: "",
        tool_calls: [
        {
            id: "12345",
            name: "calulator",
            args: {
                number1: 333382,
                number2: 1932,
                operation: "divide",
            },
        },
        ],
    }),
    new ToolMessage({
        tool_call_id: "12345",
        content: "The answer is 172.558.",
    }),
    new AIMessage("The answer is 172.558."),
]`
const TAB_IDENTIFIER = 'selectedUpdateStateMemoryTab'

interface IAgentConfig extends RunnableConfig {
    configurable?: {
        thread_id?: string;
        shouldStreamResponse?: boolean;
    }
}

class Agent_SeqAgents implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs?: INodeParams[]
    badge?: string
    documentation?: string
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Agent'
        this.name = 'seqAgent'
        this.version = 4.1
        this.type = 'Agent'
        this.icon = 'seqAgent.png'
        this.category = 'Sequential Agents'
        this.description = 'Agent that can execute tools'
        this.baseClasses = [this.type]
        this.documentation = 'https://docs.flowiseai.com/using-flowise/agentflows/sequential-agents#id-4.-agent-node'
        this.inputs = [
            {
                label: 'Agent Name',
                name: 'agentName',
                type: 'string',
                placeholder: 'Agent'
            },
            {
                label: 'System Prompt',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                optional: true,
                default: examplePrompt
            },
            {
                label: 'Prepend Messages History',
                name: 'messageHistory',
                description:
                    'Prepend a list of messages between System Prompt and Human Prompt. This is useful when you want to provide few shot examples',
                type: 'code',
                hideCodeExecute: true,
                codeExample: messageHistoryExample,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Conversation History',
                name: 'conversationHistorySelection',
                type: 'options',
                options: [
                    {
                        label: 'User Question',
                        name: 'user_question',
                        description: 'Use the user question from the historical conversation messages as input.'
                    },
                    {
                        label: 'Last Conversation Message',
                        name: 'last_message',
                        description: 'Use the last conversation message from the historical conversation messages as input.'
                    },
                    {
                        label: 'All Conversation Messages',
                        name: 'all_messages',
                        description: 'Use all conversation messages from the historical conversation messages as input.'
                    },
                    {
                        label: 'Empty',
                        name: 'empty',
                        description:
                            'Do not use any messages from the conversation history. ' +
                            'Ensure to use either System Prompt, Human Prompt, or Messages History.'
                    }
                ],
                default: 'all_messages',
                optional: true,
                description:
                    'Select which messages from the conversation history to include in the prompt. ' +
                    'The selected messages will be inserted between the System Prompt (if defined) and ' +
                    '[Messages History, Human Prompt].',
                additionalParams: true
            },
            {
                label: 'Human Prompt',
                name: 'humanMessagePrompt',
                type: 'string',
                description: 'This prompt will be added at the end of the messages as human message',
                rows: 4,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Tools',
                name: 'tools',
                type: 'Tool',
                list: true,
                optional: true
            },
            {
                label: 'Sequential Node',
                name: 'sequentialNode',
                type: 'Start | Agent | Condition | LLMNode | ToolNode | CustomFunction | ExecuteFlow',
                description:
                    'Can be connected to one of the following nodes: Start, Agent, Condition, LLM Node, Tool Node, Custom Function, Execute Flow',
                list: true
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                optional: true,
                description: `Overwrite model to be used for this agent`
            },
            {
                label: 'Require Approval',
                name: 'interrupt',
                description:
                    'Pause execution and request user approval before running tools.\n' +
                    'If enabled, the agent will prompt the user with customizable approve/reject options\n' +
                    'and will proceed only after approval. This requires a configured agent memory to manage\n' +
                    'the state and handle approval requests.\n' +
                    'If no tools are invoked, the agent proceeds without interruption.',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Format Prompt Values',
                name: 'promptValues',
                description: 'Assign values to the prompt variables. You can also use $flow.state.<variable-name> to get the state value',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true
            },
            {
                label: 'Approval Prompt',
                name: 'approvalPrompt',
                description: 'Prompt for approval. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: defaultApprovalPrompt,
                rows: 4,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Approve Button Text',
                name: 'approveButtonText',
                description: 'Text for approve button. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: 'Yes',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Reject Button Text',
                name: 'rejectButtonText',
                description: 'Text for reject button. Only applicable if "Require Approval" is enabled',
                type: 'string',
                default: 'No',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Update State',
                name: 'updateStateMemory',
                type: 'tabs',
                tabIdentifier: TAB_IDENTIFIER,
                additionalParams: true,
                default: 'updateStateMemoryUI',
                tabs: [
                    {
                        label: 'Update State (Table)',
                        name: 'updateStateMemoryUI',
                        type: 'datagrid',
                        hint: {
                            label: 'How to use',
                            value: howToUse
                        },
                        description: customOutputFuncDesc,
                        datagrid: [
                            {
                                field: 'key',
                                headerName: 'Key',
                                type: 'asyncSingleSelect',
                                loadMethod: 'loadStateKeys',
                                flex: 0.5,
                                editable: true
                            },
                            {
                                field: 'value',
                                headerName: 'Value',
                                type: 'freeSolo',
                                valueOptions: [
                                    {
                                        label: 'Agent Output (string)',
                                        value: '$flow.output.content'
                                    },
                                    {
                                        label: `Used Tools (array)`,
                                        value: '$flow.output.usedTools'
                                    },
                                    {
                                        label: `First Tool Output (string)`,
                                        value: '$flow.output.usedTools[0].toolOutput'
                                    },
                                    {
                                        label: 'Source Documents (array)',
                                        value: '$flow.output.sourceDocuments'
                                    },
                                    {
                                        label: `Global variable (string)`,
                                        value: '$vars.<variable-name>'
                                    },
                                    {
                                        label: 'Input Question (string)',
                                        value: '$flow.input'
                                    },
                                    {
                                        label: 'Session Id (string)',
                                        value: '$flow.sessionId'
                                    },
                                    {
                                        label: 'Chat Id (string)',
                                        value: '$flow.chatId'
                                    },
                                    {
                                        label: 'Chatflow Id (string)',
                                        value: '$flow.chatflowId'
                                    }
                                ],
                                editable: true,
                                flex: 1
                            }
                        ],
                        optional: true,
                        additionalParams: true
                    },
                    {
                        label: 'Update State (Code)',
                        name: 'updateStateMemoryCode',
                        type: 'code',
                        hint: {
                            label: 'How to use',
                            value: howToUseCode
                        },
                        description: `${customOutputFuncDesc}. Must return an object representing the state`,
                        hideCodeExecute: true,
                        codeExample: defaultFunc,
                        optional: true,
                        additionalParams: true
                    }
                ]
            },
            {
                label: 'Max Iterations',
                name: 'maxIterations',
                type: 'number',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        let tools = nodeData.inputs?.tools
        tools = flatten(tools)
        let agentSystemPrompt = nodeData.inputs?.systemMessagePrompt as string
        agentSystemPrompt = transformBracesWithColon(agentSystemPrompt)
        let agentHumanPrompt = nodeData.inputs?.humanMessagePrompt as string
        agentHumanPrompt = transformBracesWithColon(agentHumanPrompt)
        const agentLabel = nodeData.inputs?.agentName as string
        const sequentialNodes = nodeData.inputs?.sequentialNode as ISeqAgentNode[]
        const maxIterations = nodeData.inputs?.maxIterations as string
        const model = nodeData.inputs?.model as BaseChatModel
        const promptValuesStr = nodeData.inputs?.promptValues
        const output = nodeData.outputs?.output as string
        const approvalPrompt = nodeData.inputs?.approvalPrompt as string

        if (!agentLabel) throw new Error('Agent name is required!')
        const agentName = agentLabel.toLowerCase().replace(/\s/g, '_').trim()

        if (!sequentialNodes || !sequentialNodes.length) throw new Error('Agent must have a predecessor!')

        let agentInputVariablesValues: ICommonObject = {}
        if (promptValuesStr) {
            try {
                agentInputVariablesValues = typeof promptValuesStr === 'object' ? promptValuesStr : JSON.parse(promptValuesStr)
            } catch (exception) {
                throw new Error("Invalid JSON in the Agent's Prompt Input Values: " + exception)
            }
        }
        agentInputVariablesValues = handleEscapeCharacters(agentInputVariablesValues, true)

        const startLLM = sequentialNodes[0].startLLM
        const llm = model || startLLM
        if (nodeData.inputs) nodeData.inputs.model = llm

        const multiModalMessageContent = sequentialNodes[0]?.multiModalMessageContent || (await processImageMessage(llm, nodeData, options))
        const abortControllerSignal = options.signal as AbortController
        const agentInputVariables = uniq([...getInputVariables(agentSystemPrompt), ...getInputVariables(agentHumanPrompt)])

        if (!agentInputVariables.every((element) => Object.keys(agentInputVariablesValues).includes(element))) {
            throw new Error('Agent input variables values are not provided!')
        }

        const interrupt = nodeData.inputs?.interrupt as boolean

        const toolName = `tool_${nodeData.id}`
        const toolNode = new ToolNode(tools, nodeData, input, options, toolName, [], { sequentialNodeName: toolName })

        const workerNode = async (state: ISeqAgentsState, config: RunnableConfig) => {
            return await agentNode(
                {
                    state,
                    llm,
                    agent: await createAgent(nodeData, options, agentName, state, llm, interrupt, tools, agentSystemPrompt, agentHumanPrompt, multiModalMessageContent, agentInputVariablesValues, maxIterations, { sessionId: options.sessionId, chatId: options.chatId, input }),
                    name: agentName,
                    abortControllerSignal,
                    nodeData,
                    input,
                    options,
                    interrupt,
                    multiModalMessageContent
                },
                config
            )
        }

        const toolInterrupt = async (
            graph: StateGraph<ISeqAgentsState>,
            nextNodeName?: string,
            runCondition?: any,
            conditionalMapping: ICommonObject = {}
        ) => {
            const routeMessage = async (state: ISeqAgentsState) => {
                const messages = state.messages.default()
                const lastMessage = messages[messages.length - 1] as AIMessage

                if (!lastMessage?.tool_calls?.length) {
                    // if next node is condition node, run the condition
                    if (runCondition) {
                        const returnNodeName = await runCondition(state)
                        return returnNodeName
                    }
                    return nextNodeName || END
                }
                return toolName
            }

            graph.addNode(toolName, toolNode)

            if (nextNodeName) {
                // @ts-ignore
                graph.addConditionalEdges(agentName, routeMessage, {
                    [toolName]: toolName,
                    [END]: END,
                    [nextNodeName]: nextNodeName,
                    ...conditionalMapping
                })
            } else {
                // @ts-ignore
                graph.addConditionalEdges(agentName, routeMessage, { [toolName]: toolName, [END]: END, ...conditionalMapping })
            }

            // @ts-ignore
            graph.addEdge(toolName, agentName)

            return graph
        }

        const returnOutput: ISeqAgentNode = {
            id: nodeData.id,
            node: workerNode,
            name: agentName,
            label: agentLabel,
            type: 'agent',
            llm,
            startLLM,
            output,
            predecessorAgents: sequentialNodes,
            multiModalMessageContent,
            moderations: sequentialNodes[0]?.moderations,
            agentInterruptToolNode: interrupt ? toolNode : undefined,
            agentInterruptToolFunc: interrupt ? toolInterrupt : undefined
        }

        return returnOutput
    }
}

async function createAgent(
    nodeData: INodeData,
    options: ICommonObject,
    agentName: string,
    state: ISeqAgentsState,
    llm: BaseChatModel,
    interrupt: boolean,
    tools: any[],
    systemPrompt: string,
    humanPrompt: string,
    multiModalMessageContent: MessageContentImageUrl[],
    agentInputVariablesValues: ICommonObject,
    maxIterations?: string,
    flowObj?: { sessionId?: string; chatId?: string; input?: string }
): Promise<any> {
    if (tools.length && !interrupt) {
        const promptArrays = [
            new MessagesPlaceholder('messages'),
            new MessagesPlaceholder('agent_scratchpad')
        ] as BaseMessagePromptTemplateLike[]
        if (systemPrompt) promptArrays.unshift(['system', systemPrompt])

        // Add multimodal content before human prompt if it exists
        if (multiModalMessageContent && multiModalMessageContent.length > 0) {
            promptArrays.push(HumanMessagePromptTemplate.fromTemplate(multiModalMessageContent))
        }
        if (humanPrompt) promptArrays.push(['human', humanPrompt])

        let prompt = ChatPromptTemplate.fromMessages(promptArrays)
        prompt = await checkMessageHistory(nodeData, options, prompt, promptArrays, systemPrompt)

        if (llm.bindTools === undefined) {
            throw new Error(`This agent only compatible with function calling models.`)
        }
        const modelWithTools = llm.bindTools(tools)

        let agent

        if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
            agent = RunnableSequence.from([
                RunnablePassthrough.assign({
                    //@ts-ignore
                    agent_scratchpad: (input: { steps: ToolsAgentStep[] }) => formatToOpenAIToolMessages(input.steps)
                }),
                prompt,
                modelWithTools,
                new ToolCallingAgentOutputParser()
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        } else {
            agent = RunnableSequence.from([
                RunnablePassthrough.assign({
                    //@ts-ignore
                    agent_scratchpad: (input: { steps: ToolsAgentStep[] }) => formatToOpenAIToolMessages(input.steps)
                }),
                RunnablePassthrough.assign(transformObjectPropertyToFunction(agentInputVariablesValues, state)),
                prompt,
                modelWithTools,
                new ToolCallingAgentOutputParser()
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        }

        const executor = AgentExecutor.fromAgentAndTools({
            agent,
            tools,
            sessionId: flowObj?.sessionId,
            chatId: flowObj?.chatId,
            input: flowObj?.input,
            verbose: process.env.DEBUG === 'true',
            maxIterations: maxIterations ? parseFloat(maxIterations) : undefined
        })
        return executor
    } else if (tools.length && interrupt) {
        if (llm.bindTools === undefined) {
            throw new Error(`Agent Node only compatible with function calling models.`)
        }
        // @ts-ignore
        llm = llm.bindTools(tools)

        const promptArrays = [new MessagesPlaceholder('messages')] as BaseMessagePromptTemplateLike[]
        if (systemPrompt) promptArrays.unshift(['system', systemPrompt])
        
        // Add multimodal content before human prompt if it exists
        if (multiModalMessageContent && multiModalMessageContent.length > 0) {
            promptArrays.push(HumanMessagePromptTemplate.fromTemplate(multiModalMessageContent))
        }
        if (humanPrompt) promptArrays.push(['human', humanPrompt])

        let prompt = ChatPromptTemplate.fromMessages(promptArrays)
        prompt = await checkMessageHistory(nodeData, options, prompt, promptArrays, systemPrompt)

        let agent

        if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
            agent = RunnableSequence.from([prompt, llm]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        } else {
            agent = RunnableSequence.from([
                RunnablePassthrough.assign(transformObjectPropertyToFunction(agentInputVariablesValues, state)),
                prompt,
                llm
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        }
        return agent
    } else {
        const promptArrays = [new MessagesPlaceholder('messages')] as BaseMessagePromptTemplateLike[]
        if (systemPrompt) promptArrays.unshift(['system', systemPrompt])
        
        // Add multimodal content before human prompt if it exists
        if (multiModalMessageContent && multiModalMessageContent.length > 0) {
            promptArrays.push(HumanMessagePromptTemplate.fromTemplate(multiModalMessageContent))
        }
        if (humanPrompt) promptArrays.push(['human', humanPrompt])

        let prompt = ChatPromptTemplate.fromMessages(promptArrays)
        prompt = await checkMessageHistory(nodeData, options, prompt, promptArrays, systemPrompt)

        let conversationChain

        if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
            conversationChain = RunnableSequence.from([prompt, llm, new StringOutputParser()]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        } else {
            conversationChain = RunnableSequence.from([
                RunnablePassthrough.assign(transformObjectPropertyToFunction(agentInputVariablesValues, state)),
                prompt,
                llm,
                new StringOutputParser()
            ]).withConfig({
                metadata: { sequentialNodeName: agentName }
            })
        }

        return conversationChain
    }
}

async function agentNode(
    {
        state,
        llm,
        interrupt,
        agent,
        name,
        abortControllerSignal,
        nodeData,
        input,
        options,
        multiModalMessageContent
    }: {
        state: ISeqAgentsState
        llm: BaseChatModel
        interrupt: boolean
        agent: AgentExecutor | RunnableSequence
        name: string
        abortControllerSignal: AbortController
        nodeData: INodeData
        input: string
        options: ICommonObject
        multiModalMessageContent?: MessageContentImageUrl[]
    },
    config: RunnableConfig
) {
    try {
        if (abortControllerSignal.signal.aborted) {
            throw new Error('Aborted!')
        }

        const historySelection = (nodeData.inputs?.conversationHistorySelection || 'all_messages') as ConversationHistorySelection
        // @ts-ignore
        state.messages = filterConversationHistory(historySelection, input, state)
        // @ts-ignore
        state.messages = restructureMessages(llm, state)

        const shouldStream = Boolean(config.configurable?.shouldStreamResponse)
        const sseStreamer = options.sseStreamer
        const chatId = options.chatId

        let result: ICommonObject
        if (shouldStream && sseStreamer) {
            let content = ''
            let currentTokenType = TokenEventType.AGENT_REASONING
            let isStreamingStarted = false

            // Create stream config
            const streamConfig = {
                ...config,
                configurable: {
                    ...(config.configurable || {}),
                    shouldStreamResponse: true
                }
            }

            // Add streaming callbacks
            const streamingHandler = BaseCallbackHandler.fromMethods({
                handleLLMNewToken(token: string) {
                    if (!isStreamingStarted) {
                        isStreamingStarted = true
                        sseStreamer.streamStartEvent(chatId, '')
                        sseStreamer.streamTokenStartEvent(chatId)
                    }
                    content += token
                    sseStreamer.streamTokenEvent(chatId, token, currentTokenType)
                },
                handleLLMEnd() {
                    if (isStreamingStarted) {
                        sseStreamer.streamTokenEndEvent(chatId)
                    }
                },
                handleToolStart(tool: Serialized, input: string) {
                    currentTokenType = TokenEventType.TOOL_RESPONSE
                    sseStreamer.streamToolEvent(chatId, { 
                        tool: tool.toString(), 
                        status: 'start', 
                        input,
                        type: TokenEventType.TOOL_RESPONSE 
                    })
                },
                handleToolEnd(output: string) {
                    currentTokenType = TokenEventType.AGENT_REASONING
                    sseStreamer.streamToolEvent(chatId, { 
                        output, 
                        status: 'end',
                        type: TokenEventType.TOOL_RESPONSE 
                    })
                }
            })

            if (Array.isArray(streamConfig.callbacks)) {
                streamConfig.callbacks.push(streamingHandler)
            } else if (streamConfig.callbacks) {
                streamConfig.callbacks = [streamingHandler]
            } else {
                streamConfig.callbacks = [streamingHandler]
            }

            // Stream the agent's execution
            result = await agent.invoke({ ...state, signal: abortControllerSignal.signal }, streamConfig)

            // After execution, determine if this was a final response
            if (result.next === 'END' || result.next === 'FINISH') {
                currentTokenType = TokenEventType.FINAL_RESPONSE
            }

            // Create the final message with all metadata
            const finalMessage = new AIMessage({
                content: result.content || result.output || '',
                name,
                additional_kwargs: {
                    nodeId: nodeData.id,
                    usedTools: result.usedTools || [],
                    sourceDocuments: result.sourceDocuments || [],
                    artifacts: result.artifacts || [],
                    state: result.state || state,
                    type: currentTokenType
                }
            })

            // Update state with final AI message
            state.messages = {
                value: state.messages.value,
                default: () => [...state.messages.default(), finalMessage]
            }

            return {
                messages: [finalMessage],
                state: result.state || state
            }
        } else {
            // Non-streaming case
            result = await agent.invoke({ ...state, signal: abortControllerSignal.signal }, config)

            const finalMessage = new AIMessage({
                content: result.content || result.output || '',
                name,
                additional_kwargs: {
                    nodeId: nodeData.id,
                    usedTools: result.usedTools || [],
                    sourceDocuments: result.sourceDocuments || [],
                    artifacts: result.artifacts || [],
                    state: result.state || state,
                    type: result.next === 'END' ? TokenEventType.FINAL_RESPONSE : TokenEventType.AGENT_REASONING
                }
            })

            // Update state with final AI message
            state.messages = {
                value: state.messages.value,
                default: () => [...state.messages.default(), finalMessage]
            }

            return {
                messages: [finalMessage],
                state: result.state || state
            }
        }
    } catch (error) {
        throw new Error(error)
    }
}

const getReturnOutput = async (nodeData: INodeData, input: string, options: ICommonObject, output: any, state: ISeqAgentsState) => {
    const appDataSource = options.appDataSource as DataSource
    const databaseEntities = options.databaseEntities as IDatabaseEntity
    const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`] as string
    const updateStateMemoryUI = nodeData.inputs?.updateStateMemoryUI as string
    const updateStateMemoryCode = nodeData.inputs?.updateStateMemoryCode as string
    const updateStateMemory = nodeData.inputs?.updateStateMemory as string

    const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'updateStateMemoryUI'
    const variables = await getVars(appDataSource, databaseEntities, nodeData)

    const flow = {
        chatflowId: options.chatflowid,
        sessionId: options.sessionId,
        chatId: options.chatId,
        input,
        output,
        state,
        vars: prepareSandboxVars(variables)
    }

    if (updateStateMemory && updateStateMemory !== 'updateStateMemoryUI' && updateStateMemory !== 'updateStateMemoryCode') {
        try {
            const parsedSchema = typeof updateStateMemory === 'string' ? JSON.parse(updateStateMemory) : updateStateMemory
            const obj: ICommonObject = {}
            for (const sch of parsedSchema) {
                const key = sch.Key
                if (!key) throw new Error(`Key is required`)
                let value = sch.Value as string
                if (value.startsWith('$flow')) {
                    value = customGet(flow, sch.Value.replace('$flow.', ''))
                } else if (value.startsWith('$vars')) {
                    value = customGet(flow, sch.Value.replace('$', ''))
                }
                obj[key] = value
            }
            return obj
        } catch (e) {
            throw new Error(e)
        }
    }

    if (selectedTab === 'updateStateMemoryUI' && updateStateMemoryUI) {
        try {
            const parsedSchema = typeof updateStateMemoryUI === 'string' ? JSON.parse(updateStateMemoryUI) : updateStateMemoryUI
            const obj: ICommonObject = {}
            for (const sch of parsedSchema) {
                const key = sch.key
                if (!key) throw new Error(`Key is required`)
                let value = sch.value as string
                if (value.startsWith('$flow')) {
                    value = customGet(flow, sch.value.replace('$flow.', ''))
                } else if (value.startsWith('$vars')) {
                    value = customGet(flow, sch.value.replace('$', ''))
                }
                obj[key] = value
            }
            return obj
        } catch (e) {
            throw new Error(e)
        }
    } else if (selectedTab === 'updateStateMemoryCode' && updateStateMemoryCode) {
        const vm = await getVM(appDataSource, databaseEntities, nodeData, flow)
        try {
            const response = await vm.run(`module.exports = async function() {${updateStateMemoryCode}}()`, __dirname)
            if (typeof response !== 'object') throw new Error('Return output must be an object')
            return response
        } catch (e) {
            throw new Error(e)
        }
    }

    return {}
}

const convertCustomMessagesToBaseMessages = (messages: string[], name: string, additional_kwargs: ICommonObject) => {
    return messages.map((message) => {
        return new HumanMessage({
            content: message,
            name,
            additional_kwargs: Object.keys(additional_kwargs).length ? additional_kwargs : undefined
        })
    })
}

class ToolNode extends RunnableCallable<ISeqAgentsState, ISeqAgentsState> {
    tools: StructuredTool[]
    nodeData: INodeData
    inputQuery: string
    options: ICommonObject

    constructor(
        tools: StructuredTool[],
        nodeData: INodeData,
        inputQuery: string,
        options: ICommonObject,
        name: string = 'tools',
        tags: string[] = [],
        metadata: ICommonObject = {}
    ) {
        super({ name, metadata, tags, func: (input, config) => this.run(input, config) })
        this.tools = tools
        this.nodeData = nodeData
        this.inputQuery = inputQuery
        this.options = options
    }

    private async run(input: ISeqAgentsState, config: RunnableConfig): Promise<ISeqAgentsState> {
        const messages = input.messages.default()
        const message = messages[messages.length - 1]

        if (message._getType() !== 'ai') {
            throw new Error('ToolNode only accepts AIMessages as input.')
        }

        const { messages: _, ...inputWithoutMessages } = input

        const outputs = await Promise.all(
            (message as AIMessage).tool_calls?.map(async (call) => {
                const tool = this.tools.find((tool) => tool.name === call.name)
                if (tool === undefined) {
                    throw new Error(`Tool ${call.name} not found.`)
                }
                if (tool && (tool as any).setFlowObject) {
                    // @ts-ignore
                    tool.setFlowObject({
                        chatId: this.options.chatId,
                        sessionId: this.options.sessionId,
                        input: this.inputQuery,
                        state: inputWithoutMessages
                    })
                }

                let output = await tool.invoke(call.args, config)
                let sourceDocuments: Document[] = []
                let artifacts: ICommonObject[] = []

                if (output?.includes(SOURCE_DOCUMENTS_PREFIX)) {
                    const outputArray = output.split(SOURCE_DOCUMENTS_PREFIX)
                    output = outputArray[0]
                    const docs = outputArray[1]
                    try {
                        sourceDocuments = JSON.parse(docs)
                    } catch (e) {
                        console.error('Error parsing source documents from tool')
                    }
                }

                if (output?.includes(ARTIFACTS_PREFIX)) {
                    const outputArray = output.split(ARTIFACTS_PREFIX)
                    output = outputArray[0]
                    try {
                        artifacts = JSON.parse(outputArray[1])
                    } catch (e) {
                        console.error('Error parsing artifacts from tool')
                    }
                }

                return new ToolMessage({
                    name: tool.name,
                    content: typeof output === 'string' ? output : JSON.stringify(output),
                    tool_call_id: call.id!,
                    additional_kwargs: {
                        nodeId: this.nodeData.id,
                        sourceDocuments,
                        artifacts,
                        args: call.args,
                        usedTools: [{
                            tool: tool.name ?? '',
                            toolInput: call.args,
                            toolOutput: output
                        }]
                    }
                })
            }) ?? []
        )

        return {
            ...input,
            messages: {
                value: input.messages.value,
                default: () => [...messages.slice(0, -1), ...outputs]
            }
        }
    }
}

module.exports = { nodeClass: Agent_SeqAgents }

