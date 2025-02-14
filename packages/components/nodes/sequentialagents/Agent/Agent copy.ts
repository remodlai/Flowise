import { flatten, uniq } from 'lodash'
import { DataSource } from 'typeorm'
// DEPRECATED import { RunnableSequence, RunnablePassthrough, RunnableConfig } from '@langchain/core/runnables'
import { ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate, BaseMessagePromptTemplateLike } from '@langchain/core/prompts'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, AIMessageChunk, BaseMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { formatToOpenAIToolMessages } from 'langchain/agents/format_scratchpad/openai_tools'
import { type ToolsAgentStep } from 'langchain/agents/openai/output_parser'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
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
    ConversationHistorySelection
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
    MessagesState,
    RunnableCallable,
    checkMessageHistory
} from '../commonUtils'
import { END, Command, task, type StateType, Annotation } from '@langchain/langgraph'
import { StructuredTool, tool } from '@langchain/core/tools'

import { ToolNode as LangGraphToolNode } from '@langchain/langgraph/prebuilt'
import { BinaryOperatorAggregate } from '@langchain/langgraph/dist/channels'
import { GlobalAnnotation } from '../../../../server/src/Interface'
import { pull } from 'langchain/hub'

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



interface AgentConfig {
    agentLabel: string
    model: BaseChatModel
    systemPrompt: string
    humanPrompt?: string
    tools: StructuredTool[]
    sequentialNodes: any[]
    interrupt: boolean
    maxIterations?: number
    startLLM: BaseChatModel
    llm: BaseChatModel
    messageHistory?: string
    conversationHistorySelection?: string
    promptValues?: Record<string, any>
    approvalPrompt?: string
    approveButtonText?: string
    rejectButtonText?: string
    updateStateMemory?: any
}

//This builds the flowise agent node.
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

    //This is the init function for the agent node.
    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const prepToolsArray = nodeData.inputs?.tools ? flatten(nodeData.inputs?.tools) as StructuredTool[] : []
        const sequentialNodes = nodeData.inputs?.sequentialNode
        const checkLLM = nodeData.inputs?.model ? nodeData.inputs?.model : sequentialNodes[0].startLLM

        // Build agent configuration
        const agentConfig: AgentConfig = {
            agentLabel: nodeData.inputs?.agentName as string,
            model: nodeData.inputs?.model as BaseChatModel,
            systemPrompt: transformBracesWithColon(nodeData.inputs?.systemMessagePrompt as string),
            humanPrompt: nodeData.inputs?.humanMessagePrompt as string,
            tools: prepToolsArray,
            sequentialNodes: nodeData.inputs?.sequentialNode,
            interrupt: nodeData.inputs?.interrupt as boolean,
            maxIterations: nodeData.inputs?.maxIterations as number,
            startLLM: (() => {
                if (sequentialNodes[0].startLLM) {
                    return sequentialNodes[0].startLLM;
                } else {
                    throw new Error('Start LLM is required!');
                }
            })(),
            llm: checkLLM,
            messageHistory: nodeData.inputs?.messageHistory,
            conversationHistorySelection: nodeData.inputs?.conversationHistorySelection,
            promptValues: nodeData.inputs?.promptValues,
            approvalPrompt: nodeData.inputs?.approvalPrompt,
            approveButtonText: nodeData.inputs?.approveButtonText,
            rejectButtonText: nodeData.inputs?.rejectButtonText,
            updateStateMemory: nodeData.inputs?.updateStateMemory
        }

        if (!agentConfig.agentLabel) throw new Error('Agent name is required!')
        if (!agentConfig.sequentialNodes?.length) throw new Error('Agent must have a predecessor!')

        const agentName = agentConfig.agentLabel.toLowerCase().replace(/\s/g, '_').trim()

        // Get the React prompt from LangChain hub
        const prompt = await pull<ChatPromptTemplate>('hwchase17/react')

        // Create the ReactAgent with proper configuration
        const agent = await createReactAgent({
            llm: agentConfig.llm,
            tools: agentConfig.tools,
            prompt : prompt
        })

        // Return task that uses global state
        return task(agentName, async (state: typeof GlobalAnnotation.State) => {
            // Process message history if configured
            if (agentConfig.messageHistory) {
                // TODO: Process message history using GlobalAnnotation
            }

            const result = await agent.invoke(state)
            
            // Handle interrupts if configured
            if (agentConfig.interrupt && result.messages?.[result.messages.length - 1]?.additional_kwargs?.tool_calls?.length) {
                return new Command({
                    goto: "INTERRUPT",
                    update: { 
                        messages: result.messages,
                        uiState: {
                            approvalPrompt: agentConfig.approvalPrompt,
                            approveButtonText: agentConfig.approveButtonText,
                            rejectButtonText: agentConfig.rejectButtonText
                        }
                    }
                })
            }

            // Process state updates if configured
            let stateUpdates = { messages: result.messages }
            if (agentConfig.updateStateMemory) {
                // TODO: Process state updates using GlobalAnnotation
            }

            // Normal completion
            return new Command({
                goto: "END",
                update: stateUpdates
            })
        })
    }
}

