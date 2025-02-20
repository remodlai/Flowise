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
    INodeData,
    TokenEventType
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
        let isStreamingStarted = false

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
                    logger.info(`[buildAgentGraph] Starting to process stream results`)
                    for await (const output of streamResults) {
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
                        if (output?.['conditionalEdge']) {
                            logger.info(`[buildAgentGraph] Found conditional edge with next:`, output.next)
                            if (shouldStreamResponse && sseStreamer) {
                                logger.info(`[buildAgentGraph] Sending condition event for:`, output.next)
                                sseStreamer.streamConditionEvent(chatId, output.next || '')
                            }
                        }

                        if (!output?.__end__) {
                            for (const agentName of Object.keys(output)) {
                                if (!mapNameToLabel[agentName]) continue

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

                                if (usedTools && usedTools.length) {
                                    const cleanedTools = usedTools.filter((tool: IUsedTool) => tool)
                                    if (cleanedTools.length) totalUsedTools.push(...cleanedTools)
                                }

                                if (sourceDocuments && sourceDocuments.length) {
                                    const cleanedDocs = sourceDocuments.filter((documents: IDocument) => documents)
                                    if (cleanedDocs.length) totalSourceDocuments.push(...cleanedDocs)
                                }

                                if (artifacts && artifacts.length) {
                                    const cleanedArtifacts = artifacts.filter((artifact: ICommonObject) => artifact)
                                    if (cleanedArtifacts.length) totalArtifacts.push(...cleanedArtifacts)
                                }

                                /*
                                 * Check if the next node is a condition node, if yes, then add the agent reasoning of the condition node
                                 */
                                if (isSequential) {
                                    const inputEdges = edges.filter(
                                        (edg) => edg.target === nodeId && edg.targetHandle.includes(`${nodeId}-input-sequentialNode`)
                                    )

                                    inputEdges.forEach((edge) => {
                                        const parentNode = initializedNodes.find((nd) => nd.id === edge.source)
                                        if (parentNode) {
                                            if (parentNode.data.name.includes('seqCondition')) {
                                                const newMessages = messages.slice(0, -1)
                                                newMessages.push(mapNameToLabel[agentName].label)
                                                const reasoning = {
                                                    agentName: parentNode.data.instance?.label || parentNode.data.type,
                                                    messages: newMessages,
                                                    nodeName: parentNode.data.name,
                                                    nodeId: parentNode.data.id
                                                }
                                                agentReasoning.push(reasoning)
                                            }
                                        }
                                    })
                                }

                                const reasoning = {
                                    agentName: mapNameToLabel[agentName].label,
                                    messages,
                                    next: output[agentName]?.next,
                                    instructions: output[agentName]?.instructions,
                                    usedTools: flatten(usedTools).filter((tool): tool is IUsedTool => Boolean(tool)),
                                    sourceDocuments: flatten(sourceDocuments).filter((doc): doc is Document => Boolean(doc)),
                                    artifacts: flatten(artifacts).filter((artifact): artifact is ICommonObject => Boolean(artifact)),
                                    state,
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

                                if (shouldStreamResponse) {
                                    if (!isStreamingStarted) {
                                        isStreamingStarted = true
                                        if (sseStreamer) {
                                            sseStreamer.streamStartEvent(chatId, '')
                                        }
                                    }

                                    if (sseStreamer) {
                                        // Stream any tools used
                                        if (usedTools && usedTools.length) {
                                            const cleanedTools = usedTools.filter((tool: IUsedTool | null) => tool !== null)
                                            if (cleanedTools.length) {
                                                sseStreamer.streamUsedToolsEvent(chatId, flatten(cleanedTools))
                                            }
                                        }

                                        // Stream any source documents
                                        if (sourceDocuments && sourceDocuments.length) {
                                            const cleanedDocs = sourceDocuments.filter((doc: IDocument | null) => doc !== null)
                                            if (cleanedDocs.length) {
                                                sseStreamer.streamSourceDocumentsEvent(chatId, flatten(cleanedDocs))
                                            }
                                        }

                                        // Stream any artifacts
                                        if (artifacts && artifacts.length) {
                                            const cleanedArtifacts = artifacts.filter((artifact: ICommonObject | null) => artifact !== null)
                                            if (cleanedArtifacts.length) {
                                                sseStreamer.streamArtifactsEvent(chatId, flatten(cleanedArtifacts))
                                            }
                                        }

                                        // Stream the current agent's reasoning
                                        sseStreamer.streamAgentReasoningEvent(chatId, [reasoning])

                                        // Stream agent reasoning end
                                        sseStreamer.streamAgentReasoningEndEvent(chatId)

                                        // Check if this agent is connected to an END node
                                        const isConnectedToEnd = edges.some(edge => 
                                            edge.source === nodeId && 
                                            initializedNodes.find(node => node.id === edge.target)?.data.name === 'seqEnd'
                                        )

                                        // Send agentReasoningStart with proper flag before token streaming
                                        sseStreamer.streamAgentReasoningStartEvent(chatId, isConnectedToEnd ? "startFinalResponseStream" : "")

                                        // Stream token start if we have a message
                                        if (messages.length > 0) {
                                            sseStreamer.streamTokenStartEvent(chatId)
                                            // Set token type based on whether this is the final node
                                            const tokenType = isConnectedToEnd ? 
                                                TokenEventType.FINAL_RESPONSE : 
                                                TokenEventType.AGENT_REASONING
                                            
                                            for (const message of messages) {
                                                sseStreamer.streamTokenEvent(chatId, message, tokenType)
                                            }
                                            sseStreamer.streamTokenEndEvent(chatId)
                                        }

                                        // Send next agent event before any tools/docs/artifacts
                                        if (reasoning.next && reasoning.next !== 'FINISH' && reasoning.next !== 'END') {
                                            const nextLabel = mapNameToLabel[reasoning.next]?.label || reasoning.next
                                            logger.info(`[buildAgentGraph] Streaming next agent event: ${nextLabel}`)
                                            sseStreamer.streamNextAgentEvent(chatId, nextLabel)
                                        }
                                    }
                                }
                            }
                        } else {
                            finalResult = output.__end__.messages.length ? output.__end__.messages.pop()?.content : ''
                            if (Array.isArray(finalResult)) finalResult = output.__end__.instructions
                            if (shouldStreamResponse && sseStreamer) {
                                sseStreamer.streamTokenEvent(chatId, finalResult)
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

                //THIS IS WHERE WE ARE WORKING!!!!!!!!!!
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
                    let isStreamingStarted = false;
                    for await (const output of streamResults) {
                        logger.info(`[buildAgentGraph] Processing sequential output:`, output)

                        // Check for __start__ node with content
                        // if (output?.['__start__']?.messages && !startEventSent) {
                        //     logger.info(`[buildAgentGraph] Found sequential __start__ node with messages:`, output['__start__'].messages)
                        //     if (shouldStreamResponse && sseStreamer) {
                        //         const seqStateNode = initializedNodes.find((node: IReactFlowNode) => node.data.name === 'seqState')
                        //         const startReasoning: IAgentReasoning[] = [{
                        //             agentName: 'Start',
                        //             messages: [incomingInput.question],
                        //             state: seqStateNode?.data?.instance?.node ?? {},
                        //             usedTools: [],
                        //             sourceDocuments: [],
                        //             artifacts: []
                        //         }]
                        //         logger.info(`[buildAgentGraph] Sending sequential start event with data:`, startReasoning)
                        //         sseStreamer.streamStartEvent(chatId, startReasoning)
                        //         startEventSent = true
                        //     }
                        // }
                        if (!output?.__end__) {
                            for (const agentName of Object.keys(output)) {
                                if (!mapNameToLabel[agentName]) continue

                                const nodeId = output[agentName]?.messages
                                    ? output[agentName].messages[output[agentName].messages.length - 1]?.additional_kwargs?.nodeId
                                    : ''

                                // Check if this agent is connected to an END node - do this early to set proper token types
                                const isConnectedToEnd = edges.some(edge => 
                                    edge.source === nodeId && 
                                    initializedNodes.find(node => node.id === edge.target)?.data.name === 'seqEnd'
                                )

                                // Stream agent reasoning start with proper flag if this is the final node
                                if (shouldStreamResponse && sseStreamer) {
                                    sseStreamer.streamAgentReasoningStartEvent(chatId, isConnectedToEnd ? "startFinalResponseStream" : agentReasoning)
                                }

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

                                if (usedTools && usedTools.length) {
                                    const cleanedTools = usedTools.filter((tool: IUsedTool) => tool)
                                    if (cleanedTools.length) totalUsedTools.push(...cleanedTools)
                                }

                                if (sourceDocuments && sourceDocuments.length) {
                                    const cleanedDocs = sourceDocuments.filter((documents: IDocument) => documents)
                                    if (cleanedDocs.length) totalSourceDocuments.push(...cleanedDocs)
                                }

                                if (artifacts && artifacts.length) {
                                    const cleanedArtifacts = artifacts.filter((artifact: ICommonObject) => artifact)
                                    if (cleanedArtifacts.length) totalArtifacts.push(...cleanedArtifacts)
                                }

                                /*
                                 * Check if the next node is a condition node, if yes, then add the agent reasoning of the condition node
                                 */
                                if (isSequential) {
                                    const inputEdges = edges.filter(
                                        (edg) => edg.target === nodeId && edg.targetHandle.includes(`${nodeId}-input-sequentialNode`)
                                    )

                                    inputEdges.forEach((edge) => {
                                        const parentNode = initializedNodes.find((nd) => nd.id === edge.source)
                                        if (parentNode) {
                                            if (parentNode.data.name.includes('seqCondition')) {
                                                const newMessages = messages.slice(0, -1)
                                                newMessages.push(mapNameToLabel[agentName].label)
                                                const reasoning = {
                                                    agentName: parentNode.data.instance?.label || parentNode.data.type,
                                                    messages: newMessages,
                                                    nodeName: parentNode.data.name,
                                                    nodeId: parentNode.data.id
                                                }
                                                agentReasoning.push(reasoning)
                                                if (shouldStreamResponse) {
                                                    sseStreamer.streamAgentReasoningStartEvent(chatId, isConnectedToEnd ? "startFinalResponseStream" : "agentReasoning")
                                                    sseStreamer.streamAgentReasoningEvent(chatId, [reasoning])
                                                    //sseStreamer.streamAgentReasoningEndEvent(chatId)
                                                }
                                                
                                            }
                                        }
                                    })
                                }
                        // Handle streaming tokens
                        if (output?.content && !output?.additional_kwargs?.tool_calls) {
                            if (shouldStreamResponse && sseStreamer) {
                                // Check if this is the final node
                                const isConnectedToEnd = edges.some(edge => {
                                    if (edge.source === nodeId) {
                                        const endNode = initializedNodes.find(node => node.id === edge.target && node.data.name === 'seqEnd');
                                        const nodeBeforeEnd = endNode ? initializedNodes.find(node => node.id === edge.source) : null;
                                        return nodeBeforeEnd !== null;
                                    }
                                    return false;
                                });
                                
                                // First send the agentReasoningStart event
                                sseStreamer.streamAgentReasoningStartEvent(chatId, isConnectedToEnd ? "startFinalResponseStream" : "")
                                
                                // Then start token streaming
                                if (!isStreamingStarted) {
                                    isStreamingStarted = true
                                    sseStreamer.streamTokenStartEvent(chatId)
                                }

                                // Set token type based on whether this is the final node
                                const tokenType = isConnectedToEnd ? 
                                    TokenEventType.FINAL_RESPONSE : 
                                    TokenEventType.AGENT_REASONING

                                sseStreamer.streamTokenEvent(chatId, output.content, tokenType)
                            }
                            continue
                        }

                        // Check for conditional edge
                        if (output?.['conditionalEdge']) {
                            logger.info(`[buildAgentGraph] Found conditional edge with next:`, output.next)
                            if (shouldStreamResponse && sseStreamer) {
                                logger.info(`[buildAgentGraph] Sending condition event for:`, output.next)
                                sseStreamer.streamConditionEvent(chatId, output.next || '')
                            }
                        }

                        

                                const reasoning = {
                                    agentName: mapNameToLabel[agentName].label,
                                    messages,
                                    next: output[agentName]?.next,
                                    instructions: output[agentName]?.instructions,
                                    usedTools: flatten(usedTools).filter((tool): tool is IUsedTool => Boolean(tool)),
                                    sourceDocuments: flatten(sourceDocuments).filter((doc): doc is Document => Boolean(doc)),
                                    artifacts: flatten(artifacts).filter((artifact): artifact is ICommonObject => Boolean(artifact)),
                                    state: lastMessageRaw.additional_kwargs.state ? omit(lastMessageRaw.additional_kwargs.state, ['messages']) : {},  // Ensure state is never undefined
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

                                if (shouldStreamResponse) {
                                    if (!isStreamingStarted) {
                                        isStreamingStarted = true
                                        if (sseStreamer) {
                                            sseStreamer.streamStartEvent(chatId, agentReasoning)
                                        }
                                    }

                                    if (sseStreamer) {
                                        // Stream any tools used
                                        if (usedTools && usedTools.length) {
                                            const cleanedTools = usedTools.filter((tool: IUsedTool | null) => tool !== null)
                                            if (cleanedTools.length) {
                                                sseStreamer.streamUsedToolsEvent(chatId, flatten(cleanedTools))
                                            }
                                        }

                                        // Stream any source documents
                                        if (sourceDocuments && sourceDocuments.length) {
                                            const cleanedDocs = sourceDocuments.filter((doc: IDocument | null) => doc !== null)
                                            if (cleanedDocs.length) {
                                                sseStreamer.streamSourceDocumentsEvent(chatId, flatten(cleanedDocs))
                                            }
                                        }

                                        // Stream any artifacts
                                        if (artifacts && artifacts.length) {
                                            const cleanedArtifacts = artifacts.filter((artifact: ICommonObject | null) => artifact !== null)
                                            if (cleanedArtifacts.length) {
                                                sseStreamer.streamArtifactsEvent(chatId, flatten(cleanedArtifacts))
                                            }
                                        }

                                        // Stream the current agent's reasoning
                                        sseStreamer.streamAgentReasoningEvent(chatId, agentReasoning)

                                        // Stream agent reasoning end
                                        sseStreamer.streamAgentReasoningEndEvent(chatId)

                                        // Check if this agent is connected to an END node
                                        const isConnectedToEnd = edges.some(edge => {
                                            if (edge.source === nodeId) {
                                                const endNode = initializedNodes.find(node => node.id === edge.target && node.data.name === 'seqEnd');
                                                const nodeBeforeEnd = endNode ? initializedNodes.find(node => node.id === edge.source) : null;
                                                return nodeBeforeEnd !== null;
                                            }
                                            return false;
                                        });

                                        // Send agentReasoningStart with proper flag before token streaming
                                        sseStreamer.streamAgentReasoningStartEvent(chatId, isConnectedToEnd ? "startFinalResponseStream" : agentReasoning)

                                        // Stream token start if we have a message
                                        if (messages.length > 0) {
                                            sseStreamer.streamTokenStartEvent(chatId)
                                            // Set token type based on whether this is the final node
                                            const tokenType = isConnectedToEnd ? 
                                                TokenEventType.FINAL_RESPONSE : 
                                                TokenEventType.AGENT_REASONING
                                            
                                            for (const message of messages) {
                                                sseStreamer.streamTokenEvent(chatId, message, tokenType)
                                            }
                                            sseStreamer.streamTokenEndEvent(chatId)
                                        }
                                        
                                        // Send next agent event before any tools/docs/artifacts
                                        if (reasoning.next && reasoning.next !== 'FINISH' && reasoning.next !== 'end') {
                                            const nextLabel = mapNameToLabel[reasoning.next]?.label || reasoning.next
                                            logger.info(`[buildAgentGraph] Streaming next agent event: ${nextLabel}`)
                                            sseStreamer.streamNextAgentEvent(chatId, nextLabel)
                                        }
                                    }
                                }
                            }
                        } else {
                            finalResult = output.__end__.messages.length ? output.__end__.messages.pop()?.content : ''
                            if (Array.isArray(finalResult)) finalResult = output.__end__.instructions
                            if (shouldStreamResponse && sseStreamer) {
                                sseStreamer.streamTokenEvent(chatId, finalResult)
                            }
                        }
                    }

                    if (isStreamingStarted && shouldStreamResponse && sseStreamer) {
                        sseStreamer.streamTokenEndEvent(chatId)
                        sseStreamer.streamCustomEvent(chatId, 'end', {
                            text: finalResult,
                            finalResult,
                            finalAction,
                            sourceDocuments: totalSourceDocuments.length ? uniq(totalSourceDocuments) : [],
                            artifacts: totalArtifacts.length ? uniq(totalArtifacts) : [],
                            usedTools: totalUsedTools.length ? uniq(totalUsedTools) : [],
                            agentReasoning
                        })
                        sseStreamer.streamEndEvent(chatId)
                    }

                    // Get the final text from the last agent's message if not already set
                    if (!finalResult && agentReasoning.length > 0) {
                        const lastAgent = agentReasoning[agentReasoning.length - 1]
                        if (lastAgent.messages && lastAgent.messages.length > 0) {
                            finalResult = lastAgent.messages[lastAgent.messages.length - 1]
                        }
                    }

                    // Only use fallbacks if we still don't have a final result
                    if (!finalResult) {
                        if (lastWorkerResult) finalResult = lastWorkerResult
                        else if (finalSummarization) finalResult = finalSummarization
                    }

                    return {
                        text: finalResult,
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
            const shouldStreamResponse = options.shouldStreamResponse
            const sseStreamer = options.sseStreamer
            const chatId = options.chatId

            const config: RunnableConfig & { 
                configurable: { 
                    thread_id: string | undefined;
                    nodesConnectedToEnd?: string[];
                    shouldStreamResponse?: boolean;
                }; 
                bindModel: Record<string, any>;
                callbacks: (BaseCallbackHandler | ConsoleCallbackHandler)[];
            } = { 
                configurable: { 
                    thread_id: threadId,
                    nodesConnectedToEnd: Array.from(workerNodeIds),
                    shouldStreamResponse
                }, 
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

    // Identify all nodes that connect to end nodes
    const nodesConnectedToEnd = new Set([
        // Direct connections to End nodes
        ...endAgentNodes.map(endNode => 
            reactFlowEdges
                .filter(edge => edge.target === endNode.id)
                .map(edge => edge.source)
        ).flat(),
        
        // Connections through condition node 'end' handles
        ...reactFlowEdges
            .filter(edge => edge.sourceHandle?.includes('end'))
            .map(edge => edge.source)
    ])

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
        const shouldStreamResponse = options.shouldStreamResponse
        const sseStreamer = options.sseStreamer
        const chatId = options.chatId

        const config: RunnableConfig & { 
            configurable: { 
                thread_id: string | undefined;
                nodesConnectedToEnd?: string[];
                shouldStreamResponse?: boolean;
            }; 
            bindModel: Record<string, any>;
            callbacks: (BaseCallbackHandler | ConsoleCallbackHandler)[];
        } = { 
            configurable: { 
                thread_id: threadId,
                nodesConnectedToEnd: Array.from(nodesConnectedToEnd),
                shouldStreamResponse
            }, 
            bindModel,
            callbacks: [loggerHandler, ...additionalCbs]
        }

        if (shouldStreamResponse && sseStreamer) {
            // Create streaming handler with its own state
            const createStreamingHandler = () => {
                let isStreamingStarted = false;
                return BaseCallbackHandler.fromMethods({
                    handleLLMNewToken(token: string) {
                        if (!token.trim()) return;

                        if (!isStreamingStarted) {
                            isStreamingStarted = true
                            sseStreamer.streamStartEvent(chatId, '')
                            sseStreamer.streamTokenStartEvent(chatId)
                        }

                        // Get current node ID from metadata
                        const currentNodeId = config?.configurable?.metadata?.nodeId

                        // Set token type based on whether current node connects to end
                        const tokenType = nodesConnectedToEnd.has(currentNodeId)
                            ? TokenEventType.FINAL_RESPONSE 
                            : TokenEventType.AGENT_REASONING

                        sseStreamer.streamTokenEvent(chatId, token, tokenType)
                    },
                    handleLLMEnd() {
                        if (isStreamingStarted) {
                            sseStreamer.streamTokenEndEvent(chatId)
                        }
                    },
                    handleToolStart(tool: Serialized, input: string) {
                        sseStreamer.streamToolEvent(chatId, { 
                            tool: tool.toString(), 
                            status: 'start', 
                            input,
                            type: TokenEventType.TOOL_RESPONSE 
                        })
                    },
                    handleToolEnd(output: string) {
                        sseStreamer.streamToolEvent(chatId, { 
                            output, 
                            status: 'end',
                            type: TokenEventType.TOOL_RESPONSE 
                        })
                    },
                    handleChainStart() {
                        // Reset streaming state for new chain
                        isStreamingStarted = false
                    },
                    handleChainEnd() {
                        // Ensure token stream is properly ended
                        if (isStreamingStarted) {
                            sseStreamer.streamTokenEndEvent(chatId)
                        }
                    }
                });
            };

            config.callbacks.push(createStreamingHandler())
        }

        const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${question}` : question
        
        // Convert history messages to proper types
        const convertedHistory = prependHistoryMessages.map(msg => {
            if (msg.type === 'apiMessage' || msg.role === 'apiMessage') {
                return new AIMessage({ content: msg.message || msg.content || '' })
            }
            return new HumanMessage({ content: msg.message || msg.content || '' })
        })

        let humanMsg: { messages: HumanMessage[] | ToolMessage[] } | null = {
            messages: [...convertedHistory, new HumanMessage({ content: finalQuestion })]
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