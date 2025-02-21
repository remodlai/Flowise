import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { StructuredTool } from '@langchain/core/tools'
import { Document } from '@langchain/core/documents'
import { 
    INodeData, 
    ICommonObject, 
    IStateWithMessages,
    TokenEventType
} from '../../../../src/Interface'
import { SOURCE_DOCUMENTS_PREFIX, ARTIFACTS_PREFIX } from '../../../../src/agents'
import { RunnableCallable, MessagesState } from '../../commonUtils'

/**
 * Tool Node implementation for handling tool execution in sequential agents
 */
export class ToolNode extends RunnableCallable<BaseMessage[] | MessagesState, BaseMessage[] | MessagesState> {
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

    private async run(input: BaseMessage[] | MessagesState, config: RunnableConfig): Promise<BaseMessage[] | MessagesState> {
        try {
            let messages: BaseMessage[]

            // Handle different input types
            if (Array.isArray(input)) {
                messages = input
            } else if ((input as IStateWithMessages).messages) {
                messages = (input as IStateWithMessages).messages
            } else {
                messages = (input as MessagesState).messages
            }

            // Get the last message
            const message = messages[messages.length - 1]
            if (message._getType() !== 'ai') {
                throw new Error('ToolNode only accepts AIMessages as input.')
            }

            // Extract state without messages
            const { messages: _, ...inputWithoutMessages } = Array.isArray(input) ? { messages: input } : input
            const flowState = {
                chatId: this.options.chatId,
                sessionId: this.options.sessionId,
                input: this.inputQuery,
                state: inputWithoutMessages
            }

            // Execute tools
            const outputs = await Promise.all(
                (message as AIMessage).tool_calls?.map(async (call) => {
                    const tool = this.tools.find((tool) => tool.name === call.name)
                    if (!tool) {
                        throw new Error(`Tool ${call.name} not found.`)
                    }

                    // Set flow object if tool supports it
                    if (tool && (tool as any).setFlowObject) {
                        (tool as any).setFlowObject(flowState)
                    }

                    // Execute tool
                    let output = await tool.invoke(call.args, config)
                    let sourceDocuments: Document[] = []
                    let artifacts: ICommonObject[] = []

                    // Handle source documents
                    if (output?.includes(SOURCE_DOCUMENTS_PREFIX)) {
                        const [content, docs] = output.split(SOURCE_DOCUMENTS_PREFIX)
                        output = content
                        try {
                            sourceDocuments = JSON.parse(docs)
                        } catch (e) {
                            console.error('Error parsing source documents from tool:', e)
                        }
                    }

                    // Handle artifacts
                    if (output?.includes(ARTIFACTS_PREFIX)) {
                        const [content, arts] = output.split(ARTIFACTS_PREFIX)
                        output = content
                        try {
                            artifacts = JSON.parse(arts)
                        } catch (e) {
                            console.error('Error parsing artifacts from tool:', e)
                        }
                    }

                    // Create tool message
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

            // Add node ID to all messages
            outputs.forEach((result) => {
                result.additional_kwargs = { 
                    ...result.additional_kwargs, 
                    nodeId: this.nodeData.id,
                    type: TokenEventType.TOOL_RESPONSE
                }
            })

            // Return in proper format
            return Array.isArray(input) ? outputs : { messages: outputs }
        } catch (error) {
            throw new Error(`Tool execution failed: ${error}`)
        }
    }
}