async function createAgent(
    nodeData: INodeData,
    options: ICommonObject,
    agentName: string,
    state: typeof GlobalAnnotation.State,
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
    if (!llm.bindTools) {
        throw new Error(`This agent only compatible with function calling models.`)
    }

    const promptArrays = [new MessagesPlaceholder('messages')] as BaseMessagePromptTemplateLike[]
    if (systemPrompt) promptArrays.unshift(['system', systemPrompt])
    if (humanPrompt) promptArrays.push(['human', humanPrompt])

    let prompt = ChatPromptTemplate.fromMessages(promptArrays)
    prompt = await checkMessageHistory(nodeData, options, prompt, promptArrays, systemPrompt)

    if (multiModalMessageContent.length) {
        const msg = HumanMessagePromptTemplate.fromTemplate([...multiModalMessageContent])
        prompt.promptMessages.splice(1, 0, msg)
    }

    // Bind tools to the LLM
    const llmWithTools = llm.bindTools(tools)

    // Create the ReactAgent
    const agent = await createReactAgent({
        llm: llmWithTools as BaseChatModel,
        tools,
        prompt
    })

    // If in interrupt mode, return the agent directly
    if (interrupt) {
        return agent
    }

    // If not in interrupt mode, wrap in executor with additional configuration
    return AgentExecutor.fromAgentAndTools({
        agent,
        tools,
        sessionId: flowObj?.sessionId,
        chatId: flowObj?.chatId,
        input: flowObj?.input,
        verbose: process.env.DEBUG === 'true',
        maxIterations: maxIterations ? parseFloat(maxIterations) : undefined
    })
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
        options
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

        let result = await agent.invoke({ ...state, signal: abortControllerSignal.signal }, config)

        if (interrupt) {
            const messages = state.messages as unknown as BaseMessage[]
            const lastMessage = messages.length ? messages[messages.length - 1] : null

            // If the last message is a tool message and is an interrupted message, format output into standard agent output
            if (lastMessage && lastMessage._getType() === 'tool' && lastMessage.additional_kwargs?.nodeId === nodeData.id) {
                let formattedAgentResult: {
                    output?: string
                    usedTools?: IUsedTool[]
                    sourceDocuments?: IDocument[]
                    artifacts?: ICommonObject[]
                } = {}
                formattedAgentResult.output = result.content
                if (lastMessage.additional_kwargs?.usedTools) {
                    formattedAgentResult.usedTools = lastMessage.additional_kwargs.usedTools as IUsedTool[]
                }
                if (lastMessage.additional_kwargs?.sourceDocuments) {
                    formattedAgentResult.sourceDocuments = lastMessage.additional_kwargs.sourceDocuments as IDocument[]
                }
                if (lastMessage.additional_kwargs?.artifacts) {
                    formattedAgentResult.artifacts = lastMessage.additional_kwargs.artifacts as ICommonObject[]
                }
                result = formattedAgentResult
            } else {
                result.name = name
                result.additional_kwargs = { ...result.additional_kwargs, nodeId: nodeData.id, interrupt: true }
                return {
                    messages: [result]
                }
            }
        }
         //All of this is handled by the checkpoint.   
        const additional_kwargs: ICommonObject = { nodeId: nodeData.id }

        if (result.usedTools) {
            additional_kwargs.usedTools = result.usedTools
        }
        if (result.sourceDocuments) {
            additional_kwargs.sourceDocuments = result.sourceDocuments
        }
        if (result.artifacts) {
            additional_kwargs.artifacts = result.artifacts
        }
        if (result.output) {
            result.content = result.output
            delete result.output
        }

        let outputContent = typeof result === 'string' ? result : result.content || result.output
        outputContent = extractOutputFromArray(outputContent)
        outputContent = removeInvalidImageMarkdown(outputContent)

        if (nodeData.inputs?.updateStateMemoryUI || nodeData.inputs?.updateStateMemoryCode) {
            let formattedOutput = {
                ...result,
                content: outputContent
            }
            const returnedOutput = await getReturnOutput(nodeData, input, options, formattedOutput, state)
            return {
                ...returnedOutput,
                messages: convertCustomMessagesToBaseMessages([outputContent], name, additional_kwargs)
            }
        } else {
            return {
                messages: [
                    new HumanMessage({
                        content: outputContent,
                        name,
                        additional_kwargs: Object.keys(additional_kwargs).length ? additional_kwargs : undefined
                    })
                ]
            }
        }
    } catch (error) {
        throw new Error(error)
    }
}

