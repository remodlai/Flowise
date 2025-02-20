import { BaseMessage, AIMessage, ToolMessage } from '@langchain/core/messages'
import { RunnableCallable } from '../../commonUtils'
import { RunnableConfig } from '@langchain/core/runnables'
import { StructuredTool } from '@langchain/core/tools'
import { INodeData, ICommonObject, IDocument, ISeqAgentsState, IStateWithMessages } from '../../../../src/Interface'
import { SOURCE_DOCUMENTS_PREFIX, ARTIFACTS_PREFIX } from '../../../../src/agents'
import { MessagesState } from '../../commonUtils'

/**
 * Tool node implementation that handles tool execution and message processing
 */
export class ToolNode extends RunnableCallable<ISeqAgentsState, ISeqAgentsState> {
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
        const channelsWithoutMessages = {
            chatId: this.options.chatId,
            sessionId: this.options.sessionId,
            input: this.inputQuery,
            state: inputWithoutMessages
        }

        // Process tool calls
        const outputs = await Promise.all(
            (message as AIMessage).tool_calls?.map(async (call) => {
                const tool = this.tools.find((tool) => tool.name === call.name)
                if (!tool) {
                    throw new Error(`Tool ${call.name} not found.`)
                }

                // Set flow object if tool supports it
                if (tool && (tool as any).setFlowObject) {
                    (tool as any).setFlowObject(channelsWithoutMessages)
                }

                // Execute tool
                let output = await tool.invoke(call.args, config)
                let sourceDocuments: Document[] = []
                let artifacts: ICommonObject[] = []

                // Handle source documents
                if (output?.includes(SOURCE_DOCUMENTS_PREFIX)) {
                    const outputArray = output.split(SOURCE_DOCUMENTS_PREFIX)
                    output = outputArray[0]
                    try {
                        sourceDocuments = JSON.parse(outputArray[1])
                    } catch (e) {
                        console.error('Error parsing source documents from tool')
                    }
                }

                // Handle artifacts
                if (output?.includes(ARTIFACTS_PREFIX)) {
                    const outputArray = output.split(ARTIFACTS_PREFIX)
                    output = outputArray[0]
                    try {
                        artifacts = JSON.parse(outputArray[1])
                    } catch (e) {
                        console.error('Error parsing artifacts from tool')
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

        // Add node ID to additional kwargs
        const additional_kwargs: ICommonObject = { nodeId: this.nodeData.id }
        outputs.forEach((result) => {
            result.additional_kwargs = { ...result.additional_kwargs, ...additional_kwargs }
        })

        // Return appropriate format based on input type
        return Array.isArray(input) ? outputs : { messages: outputs }
    }
}
