import { flatten, uniq } from 'lodash'
import { DataSource } from 'typeorm'
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'
import { ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { formatToOpenAIToolMessages } from 'langchain/agents/format_scratchpad/openai_tools'
import { StringOutputParser } from '@langchain/core/output_parsers'
import {
    INode,
    INodeData,
    INodeParams,
    INodeOutputsValue,
    ISeqAgentNode,
    IDatabaseEntity,
    ICommonObject
} from '../../../src/Interface'
import { ToolCallingAgentOutputParser, AgentExecutor } from '../../../src/agents'
import {
    getInputVariables,
    getVars,
    handleEscapeCharacters,
    prepareSandboxVars,
    transformBracesWithColon
} from '../../../src/utils'
import {
    customGet,
    getVM,
    processImageMessage,
    transformObjectPropertyToFunction
} from '../commonUtils'
import { SystemMessage, HumanMessage } from '@langchain/core/messages'
import { BaseLanguageModelInput } from '@langchain/core/language_models/base'
import { BaseChatModelCallOptions } from '@langchain/core/language_models/chat_models'

import {
    defaultApprovalPrompt,
    examplePrompt,
    customOutputFuncDesc,
    TAB_IDENTIFIER,
    messageHistoryExample,
    howToUse,
    howToUseCode,
    defaultFunc
} from './helpers'

import { ToolNode } from './helpers/tool-node'
import { agentNode } from './helpers/agent-node'
import { createStreamingCallbacks } from './helpers/streaming'

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
        this.outputs = []
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

        // Check if this node is connected to an end node
        const isConnectedToEnd = sequentialNodes.some(node => node.type === 'end')

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
        const toolNode = new ToolNode(tools, nodeData, input, options, toolName, [], { 
            sequentialNodeName: toolName,
            isConnectedToEnd 
        })

        ;(toolNode as any).seekPermissionMessage = async (usedTools: any[]) => {
            const prompt = ChatPromptTemplate.fromMessages([['human', approvalPrompt || defaultApprovalPrompt]])
            const chain = prompt.pipe(startLLM)
            const response = await chain.invoke({
                input: 'Hello there!',
                tools: JSON.stringify(usedTools)
            }) as { content: string }
            return response.content
        }

        const workerNode = async (state: any, config: any) => {
            return await agentNode(
                {
                    state,
                    llm,
                    agent: await this.createAgent(
                        nodeData,
                        options,
                        agentName,
                        state,
                        llm,
                        interrupt,
                        [...tools],
                        agentSystemPrompt,
                        agentHumanPrompt,
                        multiModalMessageContent,
                        agentInputVariablesValues,
                        maxIterations,
                        isConnectedToEnd,
                        {
                            sessionId: options.sessionId,
                            chatId: options.chatId,
                            input
                        }
                    ),
                    name: agentName,
                    nodeData,
                    options,
                    interrupt,
                    multiModalMessageContent,
                    isConnectedToEnd
                },
                config
            )
        }

        const toolInterrupt = async (
            graph: any,
            nextNodeName?: string,
            runCondition?: any,
            conditionalMapping: ICommonObject = {}
        ) => {
            const routeMessage = async (state: any) => {
                const messages = state.messages.default()
                const lastMessage = messages[messages.length - 1]

                if (!lastMessage?.tool_calls?.length) {
                    if (runCondition) {
                        const returnNodeName = await runCondition(state)
                        return returnNodeName
                    }
                    return nextNodeName || 'END'
                }
                return toolName
            }

            graph.addNode(toolName, toolNode)

            if (nextNodeName) {
                graph.addConditionalEdges(agentName, routeMessage, {
                    [toolName]: toolName,
                    END: 'END',
                    [nextNodeName]: nextNodeName,
                    ...conditionalMapping
                })
            } else {
                graph.addConditionalEdges(agentName, routeMessage, { 
                    [toolName]: toolName, 
                    END: 'END', 
                    ...conditionalMapping 
                })
            }

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
            nextNodeName: isConnectedToEnd ? 'END' : undefined,
            predecessorAgents: sequentialNodes,
            multiModalMessageContent,
            moderations: sequentialNodes[0]?.moderations,
            agentInterruptToolNode: interrupt ? toolNode : undefined,
            agentInterruptToolFunc: interrupt ? toolInterrupt : undefined
        }

        return returnOutput
    }

    private async createAgent(
        nodeData: INodeData,
        options: ICommonObject,
        agentName: string,
        state: any,
        llm: BaseChatModel,
        interrupt: boolean,
        tools: any[],
        systemPrompt: string,
        humanPrompt: string,
        multiModalMessageContent: any[],
        agentInputVariablesValues: ICommonObject,
        maxIterations?: string,
        isConnectedToEnd?: boolean,
        flowObj?: { sessionId?: string; chatId?: string; input?: string }
    ): Promise<any> {
        // Create streaming configuration
        const streamConfig = {
            chatId: options.chatId,
            shouldStreamResponse: options.shouldStreamResponse ?? true,
            sseStreamer: options.sseStreamer,
            isConnectedToEnd: isConnectedToEnd ?? false
        };

        // Create streaming callbacks with validated config
        const streamCallbacks = createStreamingCallbacks(streamConfig);

        // Create base config with proper version and mode
        const baseConfig = {
            version: "v1",
            streamMode: "values",
            configurable: {
                shouldStreamResponse: streamConfig.shouldStreamResponse
            },
            callbacks: [streamCallbacks],
            metadata: { sequentialNodeName: agentName }
        };

        // Use base config for all agent operations
        const agentConfig = baseConfig;

        if (tools.length && !interrupt) {
            // Create message templates
            const promptMessages = []
            if (systemPrompt) {
                promptMessages.push(new SystemMessage(systemPrompt))
            }
            promptMessages.push(new MessagesPlaceholder('messages'))
            promptMessages.push(new MessagesPlaceholder('agent_scratchpad'))

            // Add multimodal content if present
            if (multiModalMessageContent?.length) {
                promptMessages.push(HumanMessagePromptTemplate.fromTemplate(multiModalMessageContent))
            }
            if (humanPrompt) {
                promptMessages.push(new HumanMessage(humanPrompt))
            }

            let prompt = ChatPromptTemplate.fromMessages(promptMessages)

            if (llm.bindTools === undefined) {
                throw new Error(`This agent only compatible with function calling models.`)
            }
            const modelWithTools = llm.bindTools(tools)

            let agent

            if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
                agent = RunnableSequence.from([
                    RunnablePassthrough.assign({
                        agent_scratchpad: (input: { steps: any[] }) => formatToOpenAIToolMessages(input.steps)
                    }),
                    prompt,
                    modelWithTools,
                    new ToolCallingAgentOutputParser()
                ]).withConfig({
                    callbacks: [streamCallbacks],
                    metadata: { sequentialNodeName: agentName }
                })
            } else {
                agent = RunnableSequence.from([
                    RunnablePassthrough.assign({
                        agent_scratchpad: (input: { steps: any[] }) => formatToOpenAIToolMessages(input.steps)
                    }),
                    RunnablePassthrough.assign(transformObjectPropertyToFunction(agentInputVariablesValues, state)),
                    prompt,
                    modelWithTools,
                    new ToolCallingAgentOutputParser()
                ]).withConfig({
                    callbacks: [streamCallbacks],
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
            const boundLLM = llm.bindTools(tools)

            // Create message templates
            const promptMessages = []
            if (systemPrompt) {
                promptMessages.push(new SystemMessage(systemPrompt))
            }
            promptMessages.push(new MessagesPlaceholder('messages'))

            // Add multimodal content if present
            if (multiModalMessageContent?.length) {
                promptMessages.push(HumanMessagePromptTemplate.fromTemplate(multiModalMessageContent))
            }
            if (humanPrompt) {
                promptMessages.push(new HumanMessage(humanPrompt))
            }

            let prompt = ChatPromptTemplate.fromMessages(promptMessages)

            let agent

            if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
                agent = RunnableSequence.from([prompt, boundLLM]).withConfig({
                    callbacks: [streamCallbacks],
                    metadata: { sequentialNodeName: agentName }
                })
            } else {
                agent = RunnableSequence.from([
                    RunnablePassthrough.assign(transformObjectPropertyToFunction(agentInputVariablesValues, state)),
                    prompt,
                    boundLLM
                ]).withConfig({
                    callbacks: [streamCallbacks],
                    metadata: { sequentialNodeName: agentName }
                })
            }
            return agent
        } else {
            // Create message templates
            const promptMessages = []
            if (systemPrompt) {
                promptMessages.push(new SystemMessage(systemPrompt))
            }
            promptMessages.push(new MessagesPlaceholder('messages'))

            // Add multimodal content if present
            if (multiModalMessageContent?.length) {
                promptMessages.push(HumanMessagePromptTemplate.fromTemplate(multiModalMessageContent))
            }
            if (humanPrompt) {
                promptMessages.push(new HumanMessage(humanPrompt))
            }

            let prompt = ChatPromptTemplate.fromMessages(promptMessages)

            let conversationChain

            if (!agentInputVariablesValues || !Object.keys(agentInputVariablesValues).length) {
                conversationChain = RunnableSequence.from([prompt, llm, new StringOutputParser()]).withConfig({
                    callbacks: [streamCallbacks],
                    metadata: { sequentialNodeName: agentName }
                })
            } else {
                conversationChain = RunnableSequence.from([
                    RunnablePassthrough.assign(transformObjectPropertyToFunction(agentInputVariablesValues, state)),
                    prompt,
                    llm,
                    new StringOutputParser()
                ]).withConfig({
                    callbacks: [streamCallbacks],
                    metadata: { sequentialNodeName: agentName }
                })
            }

            return conversationChain
        }
    }
}

module.exports = { nodeClass: Agent_SeqAgents }