const getReturnOutput = async (nodeData: INodeData, input: string, options: ICommonObject, output: any, state: typeof GlobalAnnotation.State) => {
    const appDataSource = options.appDataSource as DataSource
    const databaseEntities = options.databaseEntities as IDatabaseEntity
    const tabIdentifier = nodeData.inputs?.[`${TAB_IDENTIFIER}_${nodeData.id}`] as string
    const updateStateMemoryUI = nodeData.inputs?.updateStateMemoryUI as string
    const updateStateMemoryCode = nodeData.inputs?.updateStateMemoryCode as string
    const updateStateMemory = nodeData.inputs?.updateStateMemory as string

    const selectedTab = tabIdentifier ? tabIdentifier.split(`_${nodeData.id}`)[0] : 'updateStateMemoryUI'
    const variables = await getVars(appDataSource, databaseEntities, nodeData)
    const updateStateVariables = async(state: typeof GlobalAnnotation.State) => {
        return {vars: prepareSandboxVars(variables)}
    }
    const flow = {
        chatflowId: options.chatflowid,
        sessionId: options.sessionId,
        chatId: options.chatId,
        input,
        output,
        state,
        vars: prepareSandboxVars(variables)
    }

    //this updates the flow state of GlobalAnnotation
    const updateFlowState = async(state: typeof GlobalAnnotation.State) => {
        return {flowState: flow}
    }

    if (updateStateMemory && updateStateMemory !== 'updateStateMemoryUI' && updateStateMemory !== 'updateStateMemoryCode') {
        try {
            const parsedSchema = typeof updateStateMemory === 'string' ? JSON.parse(updateStateMemory) : updateStateMemory
            const uiStateUpdates = parsedSchema.reduce((acc: Record<string, any>, sch: any) => {
                const key = sch.Key
                if (!key) throw new Error(`Key is required`)
                let value = sch.Value as string
                if (value.startsWith('$flow')) {
                    value = customGet(flow, sch.Value.replace('$flow.', ''))
                } else if (value.startsWith('$vars')) {
                    value = customGet(flow, sch.Value.replace('$', ''))
                }
                acc[key] = value
                return acc
            }, {} as Record<string, any>)
            return { node: { uiState: uiStateUpdates } }
        } catch (e) {
            throw new Error(e)
        }
    }

    if (selectedTab === 'updateStateMemoryUI' && updateStateMemoryUI) {
        try {
            const parsedSchema = typeof updateStateMemoryUI === 'string' ? JSON.parse(updateStateMemoryUI) : updateStateMemoryUI
            const uiStateUpdates = parsedSchema.reduce((acc: Record<string, any>, sch: any) => {
                const key = sch.key
                if (!key) throw new Error(`Key is required`)
                let value = sch.value as string
                if (value.startsWith('$flow')) {
                    value = customGet(flow, sch.value.replace('$flow.', ''))
                } else if (value.startsWith('$vars')) {
                    value = customGet(flow, sch.value.replace('$', ''))
                }
                acc[key] = value
                return acc
            }, {} as Record<string, any>)
            return { node: { uiState: uiStateUpdates } }
        } catch (e) {
            throw new Error(e)
        }
    } else if (selectedTab === 'updateStateMemoryCode' && updateStateMemoryCode) {
        const vm = await getVM(appDataSource, databaseEntities, nodeData, flow)
        try {
            const response = await vm.run(`module.exports = async function() {${updateStateMemoryCode}}()`, __dirname)
            if (typeof response !== 'object') throw new Error('Return output must be an object')
            return { node: { uiState: response } }
        } catch (e) {
            throw new Error(e)
        }
    }

    throw new Error('Invalid tab selection or missing updateStateMemory configuration')

const convertCustomMessagesToBaseMessages = (messages: string[], name: string, additional_kwargs: ICommonObject) => {
    return messages.map((message) => {
        return new HumanMessage({
            content: message,
            name,
            additional_kwargs: Object.keys(additional_kwargs).length ? additional_kwargs : undefined
        })
    })
}
}   

module.exports = { nodeClass: Agent_SeqAgents }     