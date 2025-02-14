import { z } from 'zod'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { SystemMessage, HumanMessage, BaseMessage } from '@langchain/core/messages'
import { StructuredTool } from '@langchain/core/tools'
import { ChatPromptTemplate, MessagesPlaceholder, BaseMessagePromptTemplateLike } from '@langchain/core/prompts'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { RunnableConfig } from '@langchain/core/runnables'
import { pull } from 'langchain/hub'
import {
    INode,
    INodeData,
    INodeParams,
    ICommonObject,
    MessageContentImageUrl,
    INodeOutputsValue,
    ISeqAgentNode,
    IDatabaseEntity,
    ConversationHistorySelection,
    ISeqAgentsState
} from '../../../src/Interface'
import { convertStructuredSchemaToZod,
     ExtractTool,
     getVM,
    processImageMessage,
    transformObjectPropertyToFunction,
    filterConversationHistory,
    restructureMessages,
    MessagesState,
    
    checkMessageHistory} from '../commonUtils'
import { ChatGoogleGenerativeAI } from '../../chatmodels/ChatGoogleGenerativeAI/FlowiseChatGoogleGenerativeAI'

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

// Define state for React agent
interface ReactAgentState {
    messages: BaseMessage[];
    next: string;
}

class ReactLLM_SeqAgents implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'React LLM'
        this.name = 'seqReactLLM'
        this.version = 1.0
        this.type = 'ReactLLM'
        this.icon = 'reactLLM.svg'
        this.category = 'Sequential Agents'
        this.description = 'Modern React-pattern LLM node for sequential processing'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Name',
                name: 'llmNodeName',
                type: 'string',
                placeholder: 'LLM'
            },
            {
                label: 'System Prompt',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true
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
                type: 'Start | Agent | Condition | LLMNode | ToolNode | CustomFunction | ReactLLM | ExecuteFlow',
                description:
                    'Can be connected to one of the following nodes: Start, Agent, Condition, LLM Node, ReactLLM, Tool Node, Custom Function, Execute Flow',
                list: true
            },
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel',
                optional: true,
                description: `Overwrite model to be used for this node`
            },
            {
                label: 'JSON Structured Output',
                name: 'llmStructuredOutput',
                type: 'datagrid',
                description: 'Instruct the LLM to give output in a JSON structured schema',
                datagrid: [
                    { field: 'key', headerName: 'Key', editable: true },
                    {
                        field: 'type',
                        headerName: 'Type',
                        type: 'singleSelect',
                        valueOptions: ['String', 'String Array', 'Number', 'Boolean', 'Enum'],
                        editable: true
                    },
                    { field: 'enumValues', headerName: 'Enum Values', editable: true },
                    { field: 'description', headerName: 'Description', flex: 1, editable: true }
                ],
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const inputs = nodeData.inputs as ICommonObject
        const {
            llmNodeName,
            systemMessagePrompt,
            model: llm,
            llmStructuredOutput,
            tools = [],
            sequentialNodes,
            conversationHistorySelection
        } = inputs

        if (!llmNodeName) throw new Error('LLM Node name is required!')
        if (!sequentialNodes?.length) throw new Error('ReactLLM must have a predecessor!')

        const startLLM = sequentialNodes[0].startLLM
        const configuredLLM = llm || startLLM
        if (nodeData.inputs) nodeData.inputs.model = configuredLLM

        // Handle image messages if model supports vision
        const multiModalMessageContent = sequentialNodes[0]?.multiModalMessageContent || (await processImageMessage(configuredLLM, nodeData, options))

        // Configure LLM with structured output if specified
        let llmWithOutput = configuredLLM as BaseChatModel
        if (llmStructuredOutput && llmStructuredOutput !== '[]') {
            const schema = z.object(convertStructuredSchemaToZod(llmStructuredOutput))
            
            if (llmWithOutput instanceof ChatGoogleGenerativeAI) {
                const tool = new ExtractTool({ schema })
                llmWithOutput = llmWithOutput.bind({
                    tools: [tool]
                }) as BaseChatModel
            } else {
                llmWithOutput = llmWithOutput.withStructuredOutput(schema) as BaseChatModel
            }
        }

        // Get the React prompt from LangChain hub
        const prompt = await pull<ChatPromptTemplate>('hwchase17/react')

        // Create React agent
        const agent = await createReactAgent({
            llm: llmWithOutput,
            tools: tools as StructuredTool[]
        })

        const workerNode = async (state: ISeqAgentsState, config: RunnableConfig) => {
            const abortControllerSignal = options.signal as AbortController
            if (abortControllerSignal.signal.aborted) {
                throw new Error('Aborted!')
            }

            // Handle conversation history selection using UI input or default
            const historySelection = (conversationHistorySelection || 'all_messages') as ConversationHistorySelection
            const filteredMessages = filterConversationHistory(historySelection, input, state)
            const restructuredMessages = restructureMessages(llmWithOutput, { messages: filteredMessages })

            // Invoke agent with proper state
            const result = await agent.invoke(
                { messages: restructuredMessages },
                { ...config, callbacks: config.callbacks, signal: abortControllerSignal.signal }
            )

            return {
                messages: [result]
            }
        }

        return {
            id: nodeData.id,
            name: llmNodeName,
            type: 'reactllm',
            node: workerNode,
            llm: llmWithOutput,
            startLLM,
            predecessorAgents: sequentialNodes,
            multiModalMessageContent,
            moderations: sequentialNodes[0]?.moderations
        }
    }
}

module.exports = { nodeClass: ReactLLM_SeqAgents } 