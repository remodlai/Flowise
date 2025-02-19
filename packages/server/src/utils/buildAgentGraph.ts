import {
    ICommonObject,
    IMultiAgentNode,
    IAgentReasoning,
    IAction,
    ITeamState,
    ConsoleCallbackHandler,
    additionalCallbacks,
    ISeqAgentsState,
    ISeqAgentNode,
    IUsedTool,
    IDocument,
    IServerSideEventStreamer,   
    INodeData
} from 'flowise-components'
import { omit, cloneDeep, flatten, uniq } from 'lodash'
import { StateGraph, END, START } from '@langchain/langgraph'
import { Document } from '@langchain/core/documents'
import { StatusCodes } from 'http-status-codes'
import { v4 as uuidv4 } from 'uuid'
import { StructuredTool } from '@langchain/core/tools'
import { BaseMessage, HumanMessage, AIMessage, AIMessageChunk, ToolMessage } from '@langchain/core/messages'
import { IChatFlow, IComponentNodes, IDepthQueue, IReactFlowNode, IReactFlowEdge, IMessage, IncomingInput, IFlowConfig } from '../Interface'
import { databaseEntities, clearSessionMemory, getAPIOverrideConfig } from '../utils'
import { replaceInputsWithConfig, resolveVariables } from '.'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { getErrorMessage } from '../errors/utils'
import logger from './logger'
import { Variable } from '../database/entities/Variable'
import { DataSource } from 'typeorm'
import { CachePool } from '../CachePool'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { Serialized } from '@langchain/core/load/serializable'
import { RunnableConfig } from '@langchain/core/runnables'

/**
 * Build Agent Graph
 */
export const buildAgentGraph = async ({
    agentflow,
    flowConfig,
    incomingInput,
    nodes,
    edges,
    initializedNodes,
    endingNodeIds,
    startingNodeIds,
    depthQueue,
    chatHistory,
    uploadedFilesContent,
    appDataSource,
    componentNodes,
    sseStreamer,
    shouldStreamResponse,
    cachePool,
    baseURL,
    signal
}: {
    agentflow: IChatFlow
    flowConfig: IFlowConfig
    incomingInput: IncomingInput
    nodes: IReactFlowNode[]
    edges: IReactFlowEdge[]
    initializedNodes: IReactFlowNode[]
    endingNodeIds: string[]
    startingNodeIds: string[]
    depthQueue: IDepthQueue
    chatHistory: IMessage[]
    uploadedFilesContent: string
    appDataSource: DataSource
    componentNodes: IComponentNodes
    sseStreamer: IServerSideEventStreamer
    shouldStreamResponse: boolean
    cachePool: CachePool
    baseURL: string
    signal?: AbortController
}): Promise<any> => {
    try {
        logger.info(`[buildAgentGraph] Flow config: ${JSON.stringify(flowConfig)}`)
        const workerNodes = initializedNodes.filter((node) => node.data.name === 'worker')
        const supervisorNodes = initializedNodes.filter((node) => node.data.name === 'supervisor')
        const seqAgentNodes = initializedNodes.filter((node) => node.data.category === 'Sequential Agents')
        let isSequential = seqAgentNodes.length > 0
        logger.info(`[buildAgentGraph] Flow type: ${isSequential ? 'Sequential' : 'Multi-agent'}`)

        const chatflowid = flowConfig.chatflowid
        const chatId = flowConfig.chatId
        const sessionId = flowConfig.sessionId
        const analytic = agentflow.analytic
        const uploads = incomingInput.uploads

        const options = {
            chatId,
            sessionId,
            chatflowid,
            logger,
            analytic,
            appDataSource,
            databaseEntities,
            cachePool,
            uploads,
            baseURL,
            signal: signal ?? new AbortController(),
            shouldStreamResponse,
            sseStreamer
        }

        let finalResult = ''
        let finalSummarization = ''
        let lastWorkerResult = ''
        let agentReasoning: IAgentReasoning[] = []
        let lastMessageRaw = {} as AIMessageChunk
        let finalAction: IAction = {}
        let totalSourceDocuments: IDocument[] = []
        let totalUsedTools: IUsedTool[] = []
        let totalArtifacts: ICommonObject[] = []

        const mapNameToLabel: Record<string, { label: string; nodeName: string }> = {}

        for (const node of [...workerNodes, ...supervisorNodes, ...seqAgentNodes]) {
            if (!Object.prototype.hasOwnProperty.call(mapNameToLabel, node.data.instance.name)) {
                mapNameToLabel[node.data.instance.name] = {
                    label: node.data.instance.label,
                    nodeName: node.data.name
                }
            }
        }

        try {
            if (!seqAgentNodes.length) {
                const streamResults = await compileMultiAgentsGraph({
                    agentflow,
                    appDataSource,
                    mapNameToLabel,
                    reactFlowNodes: initializedNodes,
                    workerNodeIds: endingNodeIds,
                    componentNodes,
                    options,
                    startingNodeIds,
                    question: incomingInput.question,
                    prependHistoryMessages: incomingInput.history,
                    chatHistory,
                    overrideConfig: incomingInput?.overrideConfig,
                    threadId: sessionId || chatId,
                    summarization: seqAgentNodes.some((node) => node.data.inputs?.summarization),
                    uploadedFilesContent
                })

                if (streamResults) {
                    let startEventSent = false;
                    let conditionEventSent = false;
                    logger.info(`[buildAgentGraph] Starting to process stream results`)
                    for await (const output of await streamResults) {
                        logger.info(`[buildAgentGraph] Processing output:`, output)

                        // Check for __start__ node with content
                        if (output?.['__start__']?.messages && !startEventSent) {
                            logger.info(`[buildAgentGraph] Found __start__ node with messages:`, output['__start__'].messages)
                            if (shouldStreamResponse && sseStreamer) {
                                const seqStateNode = initializedNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')
                                const startReasoning: IAgentReasoning[] = [{
                                    agentName: 'Start',
                                    messages: [incomingInput.question],
                                    state: seqStateNode?.data?.instance?.node ?? {},
                                    usedTools: [],
                                    sourceDocuments: [],
                                    artifacts: []
                                }]
                                logger.info(`[buildAgentGraph] Sending start event at __start__ node with data:`, startReasoning)
                                sseStreamer.streamStartEvent(chatId, startReasoning)
                                startEventSent = true
                            }
                        }

                        // Check for conditional edge
                        if (output?.['conditionalEdge'] && !conditionEventSent) {
                            logger.info(`[buildAgentGraph] Found conditional edge with next:`, output.next)
                            if (shouldStreamResponse && sseStreamer) {
                                logger.info(`[buildAgentGraph] Sending condition event for:`, output.next)
                                sseStreamer.streamConditionEvent(chatId, output.next || '')
                                conditionEventSent = true
                            }
                        }

                        if (!output?.__end__) {
                            for (const agentName of Object.keys(output)) {
                                if (!mapNameToLabel[agentName]) continue

                                // Start agent reasoning section
                                if (shouldStreamResponse && sseStreamer) {
                                    logger.info(`[buildAgentGraph] Sending agent reasoning start event for ${agentName}`)
                                    sseStreamer.streamAgentReasoningStartEvent(chatId)
                                }

                                const nodeId = output[agentName]?.messages
                                    ? output[agentName].messages[output[agentName].messages.length - 1]?.additional_kwargs?.nodeId
                                    : ''
                                const usedTools = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => msg.additional_kwargs?.usedTools)
                                    : []
                                const sourceDocuments = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => msg.additional_kwargs?.sourceDocuments)
                                    : []
                                const artifacts = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => msg.additional_kwargs?.artifacts)
                                    : []
                                const messages = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => (typeof msg === 'string' ? msg : msg.content))
                                    : []
                                lastMessageRaw = output[agentName]?.messages
                                    ? output[agentName].messages[output[agentName].messages.length - 1]
                                    : {}

                                const state = omit(output[agentName], ['messages'])

                                // Just collect tools, don't stream them yet
                                const outputTools = output[agentName]?.output?.usedTools || []
                                const messageTools = usedTools?.filter((tool: IUsedTool) => tool) || []
                                const allTools = [...outputTools, ...messageTools]

                                if (allTools.length) {
                                    totalUsedTools.push(...allTools)
                                }

                                // Add tools to the last message's additional_kwargs
                                if (lastMessageRaw) {
                                    lastMessageRaw.additional_kwargs = {
                                        ...lastMessageRaw.additional_kwargs,
                                        usedTools: allTools
                                    }
                                }

                                // Just collect documents, don't stream them yet
                                const allSourceDocuments = sourceDocuments?.length 
                                    ? flatten(sourceDocuments).filter((doc) => doc) as IDocument[]
                                    : []
                                if (allSourceDocuments.length) {
                                    totalSourceDocuments.push(...allSourceDocuments)
                                }

                                // Just collect artifacts, don't stream them yet
                                const allArtifacts = artifacts?.length 
                                    ? flatten(artifacts).filter((artifact) => artifact) as ICommonObject[]
                                    : []
                                if (allArtifacts.length) {
                                    totalArtifacts.push(...allArtifacts)
                                }

                                // Get graph state
                                const seqStateNode = initializedNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')

                                const reasoning: IAgentReasoning = {
                                    agentName: !output[agentName]?.next || output[agentName]?.next === 'END' ? 'FINAL OUTPUT' : mapNameToLabel[agentName].label,
                                    messages,
                                    next: output[agentName]?.next,
                                    instructions: output[agentName]?.instructions,
                                    usedTools: allTools.length ? uniq(flatten(allTools)) : [],
                                    sourceDocuments: allSourceDocuments.length ? flatten(allSourceDocuments) : [],
                                    artifacts: allArtifacts.length ? flatten(allArtifacts) : [],
                                    state: {
                                        ...seqStateNode?.data?.instance?.node,  // Include graph state
                                        ...output[agentName],  // Include node state
                                        messages: undefined,  // Remove messages to avoid duplication
                                        isFinal: !output[agentName]?.next || output[agentName]?.next === 'FINISH' || output[agentName]?.next === 'END'
                                    },
                                    nodeName: isSequential ? mapNameToLabel[agentName].nodeName : undefined,
                                    nodeId
                                }
                                agentReasoning.push(reasoning)

                                finalSummarization = output[agentName]?.summarization ?? ''

                                lastWorkerResult =
                                    output[agentName]?.messages?.length &&
                                    output[agentName].messages[output[agentName].messages.length - 1]?.additional_kwargs?.type === 'worker'
                                        ? output[agentName].messages[output[agentName].messages.length - 1].content
                                        : lastWorkerResult

                                if (shouldStreamResponse && sseStreamer) {
                                    sseStreamer.streamAgentReasoningStartEvent(chatId)
                                    sseStreamer.streamAgentReasoningEvent(chatId, [reasoning])

                                    // Check if there are LLM tokens to stream
                                    if (output[agentName]?.messages?.length) {
                                        const lastMsg = output[agentName].messages[output[agentName].messages.length - 1]
                                        if (lastMsg.content) {
                                            sseStreamer.streamTokenStartEvent(chatId)
                                            sseStreamer.streamTokenEvent(chatId, typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content))
                                            sseStreamer.streamTokenEndEvent(chatId)
                                        }
                                    }

                                    sseStreamer.streamAgentReasoningEndEvent(chatId)

                                    // Stream tools if any were used
                                    if (allTools.length) {
                                        sseStreamer.streamUsedToolsEvent(chatId, uniq(allTools))
                                    }

                                    // Stream source documents if any were used
                                    if (allSourceDocuments.length) {
                                        sseStreamer.streamSourceDocumentsEvent(chatId, uniq(allSourceDocuments))
                                    }

                                    // Stream artifacts if any were generated
                                    if (allArtifacts.length) {
                                        sseStreamer.streamArtifactsEvent(chatId, uniq(allArtifacts))
                                    }

                                    // Handle condition routing
                                    if (reasoning.next && reasoning.next !== 'FINISH' && reasoning.next !== 'END') {
                                        const nextLabel = mapNameToLabel[reasoning.next]?.label || reasoning.next
                                        // Check if this is a condition node
                                        const nextNode = initializedNodes.find((node) => node.data.name === 'seqCondition' || node.data.name === 'seqConditionAgent')
                                        if (nextNode) {
                                            // Stream condition event with the next route
                                            sseStreamer.streamConditionEvent(chatId, nextLabel)
                                        }
                                    }
                                }
                            }
                        } else {
                            // Handle __end__ message - final node
                            if (output.__end__.messages?.length) {
                                const endMessage = output.__end__.messages.pop()
                                finalResult = endMessage?.content || output.__end__.instructions || ''
                            }
                            if (Array.isArray(finalResult)) finalResult = output.__end__.instructions

                            // Capture final tools
                            if (output.__end__.usedTools) {
                                const finalTools = output.__end__.usedTools.filter((tool: IUsedTool) => tool)
                                if (finalTools.length) {
                                    totalUsedTools.push(...finalTools)
                                }
                            }

                            if (shouldStreamResponse && sseStreamer) {
                                // Get graph state
                                const seqStateNode = initializedNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')

                                // Mark this as the final agent reasoning This isn't needed
                                sseStreamer.streamAgentReasoningStartEvent(chatId)
                                sseStreamer.streamAgentReasoningEvent(chatId, [{
                                    agentName: 'Final Output',
                                    messages: [finalResult],
                                    
                                    usedTools: totalUsedTools.length ? uniq(totalUsedTools) : [],
                                    sourceDocuments: totalSourceDocuments.length ? uniq(totalSourceDocuments) : [],
                                    artifacts: totalArtifacts.length ? uniq(totalArtifacts) : [],
                                    state: {
                                        ...seqStateNode?.data?.instance?.node,  // Include graph state
                                        output: finalResult,
                                        isFinal: true
                                    },
                                    nodeName: isSequential ? 'Final' : undefined
                                }])
                                sseStreamer.streamAgentReasoningEndEvent(chatId)

                                // Stream final token
                                sseStreamer.streamTokenStartEvent(chatId)
                                sseStreamer.streamTokenEvent(chatId, finalResult)
                                sseStreamer.streamTokenEndEvent(chatId)

                                // Always stream collections, even if empty
                                sseStreamer.streamUsedToolsEvent(chatId, uniq(totalUsedTools))
                                sseStreamer.streamSourceDocumentsEvent(chatId, uniq(totalSourceDocuments))
                                sseStreamer.streamArtifactsEvent(chatId, uniq(totalArtifacts))
                            }
                        }
                    }

                    // Only use fallbacks if we don't have a final result
                    if (!finalResult) {
                        if (lastWorkerResult) finalResult = lastWorkerResult
                        else if (finalSummarization) finalResult = finalSummarization
                        if (shouldStreamResponse && sseStreamer) {
                            sseStreamer.streamTokenEvent(chatId, finalResult)
                        }
                    }

                    if (shouldStreamResponse && sseStreamer) {
                        sseStreamer.streamEndEvent(chatId)
                    }

                    return {
                        finalResult,
                        finalAction,
                        sourceDocuments: totalSourceDocuments.length ? uniq(totalSourceDocuments) : [],
                        artifacts: totalArtifacts.length ? uniq(totalArtifacts) : [],
                        usedTools: totalUsedTools.length ? uniq(totalUsedTools) : [],
                        agentReasoning
                    }
                }
            } else {
                isSequential = true
                const streamResults = await compileSeqAgentsGraph({
                    depthQueue,
                    agentflow,
                    appDataSource,
                    reactFlowNodes: initializedNodes,
                    reactFlowEdges: edges,
                    componentNodes,
                    options,
                    question: incomingInput.question,
                    prependHistoryMessages: incomingInput.history,
                    chatHistory,
                    overrideConfig: incomingInput?.overrideConfig,
                    threadId: sessionId || chatId,
                    action: incomingInput.action,
                    uploadedFilesContent
                })

                if (streamResults) {
                    let startEventSent = false;
                    for await (const output of await streamResults) {
                        logger.info(`[buildAgentGraph] Processing sequential output:`, output)

                        // Check for __start__ node with content
                        if (output?.['__start__']?.messages && !startEventSent) {
                            logger.info(`[buildAgentGraph] Found sequential __start__ node with messages:`, output['__start__'].messages)
                            if (shouldStreamResponse && sseStreamer) {
                                const seqStateNode = initializedNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')
                                const startReasoning: IAgentReasoning[] = [{
                                    agentName: 'Start',
                                    messages: [incomingInput.question],
                                    state: seqStateNode?.data?.instance?.node ?? {},
                                    usedTools: [],
                                    sourceDocuments: [],
                                    artifacts: []
                                }]
                                logger.info(`[buildAgentGraph] Sending sequential start event with data:`, startReasoning)
                                sseStreamer.streamStartEvent(chatId, startReasoning)
                                startEventSent = true
                            }
                        }

                        // Check for conditional edge
                        if (output?.['conditionalEdge'] && !startEventSent) {
                            logger.info(`[buildAgentGraph] Found conditional edge with next:`, output.next)
                            if (shouldStreamResponse && sseStreamer) {
                                logger.info(`[buildAgentGraph] Sending condition event for:`, output.next)
                                sseStreamer.streamConditionEvent(chatId, output.next || '')
                                startEventSent = true
                            }
                        }

                        if (!output?.__end__) {
                            for (const agentName of Object.keys(output)) {
                                if (!mapNameToLabel[agentName]) continue

                                // Start agent reasoning section
                                if (shouldStreamResponse && sseStreamer) {
                                    sseStreamer.streamAgentReasoningStartEvent(chatId)
                                }

                                const nodeId = output[agentName]?.messages
                                    ? output[agentName].messages[output[agentName].messages.length - 1]?.additional_kwargs?.nodeId
                                    : ''
                                const usedTools = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => msg.additional_kwargs?.usedTools)
                                    : []
                                const sourceDocuments = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => msg.additional_kwargs?.sourceDocuments)
                                    : []
                                const artifacts = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => msg.additional_kwargs?.artifacts)
                                    : []
                                const messages = output[agentName]?.messages
                                    ? output[agentName].messages.map((msg: BaseMessage) => (typeof msg === 'string' ? msg : msg.content))
                                    : []
                                lastMessageRaw = output[agentName]?.messages
                                    ? output[agentName].messages[output[agentName].messages.length - 1]
                                    : {}

                                const state = omit(output[agentName], ['messages'])

                                // Just collect tools, don't stream them yet
                                const outputTools = output[agentName]?.output?.usedTools || []
                                const messageTools = usedTools?.filter((tool: IUsedTool) => tool) || []
                                const allTools = [...outputTools, ...messageTools]

                                if (allTools.length) {
                                    totalUsedTools.push(...allTools)
                                }

                                // Add tools to the last message's additional_kwargs
                                if (lastMessageRaw) {
                                    lastMessageRaw.additional_kwargs = {
                                        ...lastMessageRaw.additional_kwargs,
                                        usedTools: allTools
                                    }
                                }

                                // Just collect documents, don't stream them yet
                                const allSourceDocuments = sourceDocuments?.length 
                                    ? flatten(sourceDocuments).filter((doc) => doc) as IDocument[]
                                    : []
                                if (allSourceDocuments.length) {
                                    totalSourceDocuments.push(...allSourceDocuments)
                                }

                                // Just collect artifacts, don't stream them yet
                                const allArtifacts = artifacts?.length 
                                    ? flatten(artifacts).filter((artifact) => artifact) as ICommonObject[]
                                    : []
                                if (allArtifacts.length) {
                                    totalArtifacts.push(...allArtifacts)
                                }

                                // Get graph state
                                const seqStateNode = initializedNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')

                                const reasoning: IAgentReasoning = {
                                    agentName: mapNameToLabel[agentName].label,
                                    messages,
                                    
                                    next: output[agentName]?.next,
                                    instructions: output[agentName]?.instructions,
                                    usedTools: allTools.length ? uniq(flatten(allTools)) : [],
                                    sourceDocuments: allSourceDocuments.length ? allSourceDocuments : [],
                                    artifacts: allArtifacts.length ? allArtifacts : [],
                                    state: {
                                        ...(lastMessageRaw.additional_kwargs?.state || {}),
                                        messages,
                                        isFinal: !output[agentName]?.next || output[agentName]?.next === 'FINISH' || output[agentName]?.next === 'END'
                                    },
                                    
                                    nodeName: isSequential ? mapNameToLabel[agentName].nodeName : undefined,
                                    nodeId
                                }
                                agentReasoning.push(reasoning)

                                if (shouldStreamResponse && sseStreamer) {
                                    sseStreamer.streamAgentReasoningEvent(flowConfig.chatId, [reasoning])

                                    // Check if there are LLM tokens to stream
                                    if (output[agentName]?.messages?.length) {
                                        const lastMsg = output[agentName].messages[output[agentName].messages.length - 1]
                                        if (lastMsg.content) {
                                            sseStreamer.streamTokenStartEvent(chatId)
                                            sseStreamer.streamTokenEvent(chatId, typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content))
                                            sseStreamer.streamTokenEndEvent(chatId)
                                        }
                                    }

                                    sseStreamer.streamAgentReasoningEndEvent(chatId)

                                    // Send condition event if next is condition
                                    if (reasoning.next && reasoning.next !== 'FINISH' && reasoning.next !== 'END') {
                                        const nextLabel = mapNameToLabel[reasoning.next]?.label || reasoning.next
                                        sseStreamer.streamConditionEvent(chatId, nextLabel)
                                    }
                                }
                            }
                        } else {
                            // Handle __end__ message - final node
                            if (output.__end__.messages?.length) {
                                const endMessage = output.__end__.messages.pop()
                                finalResult = endMessage?.content || output.__end__.instructions || ''
                            }
                            if (Array.isArray(finalResult)) finalResult = output.__end__.instructions

                            // Capture final tools
                            if (output.__end__.usedTools) {
                                const finalTools = output.__end__.usedTools.filter((tool: IUsedTool) => tool)
                                if (finalTools.length) {
                                    totalUsedTools.push(...finalTools)
                                }
                            }

                            if (shouldStreamResponse && sseStreamer) {
                                // Get graph state
                                const seqStateNode = initializedNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')

                                // Mark this as the final agent reasoning
                                sseStreamer.streamAgentReasoningStartEvent(flowConfig.chatId)
                                sseStreamer.streamAgentReasoningEvent(chatId, [{
                                    agentName: 'Final Output',
                                    messages: [finalResult],
                                    usedTools: totalUsedTools.length ? uniq(totalUsedTools) : [],
                                    sourceDocuments: totalSourceDocuments.length ? uniq(totalSourceDocuments) : [],
                                    artifacts: totalArtifacts.length ? uniq(totalArtifacts) : [],
                                    state: {
                                        finalAction: finalAction,  // Include graph state
                                        output: finalResult,
                                        isFinal: true
                                    },
                                    nodeName: isSequential ? 'Final' : undefined
                                }])
                                sseStreamer.streamAgentReasoningEndEvent(chatId)

                                // Stream final token
                                sseStreamer.streamTokenStartEvent(chatId)
                                sseStreamer.streamTokenEvent(chatId, finalResult)
                                sseStreamer.streamTokenEndEvent(chatId)
                                totalUsedTools = uniq(flatten(totalUsedTools))
                                // Always stream collections, even if empty
                                sseStreamer.streamUsedToolsEvent(chatId, totalUsedTools)
                                sseStreamer.streamSourceDocumentsEvent(flowConfig.chatId, uniq(totalSourceDocuments))
                                sseStreamer.streamArtifactsEvent(chatId, uniq(totalArtifacts))
                            }
                        }
                    }

                    // Only use fallbacks if we don't have a final result
                    if (!finalResult) {
                        if (lastWorkerResult) finalResult = lastWorkerResult
                        else if (finalSummarization) finalResult = finalSummarization
                        if (shouldStreamResponse && sseStreamer) {
                            sseStreamer.streamTokenEvent(chatId, finalResult)
                        }
                    }

                    if (shouldStreamResponse && sseStreamer) {
                        sseStreamer.streamEndEvent(chatId)
                    }

                    return {
                        finalResult,
                        finalAction,
                        sourceDocuments: totalSourceDocuments.length ? uniq(totalSourceDocuments) : [],
                        artifacts: totalArtifacts.length ? uniq(totalArtifacts) : [],
                        usedTools: totalUsedTools.length ? uniq(totalUsedTools) : [],
                        agentReasoning
                    }
                }
            }
        } catch (e) {
            // clear agent memory because checkpoints were saved during runtime
            await clearSessionMemory(nodes, componentNodes, chatId, appDataSource, sessionId)
            if (getErrorMessage(e).includes('Aborted')) {
                if (shouldStreamResponse && sseStreamer) {
                    sseStreamer.streamAbortEvent(chatId)
                }
                return { finalResult, agentReasoning }
            }
            throw new Error(getErrorMessage(e))
        }
    } catch (e) {
        logger.error('[server]: Error:', e)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error buildAgentGraph - ${getErrorMessage(e)}`)
    }
}

type MultiAgentsGraphParams = {
    agentflow: IChatFlow
    appDataSource: DataSource
    mapNameToLabel: Record<string, { label: string; nodeName: string }>
    reactFlowNodes: IReactFlowNode[]
    workerNodeIds: string[]
    componentNodes: IComponentNodes
    options: ICommonObject
    startingNodeIds: string[]
    question: string
    prependHistoryMessages?: IMessage[]
    chatHistory?: IMessage[]
    overrideConfig?: ICommonObject
    threadId?: string
    summarization?: boolean
    uploadedFilesContent?: string
}

const compileMultiAgentsGraph = async (params: MultiAgentsGraphParams) => {
    const {
        agentflow,
        appDataSource,
        mapNameToLabel,
        reactFlowNodes,
        workerNodeIds,
        componentNodes,
        options,
        prependHistoryMessages = [],
        chatHistory = [],
        overrideConfig = {},
        threadId,
        summarization = false,
        uploadedFilesContent
    } = params

    let question = params.question

    const channels: ITeamState = {
        messages: {
            value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
            default: () => []
        },
        next: 'initialState',
        instructions: "Solve the user's request.",
        team_members: []
    }

    if (summarization) channels.summarization = 'summarize'

    const workflowGraph = new StateGraph<ITeamState>({
        //@ts-ignore
        channels
    })

    const workerNodes = reactFlowNodes.filter((node) => workerNodeIds.includes(node.data.id))

    /*** Get API Config ***/
    const availableVariables = await appDataSource.getRepository(Variable).find()
    const { nodeOverrides, variableOverrides, apiOverrideStatus } = getAPIOverrideConfig(agentflow)

    let supervisorWorkers: { [key: string]: IMultiAgentNode[] } = {}

    // Init worker nodes
    for (const workerNode of workerNodes) {
        const nodeInstanceFilePath = componentNodes[workerNode.data.name].filePath as string
        const nodeModule = await import(nodeInstanceFilePath)
        const newNodeInstance = new nodeModule.nodeClass()

        let flowNodeData = cloneDeep(workerNode.data)
        if (overrideConfig && apiOverrideStatus)
            flowNodeData = replaceInputsWithConfig(flowNodeData, overrideConfig, nodeOverrides, variableOverrides)
        flowNodeData = await resolveVariables(
            flowNodeData,
            reactFlowNodes,
            question,
            chatHistory,
            overrideConfig,
            uploadedFilesContent,
            availableVariables,
            variableOverrides
        )

        try {
            const workerResult: IMultiAgentNode = await newNodeInstance.init(flowNodeData, question, options)
            const parentSupervisor = workerResult.parentSupervisorName
            if (!parentSupervisor || workerResult.type !== 'worker') continue
            if (Object.prototype.hasOwnProperty.call(supervisorWorkers, parentSupervisor)) {
                supervisorWorkers[parentSupervisor].push(workerResult)
            } else {
                supervisorWorkers[parentSupervisor] = [workerResult]
            }

            workflowGraph.addNode(workerResult.name, workerResult.node)
        } catch (e) {
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error initialize worker nodes - ${getErrorMessage(e)}`)
        }
    }

    // Init supervisor nodes
    for (const supervisor in supervisorWorkers) {
        const supervisorInputLabel = mapNameToLabel[supervisor].label
        const supervisorNode = reactFlowNodes.find((node) => supervisorInputLabel === node.data.inputs?.supervisorName)
        if (!supervisorNode) continue

        const nodeInstanceFilePath = componentNodes[supervisorNode.data.name].filePath as string
        const nodeModule = await import(nodeInstanceFilePath)
        const newNodeInstance = new nodeModule.nodeClass()

        let flowNodeData = cloneDeep(supervisorNode.data)

        if (overrideConfig && apiOverrideStatus)
            flowNodeData = replaceInputsWithConfig(flowNodeData, overrideConfig, nodeOverrides, variableOverrides)
        flowNodeData = await resolveVariables(
            flowNodeData,
            reactFlowNodes,
            question,
            chatHistory,
            overrideConfig,
            uploadedFilesContent,
            availableVariables,
            variableOverrides
        )

        if (flowNodeData.inputs) flowNodeData.inputs.workerNodes = supervisorWorkers[supervisor]

        try {
            const supervisorResult: IMultiAgentNode = await newNodeInstance.init(flowNodeData, question, options)
            if (!supervisorResult.workers?.length) continue

            if (supervisorResult.moderations && supervisorResult.moderations.length > 0) {
                try {
                    for (const moderation of supervisorResult.moderations) {
                        question = await moderation.checkForViolations(question)
                    }
                } catch (e) {
                    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, getErrorMessage(e))
                }
            }

            workflowGraph.addNode(supervisorResult.name, supervisorResult.node)

            for (const worker of supervisorResult.workers) {
                //@ts-ignore
                workflowGraph.addEdge(worker, supervisorResult.name)
            }

            let conditionalEdges: { [key: string]: string } = {}
            for (let i = 0; i < supervisorResult.workers.length; i++) {
                conditionalEdges[supervisorResult.workers[i]] = supervisorResult.workers[i]
            }

            //@ts-ignore
            workflowGraph.addConditionalEdges(supervisorResult.name, (x: ITeamState) => x.next, {
                ...conditionalEdges,
                FINISH: END
            })

            //@ts-ignore
            workflowGraph.addEdge(START, supervisorResult.name)
            ;(workflowGraph as any).signal = options.signal

            // Get memory
            let memory = supervisorResult?.checkpointMemory

            const graph = workflowGraph.compile({ checkpointer: memory })

            const loggerHandler = new ConsoleCallbackHandler(logger)
            const additionalCbs = await additionalCallbacks(flowNodeData as any, options)
            const bindModel = {} // Initialize empty bindModel object
            const config: RunnableConfig & { 
                configurable: { thread_id: string | undefined }; 
                bindModel: Record<string, any>;
                callbacks: (BaseCallbackHandler | ConsoleCallbackHandler)[];
            } = { 
                configurable: { thread_id: threadId }, 
                bindModel,
                callbacks: [loggerHandler, ...additionalCbs]
            }

            let prependMessages = []
            // Only append in the first message
            if (prependHistoryMessages.length === chatHistory.length) {
                for (const message of prependHistoryMessages) {
                    if (message.role === 'apiMessage' || message.type === 'apiMessage') {
                        prependMessages.push(
                            new AIMessage({
                                content: message.message || message.content || ''
                            })
                        )
                    } else if (message.role === 'userMessage' || message.type === 'userMessage') {
                        prependMessages.push(
                            new HumanMessage({
                                content: message.message || message.content || ''
                            })
                        )
                    }
                }
            }

            // Return stream result as we should only have 1 supervisor
            const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${question}` : question
            return await graph.stream(
                {
                    messages: [...prependMessages, new HumanMessage({ content: finalQuestion })]
                },
                config
            )
        } catch (e) {
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error initialize supervisor nodes - ${getErrorMessage(e)}`)
        }
    }
}

type SeqAgentsGraphParams = {
    depthQueue: IDepthQueue
    agentflow: IChatFlow
    appDataSource: DataSource
    reactFlowNodes: IReactFlowNode[]
    reactFlowEdges: IReactFlowEdge[]
    componentNodes: IComponentNodes
    options: ICommonObject
    question: string
    prependHistoryMessages?: IMessage[]
    chatHistory?: IMessage[]
    overrideConfig?: ICommonObject
    threadId?: string
    action?: IAction
    uploadedFilesContent?: string
}

const compileSeqAgentsGraph = async (params: SeqAgentsGraphParams) => {
    const {
        depthQueue,
        agentflow,
        appDataSource,
        reactFlowNodes,
        reactFlowEdges,
        componentNodes,
        options,
        prependHistoryMessages = [],
        chatHistory = [],
        overrideConfig = {},
        threadId,
        action,
        uploadedFilesContent
    } = params

    let question = params.question

    let channels: ISeqAgentsState = {
        messages: {
            value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
            default: () => []
        }
    }

    // Get state
    const seqStateNode = reactFlowNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')
    if (seqStateNode) {
        channels = {
            ...seqStateNode.data.instance.node,
            ...channels
        }
    }

    let seqGraph = new StateGraph<any>({
        //@ts-ignore
        channels
    })

    /*** Validate Graph ***/
    const startAgentNodes: IReactFlowNode[] = reactFlowNodes.filter((node: IReactFlowNode) => node.data.name === 'seqStart')
    if (!startAgentNodes.length) throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'Start node not found')
    if (startAgentNodes.length > 1)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'Graph should have only one start node')

    const endAgentNodes: IReactFlowNode[] = reactFlowNodes.filter((node: IReactFlowNode) => node.data.name === 'seqEnd')
    const loopNodes: IReactFlowNode[] = reactFlowNodes.filter((node: IReactFlowNode) => node.data.name === 'seqLoop')
    if (!endAgentNodes.length && !loopNodes.length) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, 'Graph should have at least one End/Loop node')
    }
    /*** End of Validation ***/

    let flowNodeData
    let conditionalEdges: Record<string, { nodes: Record<string, string>; func: any }> = {}
    let interruptedRouteMapping: Record<string, Record<string, string>> = {}
    let conditionalToolNodes: Record<string, { source: ISeqAgentNode; toolNodes: ISeqAgentNode[] }> = {}
    let bindModel: Record<string, any> = {}
    let interruptToolNodeNames = []

    /*** Get API Config ***/
    const availableVariables = await appDataSource.getRepository(Variable).find()
    const { nodeOverrides, variableOverrides, apiOverrideStatus } = getAPIOverrideConfig(agentflow)

    const initiateNode = async (node: IReactFlowNode) => {
        const nodeInstanceFilePath = componentNodes[node.data.name].filePath as string
        const nodeModule = await import(nodeInstanceFilePath)
        const newNodeInstance = new nodeModule.nodeClass()

        flowNodeData = cloneDeep(node.data)
        if (overrideConfig && apiOverrideStatus)
            flowNodeData = replaceInputsWithConfig(flowNodeData, overrideConfig, nodeOverrides, variableOverrides)
        flowNodeData = await resolveVariables(
            flowNodeData,
            reactFlowNodes,
            question,
            chatHistory,
            overrideConfig,
            uploadedFilesContent,
            availableVariables,
            variableOverrides
        )

        const seqAgentNode: ISeqAgentNode = await newNodeInstance.init(flowNodeData, question, options)
        return seqAgentNode
    }

    /*
     *  Two objectives we want to achieve here:
     *  1.) Prepare the mapping of conditional outputs to next nodes. This mapping will ONLY be used to add conditional edges to the Interrupted Agent connected next to Condition/ConditionAgent Node.
     *    For example, if the condition node has 2 outputs 'Yes' and 'No', and 'Yes' leads to 'agentName1' and 'No' leads to 'agentName2', then the mapping should be like:
     *    {
     *      <conditionNodeId>: { 'Yes': 'agentName1', 'No': 'agentName2' }
     *    }
     */
    const processInterruptedRouteMapping = (conditionNodeId: string) => {
        const conditionEdges = reactFlowEdges.filter((edge) => edge.source === conditionNodeId) ?? []

        for (const conditionEdge of conditionEdges) {
            const nextNodeId = conditionEdge.target
            const conditionNodeOutputAnchorId = conditionEdge.sourceHandle

            const nextNode = reactFlowNodes.find((node) => node.id === nextNodeId)
            if (!nextNode) continue

            const conditionNode = reactFlowNodes.find((node) => node.id === conditionNodeId)
            if (!conditionNode) continue

            const outputAnchors = conditionNode?.data.outputAnchors
            if (!outputAnchors || !outputAnchors.length || !outputAnchors[0].options) continue

            const conditionOutputAnchorLabel =
                outputAnchors[0].options.find((option: any) => option.id === conditionNodeOutputAnchorId)?.label ?? ''
            if (!conditionOutputAnchorLabel) continue

            if (Object.prototype.hasOwnProperty.call(interruptedRouteMapping, conditionNodeId)) {
                interruptedRouteMapping[conditionNodeId] = {
                    ...interruptedRouteMapping[conditionNodeId],
                    [conditionOutputAnchorLabel]: nextNode.data.instance.name
                }
            } else {
                interruptedRouteMapping[conditionNodeId] = {
                    [conditionOutputAnchorLabel]: nextNode.data.instance.name
                }
            }
        }
    }

    /*
     *  Prepare Conditional Edges
     *  Example: {
     *    'seqCondition_1': { nodes: { 'Yes': 'agentName1', 'No': 'agentName2' }, func: <condition-function>, disabled: true },
     *    'seqCondition_2': { nodes: { 'Yes': 'agentName3', 'No': 'agentName4' }, func: <condition-function> }
     *  }
     */
    const prepareConditionalEdges = (nodeId: string, nodeInstance: ISeqAgentNode) => {
        const conditionEdges = reactFlowEdges.filter((edge) => edge.target === nodeId && edge.source.includes('seqCondition')) ?? []

        for (const conditionEdge of conditionEdges) {
            const conditionNodeId = conditionEdge.source
            const conditionNodeOutputAnchorId = conditionEdge.sourceHandle

            const conditionNode = reactFlowNodes.find((node) => node.id === conditionNodeId)
            const outputAnchors = conditionNode?.data.outputAnchors

            if (!outputAnchors || !outputAnchors.length || !outputAnchors[0].options) continue

            const conditionOutputAnchorLabel =
                outputAnchors[0].options.find((option: any) => option.id === conditionNodeOutputAnchorId)?.label ?? ''

            if (!conditionOutputAnchorLabel) continue

            if (Object.prototype.hasOwnProperty.call(conditionalEdges, conditionNodeId)) {
                conditionalEdges[conditionNodeId] = {
                    ...conditionalEdges[conditionNodeId],
                    nodes: {
                        ...conditionalEdges[conditionNodeId].nodes,
                        [conditionOutputAnchorLabel]: nodeInstance.name
                    }
                }
            } else {
                conditionalEdges[conditionNodeId] = {
                    nodes: { [conditionOutputAnchorLabel]: nodeInstance.name },
                    func: conditionNode.data.instance.node
                }
            }
        }
    }

    /*
     *  Prepare Conditional Tool Edges. This is just for LLMNode -> ToolNode
     *  Example: {
     *    'agent_1': { source: agent, toolNodes: [node] }
     *  }
     */
    const prepareLLMToToolEdges = (predecessorAgent: ISeqAgentNode, toolNodeInstance: ISeqAgentNode) => {
        if (Object.prototype.hasOwnProperty.call(conditionalToolNodes, predecessorAgent.id)) {
            const toolNodes = conditionalToolNodes[predecessorAgent.id].toolNodes
            toolNodes.push(toolNodeInstance)
            conditionalToolNodes[predecessorAgent.id] = {
                source: predecessorAgent,
                toolNodes
            }
        } else {
            conditionalToolNodes[predecessorAgent.id] = {
                source: predecessorAgent,
                toolNodes: [toolNodeInstance]
            }
        }
    }

    /*** This is to bind the tools to the model of LLMNode, when the LLMNode is predecessor/successor of ToolNode ***/
    const createBindModel = (agent: ISeqAgentNode, toolNodeInstance: ISeqAgentNode) => {
        const tools = flatten(toolNodeInstance.node?.tools)
        bindModel[agent.id] = agent.llm.bindTools(tools)
    }

    /*** Start processing every Agent nodes ***/
    for (const agentNodeId of getSortedDepthNodes(depthQueue)) {
        const agentNode = reactFlowNodes.find((node) => node.id === agentNodeId)
        if (!agentNode) continue

        const eligibleSeqNodes = ['seqAgent', 'seqEnd', 'seqLoop', 'seqToolNode', 'seqLLMNode', 'seqCustomFunction', 'seqExecuteFlow']
        const nodesToAdd = ['seqAgent', 'seqToolNode', 'seqLLMNode', 'seqCustomFunction', 'seqExecuteFlow']

        if (eligibleSeqNodes.includes(agentNode.data.name)) {
            try {
                const agentInstance: ISeqAgentNode = await initiateNode(agentNode)

                if (nodesToAdd.includes(agentNode.data.name)) {
                    // Add node to graph
                    seqGraph.addNode(agentInstance.name, agentInstance.node)

                    /*
                     * If it is an Interrupted Agent, we want to:
                     * 1.) Add conditional edges to the Interrupted Agent via agentInterruptToolFunc
                     * 2.) Add agent to the interruptToolNodeNames list
                     */
                    if (agentInstance.type === 'agent' && agentNode.data.inputs?.interrupt) {
                        interruptToolNodeNames.push(agentInstance.agentInterruptToolNode.name)

                        const nextNodeId = reactFlowEdges.find((edge) => edge.source === agentNode.id)?.target
                        const nextNode = reactFlowNodes.find((node) => node.id === nextNodeId)

                        let nextNodeSeqAgentName = ''
                        if (nextNodeId && nextNode) {
                            nextNodeSeqAgentName = nextNode.data.instance.name

                            // If next node is Condition Node, process the interrupted route mapping
                            if (nextNode.data.name.includes('seqCondition')) {
                                const conditionNode = nextNodeId
                                processInterruptedRouteMapping(conditionNode)
                                seqGraph = await agentInstance.agentInterruptToolFunc(
                                    seqGraph,
                                    undefined,
                                    nextNode.data.instance.node,
                                    interruptedRouteMapping[conditionNode]
                                )
                            } else {
                                seqGraph = await agentInstance.agentInterruptToolFunc(seqGraph, nextNodeSeqAgentName)
                            }
                        } else {
                            seqGraph = await agentInstance.agentInterruptToolFunc(seqGraph, nextNodeSeqAgentName)
                        }
                    }
                }

                if (agentInstance.predecessorAgents) {
                    const predecessorAgents: ISeqAgentNode[] = agentInstance.predecessorAgents

                    const edges = []
                    for (const predecessorAgent of predecessorAgents) {
                        // Add start edge and set entry point
                        if (predecessorAgent.name === START) {
                            if (agentInstance.moderations && agentInstance.moderations.length > 0) {
                                try {
                                    for (const moderation of agentInstance.moderations) {
                                        question = await moderation.checkForViolations(question)
                                    }
                                } catch (e) {
                                    throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, getErrorMessage(e))
                                }
                            }
                            //@ts-ignore
                            seqGraph.addEdge(START, agentInstance.name)
                        } else if (predecessorAgent.type === 'condition') {
                            /*
                             * If current node is Condition Node, AND predecessor is an Interrupted Agent
                             * Don't add conditional edges to the Interrupted Agent, as it will be added separately from the function - agentInterruptToolFunc
                             */
                            if (!Object.prototype.hasOwnProperty.call(interruptedRouteMapping, predecessorAgent.id)) {
                                prepareConditionalEdges(agentNode.data.id, agentInstance)
                            }
                        } else if (agentNode.data.name === 'seqToolNode') {
                            // Prepare the conditional edges for LLMNode -> ToolNode AND bind the tools to LLMNode
                            prepareLLMToToolEdges(predecessorAgent, agentInstance)
                            createBindModel(predecessorAgent, agentInstance)

                            // If current ToolNode has interrupt turned on, add the ToolNode name to interruptToolNodeNames
                            if (agentInstance.node.interrupt) {
                                interruptToolNodeNames.push(agentInstance.name)
                            }
                        } else if (predecessorAgent.name) {
                            // In the scenario when ToolNode -> LLMNode, bind the tools to LLMNode
                            if (agentInstance.type === 'llm' && predecessorAgent.type === 'tool') {
                                createBindModel(agentInstance, predecessorAgent)
                            }

                            // Add edge to graph ONLY when predecessor is not an Interrupted Agent
                            if (!predecessorAgent.agentInterruptToolNode) {
                                edges.push(predecessorAgent.name)
                            }
                        }
                    }

                    // Edges can be multiple, in the case of parallel node executions
                    if (edges.length > 1) {
                        //@ts-ignore
                        seqGraph.addEdge(edges, agentInstance.name)
                    } else if (edges.length === 1) {
                        //@ts-ignore
                        seqGraph.addEdge(...edges, agentInstance.name)
                    }
                }
            } catch (e) {
                throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error initialize agent nodes - ${getErrorMessage(e)}`)
            }
        }
    }

    /*** Add conditional edges to graph for condition nodes ***/
    for (const conditionNodeId in conditionalEdges) {
        const startConditionEdges = reactFlowEdges.filter((edge) => edge.target === conditionNodeId)
        if (!startConditionEdges.length) continue

        for (const startConditionEdge of startConditionEdges) {
            const startConditionNode = reactFlowNodes.find((node) => node.id === startConditionEdge.source)
            if (!startConditionNode) continue

            // Ensure all paths are handled
            const conditionData = conditionalEdges[conditionNodeId]
            if (!conditionData.nodes['end'] && Object.keys(conditionData.nodes).length > 0) {
                const endEdge = reactFlowEdges.find(
                    (edge) => edge.source === conditionNodeId && edge.sourceHandle?.includes('end')
                )
                if (endEdge) {
                    const endNode = reactFlowNodes.find((node) => node.id === endEdge.target)
                    if (endNode) {
                        conditionData.nodes['end'] = endNode.data.instance.name
                    }
                }
            }

            seqGraph.addConditionalEdges(
                startConditionNode.data.instance.name,
                conditionData.func,
                //@ts-ignore
                conditionData.nodes
            )
        }
    }

    /*** Add conditional edges to graph for LLMNode -> ToolNode ***/
    for (const llmSourceNodeId in conditionalToolNodes) {
        const connectedToolNodes = conditionalToolNodes[llmSourceNodeId].toolNodes
        const sourceNode = conditionalToolNodes[llmSourceNodeId].source

        const routeMessage = (state: ISeqAgentsState) => {
            const messages = state.messages as unknown as BaseMessage[]
            const lastMessage = messages[messages.length - 1] as AIMessage

            if (!lastMessage.tool_calls?.length) {
                return END
            }

            for (const toolCall of lastMessage.tool_calls) {
                for (const toolNode of connectedToolNodes) {
                    const tools = (toolNode.node?.tools as StructuredTool[]) || ((toolNode as any).tools as StructuredTool[])
                    if (tools.some((tool) => tool.name === toolCall.name)) {
                        return toolNode.name
                    }
                }
            }
            return END
        }

        seqGraph.addConditionalEdges(
            //@ts-ignore
            sourceNode.name,
            routeMessage
        )
    }

    ;(seqGraph as any).signal = options.signal

    /*** Get memory ***/
    const startNode = reactFlowNodes.find((node: IReactFlowNode) => node.data.name === 'seqStart')
    let memory = startNode?.data.instance?.checkpointMemory

    try {
        const graph = seqGraph.compile({
            checkpointer: memory,
            interruptBefore: interruptToolNodeNames as any
        })

        const loggerHandler = new ConsoleCallbackHandler(logger)
        const additionalCbs = await additionalCallbacks(flowNodeData as any, options)
        const config: RunnableConfig & { 
            configurable: { thread_id: string | undefined }; 
            bindModel: Record<string, any>;
            callbacks: (BaseCallbackHandler | ConsoleCallbackHandler)[];
        } = { 
            configurable: { thread_id: threadId }, 
            bindModel,
            callbacks: [loggerHandler, ...additionalCbs]
        }

        let prependMessages = []
        // Only append in the first message
        if (prependHistoryMessages.length === chatHistory.length) {
            for (const message of prependHistoryMessages) {
                if (message.role === 'apiMessage' || message.type === 'apiMessage') {
                    prependMessages.push(
                        new AIMessage({
                            content: message.message || message.content || ''
                        })
                    )
                } else if (message.role === 'userMessage' || message.type === 'userMessage') {
                    prependMessages.push(
                        new HumanMessage({
                            content: message.message || message.content || ''
                        })
                    )
                }
            }
        }

        const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${question}` : question
        let humanMsg: { messages: HumanMessage[] | ToolMessage[] } | null = {
            messages: [...prependMessages, new HumanMessage({ content: finalQuestion })]
        }

        if (action && action.mapping && question === action.mapping.approve) {
            humanMsg = null
        } else if (action && action.mapping && question === action.mapping.reject) {
            humanMsg = {
                messages: action.mapping.toolCalls.map((toolCall) => {
                    return new ToolMessage({
                        name: toolCall.name,
                        content: `Tool ${toolCall.name} call denied by user. Acknowledge that, and DONT perform further actions. Only ask if user have other questions`,
                        tool_call_id: toolCall.id!,
                        additional_kwargs: { toolCallsDenied: true }
                    })
                })
            }
        }

        const shouldStreamResponse = options.shouldStreamResponse
        const sseStreamer = options.sseStreamer
        const chatId = options.chatId

        if (shouldStreamResponse && sseStreamer) {
            sseStreamer.streamStartEvent(chatId, [])
            
            // Add streaming callbacks
            const streamingHandler = BaseCallbackHandler.fromMethods({
                handleLLMNewToken(token: string) {
                    sseStreamer.streamTokenEvent(chatId, token)
                },
                handleToolStart(tool: Serialized, input: string) {
                    sseStreamer.streamToolEvent(chatId, { tool: tool.toString(), status: 'start', input })
                },
                handleToolEnd(output: string) {
                    sseStreamer.streamToolEvent(chatId, { output, status: 'end' })
                }
            })

            config.callbacks.push(streamingHandler)
        }

        const streamResults = await graph.stream(humanMsg, config)

        return streamResults

    } catch (e) {
        logger.error('Error compile graph', e)
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error compile graph - ${getErrorMessage(e)}`)
    }
}

const getSortedDepthNodes = (depthQueue: IDepthQueue) => {
    // Step 1: Convert the object into an array of [key, value] pairs and sort them by the value
    const sortedEntries = Object.entries(depthQueue).sort((a, b) => a[1] - b[1])

    // Step 2: Group keys by their depth values
    const groupedByDepth: Record<number, string[]> = {}
    sortedEntries.forEach(([key, value]) => {
        if (!groupedByDepth[value]) {
            groupedByDepth[value] = []
        }
        groupedByDepth[value].push(key)
    })

    // Step 3: Create the final sorted array with grouped keys
    const sortedArray: (string | string[])[] = []
    Object.keys(groupedByDepth)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach((depth) => {
            const items = groupedByDepth[parseInt(depth)]
            sortedArray.push(...items)
        })

    return sortedArray.flat()
}