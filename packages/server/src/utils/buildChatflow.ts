import { Request } from 'express'
import * as path from 'path'
import { DataSource } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { omit } from 'lodash'
import {
    IFileUpload,
    convertSpeechToText,
    ICommonObject,
    addSingleFileToStorage,
    generateFollowUpPrompts,
    IAction,
    addArrayFilesToStorage,
    mapMimeTypeToInputField,
    mapExtToInputField,
    getFileFromUpload,
    removeSpecificFileFromUpload
} from 'flowise-components'
import { StatusCodes } from 'http-status-codes'
import {
    IncomingInput,
    IMessage,
    INodeData,
    IReactFlowObject,
    IReactFlowNode,
    IDepthQueue,
    ChatType,
    IChatMessage,
    IExecuteFlowParams,
    IFlowConfig,
    IComponentNodes,
    IVariable,
    INodeOverrides,
    IVariableOverride,
    MODE
} from '../Interface'
import { InternalFlowiseError } from '../errors/internalFlowiseError'
import { databaseEntities } from '.'
import { ChatFlow } from '../database/entities/ChatFlow'
import { ChatMessage } from '../database/entities/ChatMessage'
import { Variable } from '../database/entities/Variable'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import {
    isFlowValidForStream,
    buildFlow,
    getTelemetryFlowObj,
    getAppVersion,
    resolveVariables,
    getSessionChatHistory,
    findMemoryNode,
    replaceInputsWithConfig,
    getStartingNodes,
    getMemorySessionId,
    getEndingNodes,
    constructGraphs,
    getAPIOverrideConfig
} from '../utils'
import { validateChatflowAPIKey } from './validateKey'
import logger from './logger'
import { utilAddChatMessage } from './addChatMesage'
import { buildAgentGraph } from './buildAgentGraph'
import { getErrorMessage } from '../errors/utils'
import { FLOWISE_METRIC_COUNTERS, FLOWISE_COUNTER_STATUS, IMetricsProvider } from '../Interface.Metrics'
import { OMIT_QUEUE_JOB_DATA } from './constants'
import { supabase } from '../utils/supabase'

/*
 * Initialize the ending node to be executed
 */
const initEndingNode = async ({
    endingNodeIds,
    componentNodes,
    reactFlowNodes,
    incomingInput,
    flowConfig,
    uploadedFilesContent,
    availableVariables,
    apiOverrideStatus,
    nodeOverrides,
    variableOverrides
}: {
    endingNodeIds: string[]
    componentNodes: IComponentNodes
    reactFlowNodes: IReactFlowNode[]
    incomingInput: IncomingInput
    flowConfig: IFlowConfig
    uploadedFilesContent: string
    availableVariables: IVariable[]
    apiOverrideStatus: boolean
    nodeOverrides: INodeOverrides
    variableOverrides: IVariableOverride[]
}): Promise<{ endingNodeData: INodeData; endingNodeInstance: any }> => {
    const question = incomingInput.question
    const chatHistory = flowConfig.chatHistory
    const sessionId = flowConfig.sessionId

    const nodeToExecute =
        endingNodeIds.length === 1
            ? reactFlowNodes.find((node: IReactFlowNode) => endingNodeIds[0] === node.id)
            : reactFlowNodes[reactFlowNodes.length - 1]

    if (!nodeToExecute) {
        throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Node not found`)
    }

    if (incomingInput.overrideConfig && apiOverrideStatus) {
        nodeToExecute.data = replaceInputsWithConfig(nodeToExecute.data, incomingInput.overrideConfig, nodeOverrides, variableOverrides)
    }

    const reactFlowNodeData: INodeData = await resolveVariables(
        nodeToExecute.data,
        reactFlowNodes,
        question,
        chatHistory,
        flowConfig,
        uploadedFilesContent,
        availableVariables,
        variableOverrides
    )

    logger.debug(`[server]: Running ${reactFlowNodeData.label} (${reactFlowNodeData.id})`)

    const nodeInstanceFilePath = componentNodes[reactFlowNodeData.name].filePath as string
    const nodeModule = await import(nodeInstanceFilePath)
    const nodeInstance = new nodeModule.nodeClass({ sessionId })

    return { endingNodeData: reactFlowNodeData, endingNodeInstance: nodeInstance }
}

/*
 * Get chat history from memory node
 * This is used to fill in the {{chat_history}} variable if it is used in the Format Prompt Value
 */
const getChatHistory = async ({
    endingNodes,
    nodes,
    chatflowid,
    appDataSource,
    componentNodes,
    incomingInput,
    chatId,
    isInternal,
    isAgentFlow
}: {
    endingNodes: IReactFlowNode[]
    nodes: IReactFlowNode[]
    chatflowid: string
    appDataSource: DataSource
    componentNodes: IComponentNodes
    incomingInput: IncomingInput
    chatId: string
    isInternal: boolean
    isAgentFlow: boolean
}): Promise<IMessage[]> => {
    const prependMessages = incomingInput.history ?? []
    let chatHistory: IMessage[] = []

    if (isAgentFlow) {
        const startNode = nodes.find((node) => node.data.name === 'seqStart')
        if (!startNode?.data?.inputs?.memory) return []

        const memoryNodeId = startNode.data.inputs.memory.split('.')[0].replace('{{', '')
        const memoryNode = nodes.find((node) => node.data.id === memoryNodeId)

        if (memoryNode) {
            chatHistory = await getSessionChatHistory(
                chatflowid,
                getMemorySessionId(memoryNode, incomingInput, chatId, isInternal),
                memoryNode,
                componentNodes,
                appDataSource,
                databaseEntities,
                logger,
                prependMessages
            )
        }
        return chatHistory
    }

    /* In case there are multiple ending nodes, get the memory from the last available ending node
     * By right, in each flow, there should only be one memory node
     */
    for (const endingNode of endingNodes) {
        const endingNodeData = endingNode.data
        if (!endingNodeData.inputs?.memory) continue

        const memoryNodeId = endingNodeData.inputs?.memory.split('.')[0].replace('{{', '')
        const memoryNode = nodes.find((node) => node.data.id === memoryNodeId)

        if (!memoryNode) continue

        chatHistory = await getSessionChatHistory(
            chatflowid,
            getMemorySessionId(memoryNode, incomingInput, chatId, isInternal),
            memoryNode,
            componentNodes,
            appDataSource,
            databaseEntities,
            logger,
            prependMessages
        )
    }

    return chatHistory
}

/**
 * Show output of setVariable nodes
 * @param reactFlowNodes
 * @returns {Record<string, unknown>}
 */
const getSetVariableNodesOutput = (reactFlowNodes: IReactFlowNode[]) => {
    const flowVariables = {} as Record<string, unknown>
    for (const node of reactFlowNodes) {
        if (node.data.name === 'setVariable' && (node.data.inputs?.showOutput === true || node.data.inputs?.showOutput === 'true')) {
            const outputResult = node.data.instance
            const variableKey = node.data.inputs?.variableName
            flowVariables[variableKey] = outputResult
        }
    }
    return flowVariables
}

/*
 * Function to traverse the flow graph and execute the nodes
 */
export const executeFlow = async ({
    componentNodes,
    incomingInput,
    chatflow,
    chatId,
    appDataSource,
    telemetry,
    cachePool,
    sseStreamer,
    baseURL,
    isInternal,
    files,
    signal
}: IExecuteFlowParams) => {
    console.log('========= Start of executeFlow =========')
    const question = incomingInput.question
    const overrideConfig = incomingInput.overrideConfig ?? {}
    const uploads = incomingInput.uploads
    const prependMessages = incomingInput.history ?? []
    const streaming = incomingInput.streaming
    const userMessageDateTime = new Date()
    const chatflowid = chatflow.id
    const appId = incomingInput.appId
    const orgId = incomingInput.orgId
    const userId = incomingInput.userId

    console.log('executeFlow appId: ', appId)
    console.log('executeFlow orgId: ', orgId)
    console.log('executeFlow userId: ', userId)
    /* Process file uploads from the chat
     * - Images
     * - Files
     * - Audio
     */

    //REMODL TODO: WILL NEED TO CONFIRM FILE HANDLING
    let fileUploads: IFileUpload[] = []
    let uploadedFilesContent = ''
    if (incomingInput.uploads) {
        fileUploads = incomingInput.uploads
        for (let i = 0; i < fileUploads.length; i += 1) {
            const upload = fileUploads[i]

            // if upload in an image, a rag file, or audio
            if ((upload.type === 'file' || upload.type === 'file:rag' || upload.type === 'audio') && upload.data) {
                const filename = upload.name
                const splitDataURI = upload.data.split(',')
                const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
                const mime = splitDataURI[0].split(':')[1].split(';')[0]
                await addSingleFileToStorage(mime, bf, filename, chatflowid, chatId)
                upload.type = 'stored-file'
                // Omit upload.data since we don't store the content in database
                fileUploads[i] = omit(upload, ['data'])
            }

            if (upload.type === 'url' && upload.data) {
                const filename = upload.name
                const urlData = upload.data
                fileUploads[i] = { data: urlData, name: filename, type: 'url', mime: upload.mime ?? 'image/png' }
            }

            // Run Speech to Text conversion
            if (upload.mime === 'audio/webm' || upload.mime === 'audio/mp4' || upload.mime === 'audio/ogg') {
                logger.debug(`Attempting a speech to text conversion...`)
                let speechToTextConfig: ICommonObject = {}
                if (chatflow.speechToText) {
                    const speechToTextProviders = JSON.parse(chatflow.speechToText)
                    for (const provider in speechToTextProviders) {
                        const providerObj = speechToTextProviders[provider]
                        if (providerObj.status) {
                            speechToTextConfig = providerObj
                            speechToTextConfig['name'] = provider
                            break
                        }
                    }
                }
                if (speechToTextConfig) {
                    const options: ICommonObject = {
                        chatId,
                        chatflowid,
                        appDataSource,
                        databaseEntities: databaseEntities
                    }
                    const speechToTextResult = await convertSpeechToText(upload, speechToTextConfig, options)
                    logger.debug(`Speech to text result: ${speechToTextResult}`)
                    if (speechToTextResult) {
                        incomingInput.question = speechToTextResult
                    }
                }
            }

            if (upload.type === 'file:full' && upload.data) {
                upload.type = 'stored-file:full'
                // Omit upload.data since we don't store the content in database
                uploadedFilesContent += `<doc name='${upload.name}'>${upload.data}</doc>\n\n`
                fileUploads[i] = omit(upload, ['data'])
            }
        }
    }

    // Process form data body with files
    if (files?.length) {
        const overrideConfig: ICommonObject = { ...incomingInput }
        for (const file of files) {
            const fileNames: string[] = []
            const fileBuffer = await getFileFromUpload(file.path ?? file.key)
            // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
            const storagePath = await addArrayFilesToStorage(file.mimetype, fileBuffer, file.originalname, fileNames, chatflowid)

            const fileInputFieldFromMimeType = mapMimeTypeToInputField(file.mimetype)

            const fileExtension = path.extname(file.originalname)

            const fileInputFieldFromExt = mapExtToInputField(fileExtension)

            let fileInputField = 'txtFile'

            if (fileInputFieldFromExt !== 'txtFile') {
                fileInputField = fileInputFieldFromExt
            } else if (fileInputFieldFromMimeType !== 'txtFile') {
                fileInputField = fileInputFieldFromExt
            }

            if (overrideConfig[fileInputField]) {
                const existingFileInputField = overrideConfig[fileInputField].replace('FILE-STORAGE::', '')
                const existingFileInputFieldArray = JSON.parse(existingFileInputField)

                const newFileInputField = storagePath.replace('FILE-STORAGE::', '')
                const newFileInputFieldArray = JSON.parse(newFileInputField)

                const updatedFieldArray = existingFileInputFieldArray.concat(newFileInputFieldArray)

                overrideConfig[fileInputField] = `FILE-STORAGE::${JSON.stringify(updatedFieldArray)}`
            } else {
                overrideConfig[fileInputField] = storagePath
            }

            await removeSpecificFileFromUpload(file.path ?? file.key)
        }
        if (overrideConfig.vars && typeof overrideConfig.vars === 'string') {
            overrideConfig.vars = JSON.parse(overrideConfig.vars)
        }
        incomingInput = {
            ...incomingInput,
            overrideConfig,
            chatId
        }
    }

    /*** Get chatflows and prepare data  ***/
    const flowData = chatflow.flowData
    const parsedFlowData: IReactFlowObject = JSON.parse(flowData)
    console.log('========= Start of executeFlow parsedFlowData =========')
    console.log(parsedFlowData)
    console.log('========= End of executeFlow parsedFlowData =========')
    const nodes = parsedFlowData.nodes
    const edges = parsedFlowData.edges
    console.log('========= Start of executeFlow nodes =========')
    const apiMessageId = uuidv4()

    /*** Get session ID ***/
    const memoryNode = findMemoryNode(nodes, edges)
    const memoryType = memoryNode?.data.label || ''
    let sessionId = getMemorySessionId(memoryNode, incomingInput, chatId, isInternal)

    /*** Get Ending Node with Directed Graph  ***/
    const { graph, nodeDependencies } = constructGraphs(nodes, edges)
    const directedGraph = graph
    const endingNodes = getEndingNodes(nodeDependencies, directedGraph, nodes)

    /*** Get Starting Nodes with Reversed Graph ***/
    const constructedObj = constructGraphs(nodes, edges, { isReversed: true })
    const nonDirectedGraph = constructedObj.graph
    let startingNodeIds: string[] = []
    let depthQueue: IDepthQueue = {}
    const endingNodeIds = endingNodes.map((n) => n.id)
    for (const endingNodeId of endingNodeIds) {
        const resx = getStartingNodes(nonDirectedGraph, endingNodeId)
        startingNodeIds.push(...resx.startingNodeIds)
        depthQueue = Object.assign(depthQueue, resx.depthQueue)
    }
    startingNodeIds = [...new Set(startingNodeIds)]

    const isAgentFlow =
        endingNodes.filter((node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents').length > 0

    /*** Get Chat History ***/
    const chatHistory = await getChatHistory({
        endingNodes,
        nodes,
        chatflowid,
        appDataSource,
        componentNodes,
        incomingInput,
        chatId,
        isInternal,
        isAgentFlow
    })

    /*** Get API Config ***/
    const availableVariables = await appDataSource.getRepository(Variable).find()
    const { nodeOverrides, variableOverrides, apiOverrideStatus } = getAPIOverrideConfig(chatflow)

    const flowConfig: IFlowConfig = {
        chatflowid,
        chatId,
        sessionId,
        chatHistory,
        apiMessageId,
        appId: appId || '',
        orgId: orgId || '',
        userId: userId || '',
        ...incomingInput.overrideConfig
    }
    console.log('========= executeFlow flowConfig =========')
   
    logger.debug(`[server]: Start building flow ${chatflowid}`)
    logger.debug(`[server]: flowConfig: ${JSON.stringify(flowConfig)}`)
    console.log('========= End of executeFlow flowConfig =========')
    logger.debug(`[server]: Start building flow ${chatflowid}`)

    /*** BFS to traverse from Starting Nodes to Ending Node ***/
    const reactFlowNodes = await buildFlow({
        startingNodeIds,
        reactFlowNodes: nodes,
        reactFlowEdges: edges,
        apiMessageId,
        graph,
        depthQueue,
        componentNodes,
        question,
        uploadedFilesContent,
        chatHistory,
        chatId,
        sessionId,
        chatflowid,
        appDataSource,
        overrideConfig,
        apiOverrideStatus,
        nodeOverrides,
        availableVariables,
        variableOverrides,
        cachePool,
        isUpsert: false,
        uploads,
        baseURL,
        appId: incomingInput.appId || '',
        orgId: incomingInput.orgId || '',
        userId: incomingInput.userId || ''
    })
    logger.info('========= start of executeFlow reactFlowNodes =========')
    logger.info('current appId', appId || 'no appId')
    logger.info(reactFlowNodes)
    logger.info('========= end of executeFlow reactFlowNodes =========')
    const setVariableNodesOutput = getSetVariableNodesOutput(reactFlowNodes)

    if (isAgentFlow) {
        const agentflow = chatflow
        const streamResults = await buildAgentGraph({
            agentflow,
            flowConfig,
            incomingInput,
            nodes,
            edges,
            initializedNodes: reactFlowNodes,
            endingNodeIds,
            startingNodeIds,
            depthQueue,
            chatHistory,
            uploadedFilesContent,
            appDataSource,
            componentNodes,
            sseStreamer,
            shouldStreamResponse: true, // agentflow is always streamed
            cachePool,
            baseURL,
            signal
        })

        if (streamResults) {
            const { finalResult, finalAction, sourceDocuments, artifacts, usedTools, agentReasoning } = streamResults
            const userMessage: Omit<IChatMessage, 'id'> = {
                role: 'userMessage',
                content: incomingInput.question,
                chatflowid: agentflow.id,
                chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
                chatId,
                memoryType,
                sessionId,
                createdDate: userMessageDateTime,
                fileUploads: incomingInput.uploads ? JSON.stringify(fileUploads) : undefined,
                leadEmail: incomingInput.leadEmail
            }
            await utilAddChatMessage(userMessage, appDataSource)

            const apiMessage: Omit<IChatMessage, 'createdDate'> = {
                id: apiMessageId,
                role: 'apiMessage',
                content: finalResult,
                chatflowid: agentflow.id,
                chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
                chatId,
                memoryType,
                sessionId
            }

            if (sourceDocuments?.length) apiMessage.sourceDocuments = JSON.stringify(sourceDocuments)
            if (artifacts?.length) apiMessage.artifacts = JSON.stringify(artifacts)
            if (usedTools?.length) apiMessage.usedTools = JSON.stringify(usedTools)
            if (agentReasoning?.length) apiMessage.agentReasoning = JSON.stringify(agentReasoning)
            if (finalAction && Object.keys(finalAction).length) apiMessage.action = JSON.stringify(finalAction)

            if (agentflow.followUpPrompts) {
                const followUpPromptsConfig = JSON.parse(agentflow.followUpPrompts)
                const generatedFollowUpPrompts = await generateFollowUpPrompts(followUpPromptsConfig, apiMessage.content, {
                    chatId,
                    chatflowid: agentflow.id,
                    appDataSource,
                    databaseEntities
                })
                if (generatedFollowUpPrompts?.questions) {
                    apiMessage.followUpPrompts = JSON.stringify(generatedFollowUpPrompts.questions)
                }
            }
            const chatMessage = await utilAddChatMessage(apiMessage, appDataSource)

            await telemetry.sendTelemetry('agentflow_prediction_sent', {
                version: await getAppVersion(),
                agentflowId: agentflow.id,
                chatId,
                type: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
                flowGraph: getTelemetryFlowObj(nodes, edges)
            })

            // Find the previous chat message with the same action id and remove the action
            if (incomingInput.action && Object.keys(incomingInput.action).length) {
                let query = await appDataSource
                    .getRepository(ChatMessage)
                    .createQueryBuilder('chat_message')
                    .where('chat_message.chatId = :chatId', { chatId })
                    .orWhere('chat_message.sessionId = :sessionId', { sessionId })
                    .orderBy('chat_message.createdDate', 'DESC')
                    .getMany()

                for (const result of query) {
                    if (result.action) {
                        try {
                            const action: IAction = JSON.parse(result.action)
                            if (action.id === incomingInput.action.id) {
                                const newChatMessage = new ChatMessage()
                                Object.assign(newChatMessage, result)
                                newChatMessage.action = null
                                const cm = await appDataSource.getRepository(ChatMessage).create(newChatMessage)
                                await appDataSource.getRepository(ChatMessage).save(cm)
                                break
                            }
                        } catch (e) {
                            // error converting action to JSON
                        }
                    }
                }
            }

            // Prepare response
            let result: ICommonObject = {}
            result.text = finalResult
            result.question = incomingInput.question
            result.chatId = chatId
            result.chatMessageId = chatMessage?.id
            if (sessionId) result.sessionId = sessionId
            if (memoryType) result.memoryType = memoryType
            if (agentReasoning?.length) result.agentReasoning = agentReasoning
            if (finalAction && Object.keys(finalAction).length) result.action = finalAction
            if (Object.keys(setVariableNodesOutput).length) result.flowVariables = setVariableNodesOutput
            result.followUpPrompts = JSON.stringify(apiMessage.followUpPrompts)

            return result
        }
        return undefined
    } else {
        const isStreamValid = await checkIfStreamValid(endingNodes, nodes, streaming)

        /*** Find the last node to execute ***/
        const { endingNodeData, endingNodeInstance } = await initEndingNode({
            endingNodeIds,
            componentNodes,
            reactFlowNodes,
            incomingInput,
            flowConfig,
            uploadedFilesContent,
            availableVariables,
            apiOverrideStatus,
            nodeOverrides,
            variableOverrides
        })

        /*** If user uploaded files from chat, prepend the content of the files ***/
        const finalQuestion = uploadedFilesContent ? `${uploadedFilesContent}\n\n${incomingInput.question}` : incomingInput.question

        /*** Prepare run params ***/
        const runParams = {
            chatId,
            chatflowid,
            apiMessageId,
            logger,
            appDataSource,
            databaseEntities,
            analytic: chatflow.analytic,
            uploads,
            prependMessages,
            ...(isStreamValid && { sseStreamer, shouldStreamResponse: isStreamValid })
        }

        /*** Run the ending node ***/
        let result = await endingNodeInstance.run(endingNodeData, finalQuestion, runParams)

        result = typeof result === 'string' ? { text: result } : result

        /*** Retrieve threadId from OpenAI Assistant if exists ***/
        if (typeof result === 'object' && result.assistant) {
            sessionId = result.assistant.threadId
        }

        const userMessage: Omit<IChatMessage, 'id'> = {
            role: 'userMessage',
            content: question,
            chatflowid,
            chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
            chatId,
            memoryType,
            sessionId,
            createdDate: userMessageDateTime,
            fileUploads: uploads ? JSON.stringify(fileUploads) : undefined,
            leadEmail: incomingInput.leadEmail
        }
        await utilAddChatMessage(userMessage, appDataSource)

        let resultText = ''
        if (result.text) resultText = result.text
        else if (result.json) resultText = '```json\n' + JSON.stringify(result.json, null, 2)
        else resultText = JSON.stringify(result, null, 2)

        const apiMessage: Omit<IChatMessage, 'createdDate'> = {
            id: apiMessageId,
            role: 'apiMessage',
            content: resultText,
            chatflowid,
            chatType: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
            chatId,
            memoryType,
            sessionId
        }
        if (result?.sourceDocuments) apiMessage.sourceDocuments = JSON.stringify(result.sourceDocuments)
        if (result?.usedTools) apiMessage.usedTools = JSON.stringify(result.usedTools)
        if (result?.fileAnnotations) apiMessage.fileAnnotations = JSON.stringify(result.fileAnnotations)
        if (result?.artifacts) apiMessage.artifacts = JSON.stringify(result.artifacts)
        if (chatflow.followUpPrompts) {
            const followUpPromptsConfig = JSON.parse(chatflow.followUpPrompts)
            const followUpPrompts = await generateFollowUpPrompts(followUpPromptsConfig, apiMessage.content, {
                chatId,
                chatflowid,
                appDataSource,
                databaseEntities
            })
            if (followUpPrompts?.questions) {
                apiMessage.followUpPrompts = JSON.stringify(followUpPrompts.questions)
            }
        }

        const chatMessage = await utilAddChatMessage(apiMessage, appDataSource)

        logger.info(`[server]: Finished running ${endingNodeData.label} (${endingNodeData.id})`)

        await telemetry.sendTelemetry('prediction_sent', {
            version: await getAppVersion(),
            chatflowId: chatflowid,
            chatId,
            type: isInternal ? ChatType.INTERNAL : ChatType.EXTERNAL,
            flowGraph: getTelemetryFlowObj(nodes, edges)
        })

        /*** Prepare response ***/
        result.question = incomingInput.question // return the question in the response, this is used when input text is empty but question is in audio format
        result.chatId = chatId
        result.chatMessageId = chatMessage?.id
        result.followUpPrompts = JSON.stringify(apiMessage.followUpPrompts)
        result.isStreamValid = isStreamValid

        if (sessionId) result.sessionId = sessionId
        if (memoryType) result.memoryType = memoryType
        if (Object.keys(setVariableNodesOutput).length) result.flowVariables = setVariableNodesOutput

        return result
    }
}

/**
 * Function to check if the flow is valid for streaming
 * @param {IReactFlowNode[]} endingNodes
 * @param {IReactFlowNode[]} nodes
 * @param {boolean | string} streaming
 * @returns {boolean}
 */
const checkIfStreamValid = async (
    endingNodes: IReactFlowNode[],
    nodes: IReactFlowNode[],
    streaming: boolean | string | undefined
): Promise<boolean> => {
    // Once custom function ending node exists, flow is always unavailable to stream
    const isCustomFunctionEndingNode = endingNodes.some((node) => node.data?.outputs?.output === 'EndingNode')
    if (isCustomFunctionEndingNode) return false

    let isStreamValid = false
    for (const endingNode of endingNodes) {
        const endingNodeData = endingNode.data

        const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode'

        // Once custom function ending node exists, no need to do follow-up checks.
        if (isEndingNode) continue

        if (
            endingNodeData.outputs &&
            Object.keys(endingNodeData.outputs).length &&
            !Object.values(endingNodeData.outputs ?? {}).includes(endingNodeData.name)
        ) {
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Output of ${endingNodeData.label} (${endingNodeData.id}) must be ${endingNodeData.label}, can't be an Output Prediction`
            )
        }

        isStreamValid = isFlowValidForStream(nodes, endingNodeData)
    }

    isStreamValid = (streaming === 'true' || streaming === true) && isStreamValid

    return isStreamValid
}

/**
 * Build/Data Preperation for execute function
 * @param {Request} req
 * @param {boolean} isInternal
 */
export const utilBuildChatflow = async (req: Request, isInternal: boolean = false): Promise<any> => {
    logger.info('========= LINE 774: Start of utilBuildChatflow (from packages/server/src/utils/buildChatflow.ts) =========')
    const appServer = getRunningExpressApp()

    //log the request body
    logger.info(`'current req.body', ${JSON.stringify(req.body)}`)
    //logger.info(`'current req.headers', ${JSON.stringify(req.headers)}`)


    //We expect that appId, orgId, and userId are present in the request body. If not, we will log an error and throw an error

    //REMODL: We initialize the variables to empty strings
    let appId: string = ''
    let orgId: string = ''
    let userId: string = ''

    //check to make sure appId is present, and if so log it, and set it to appId variable
    if (req.body.appId) {
        appId = req.body.appId
        logger.info(`confirmed appId is present at start of utilBuildChatflow: ${appId}`)
    } else {
        logger.info('appId is not present at start of utilBuildChatflow')
    }

    //check to make sure orgId is present, and if so log it, and set it to orgId variable
    if (req.body.orgId) {
        orgId = req.body.orgId
        logger.info(`confirmed orgId is present at start of utilBuildChatflow: ${orgId}`)
    } else {
        logger.info('orgId is not present at start of utilBuildChatflow')
    }

    //check to make sure userId is present, and if so log it, and set it to userId variable
    if (req.body.userId) {
        userId = req.body.userId
        logger.info(`confirmed userId is present at start of utilBuildChatflow: ${userId}`)
    } else {
        logger.info('userId is not present at start of utilBuildChatflow')
    }

    logger.info(`'========= End of utilBuildChatflow check for appId, orgId, and userId (from packages/server/src/utils/buildChatflow.ts LINE 813) ========='`)


    //REMODL: This is where we get the chatflow id from the request params
    const chatflowid = req.params.id
    logger.info(`'========= LINE 820: chatflowid', ${chatflowid} =========`)
    logger.info(`'chatflowid', ${chatflowid}`)
    logger.info(`'========= End of LINE 820: chatflowid', ${chatflowid} =========`)

    logger.info(`'========= LINE 823: Start of utilBuildChatflow get chatflow (from packages/server/src/utils/buildChatflow.ts LINE 823) ========='`)
    //Call the main database (sqlite in dev, postgres in prod) to get the chatflow
    const chatflow = await appServer.AppDataSource.getRepository(ChatFlow).findOneBy({
        id: chatflowid
    })
    logger.info(`'chatflow', ${JSON.stringify(chatflow)}`)
    logger.info(`'========= End of LINE 823: utilBuildChatflow get chatflow (from packages/server/src/utils/buildChatflow.ts LINE 823) ========='`)
    //REMODL: If the chatflow is not found, throw an error
    if (!chatflow) {
        throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Chatflow ${chatflowid} not found`)
    }
    if (appId.length > 0) {
        logger.debug('appId is present at start of utilBuildChatflow', appId)
        
    }
    // If appId is provided and not 'global', verify that the chatflow belongs to the application
    if (appId && appId !== 'global') {
        try {
            
            logger.debug('========= Start of utilBuildChatflow get flow check for application id (from packages/server/src/utils/buildChatflow.ts LINE 835) =========')
            // Query Supabase to check if the chatflow belongs to the application
            const { data, error } = await supabase
                .from('application_chatflows')
                .select('*')
                .eq('application_id', appId)
                .eq('chatflow_id', chatflowid)
                .maybeSingle()

            if (data) {
                logger.info(`'========= LINE 851: data', ${data} =========`)
                logger.info(`'data from supabase', ${JSON.stringify(data)}`)
                logger.info(`'========= End of LINE 851: data', ${data} =========`)
            }


            if (error) {
                logger.error(`Error checking application_chatflows: ${error.message}`)
                throw new InternalFlowiseError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    `Error verifying application access to chatflow`
                )
            }

            // If no matching record is found, the chatflow doesn't belong to the application
            if (!data) {
                throw new InternalFlowiseError(
                    StatusCodes.FORBIDDEN,
                    `Chatflow ${chatflowid} does not belong to application ${appId}`
                )
            }

            logger.debug(`Verified chatflow ${chatflowid} belongs to application ${appId}`)
        } catch (error) {
            if (error instanceof InternalFlowiseError) {
                throw error
            }
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Error verifying application access to chatflow: ${getErrorMessage(error)}`
            )
        }
    }
    //REMODL: If the chatflow is found, we can proceed with the rest of the function. Here we check if the chatflow is an agent flow
    const isAgentFlow = chatflow.type === 'MULTIAGENT'

    logger.info(`'========= LINE 887: isAgentFlow', ${isAgentFlow} =========`)
    logger.info(`'isAgentFlow', ${isAgentFlow}`)
    logger.info(`'========= End of LINE 887: isAgentFlow', ${isAgentFlow} =========`)   


    //REMODL: We get the http protocol and baseURL from the request
    const httpProtocol = req.get('x-forwarded-proto') || req.protocol
    const baseURL = `${httpProtocol}://${req.get('host')}`
    //REMODL: We get the incoming input from the request body
    const incomingInput: IncomingInput = req.body

    //logger.info(`'========= LINE 897: incomingInput', ${incomingInput} =========`)
    //logger.info(`'incomingInput', ${JSON.stringify(incomingInput)}`)
    //logger.info(`'========= End of LINE 897: incomingInput'=========`)
    //REMODL: We get the chatId from the incoming input

    const chatId = incomingInput.chatId ?? incomingInput.overrideConfig?.sessionId ?? uuidv4()
    
    //REMODL: We get the files from the request
    const files = (req.files as Express.Multer.File[]) || []
    //REMODL: We get the abort controller id
    const abortControllerId = `${chatflow.id}_${chatId}`
    

    try {
        // Validate API Key if its external API request
        if (!isInternal) {
            const isKeyValidated = await validateChatflowAPIKey(req, chatflow)
            if (!isKeyValidated) {
                throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
            }
        }
        logger.info(`'========= LINE 905: executeData =========`)
        const executeData: IExecuteFlowParams = {
            //The incoming request body. By this time we have ensured and validated that the appId, orgId and userId are present and valid, present as req.body.appId, req.body.orgId, and req.body.userId
            incomingInput: req.body,
            //REMODL: We need to include our appId, orgId, and userId in the executeData object
            chatflow,
            //REMODL: We get the chatId from the incoming input. This is the chatID or sessionId from the overrideConfig in the incoming input
            chatId,
            //REMODL: We get the appId, orgId, and userId from the incoming input. We have already validated that these are present and valid
           // appId,
           //    orgId,
           // userId,  
            //REMODL: We get the baseURL from the request
            baseURL,
            //REMODL: We get the isInternal flag from the incoming input
            isInternal,
            //REMODL: We get the files from the request
            files,
            //REMODL: We get the appDataSource from the appServer
            appDataSource: appServer.AppDataSource,
            //REMODL: We get the sseStreamer from the appServer
            sseStreamer: appServer.sseStreamer,
            //REMODL: We get the telemetry from the appServer
            telemetry: appServer.telemetry,
            //REMODL: We get the cachePool from the appServer
            cachePool: appServer.cachePool,
            //REMODL: We get the componentNodes from the appServer. THIS MAY BE THE PROBLEM.  Refer to @NodesPool.ts
            componentNodes: appServer.nodesPool.componentNodes
        }

        //We log our executeData object, but avoid circular references
        logger.info(`'========= LINE 947: executeData - logging safe properties =========`)
        // Log only safe properties to avoid circular references
        const safeExecuteData = {
            chatflowId: executeData.chatflow.id,
            chatflowName: executeData.chatflow.name,
            chatId: executeData.chatId,
            appId: incomingInput.appId,
            orgId: incomingInput.orgId,
            userId: incomingInput.userId,
            isInternal: executeData.isInternal,
            hasFiles: executeData.files && executeData.files.length > 0,
            question: executeData.incomingInput.question
        }
        logger.info(`'executeData safe properties', ${JSON.stringify(safeExecuteData)}`)
        logger.info(`'========= End of LINE 947: executeData safe properties =========`)


        //REMODL: We check if the process.env.MODE is QUEUE. If it is, we add the job to the queue. If not, we execute the flow immediately. We use this in production to speed up the response time.
        if (process.env.MODE === MODE.QUEUE) {
            const predictionQueue = appServer.queueManager.getQueue('prediction')
            const job = await predictionQueue.addJob(omit(executeData, OMIT_QUEUE_JOB_DATA))
            logger.debug(`[server]: Job added to queue: ${job.id}`)

            const queueEvents = predictionQueue.getQueueEvents()
            const result = await job.waitUntilFinished(queueEvents)
            appServer.abortControllerPool.remove(abortControllerId)
            if (!result) {
                throw new Error('Job execution failed')
            }

            incrementSuccessMetricCounter(appServer.metricsProvider, isInternal, isAgentFlow)
            return result
        } else {
            // Add abort controller to the pool
            const signal = new AbortController()
            appServer.abortControllerPool.add(abortControllerId, signal)
            executeData.signal = signal
            logger.info('========= Start of utilBuildChatflow executeFlow =========')
            logger.info('current appId', appId || 'no appId')
            logger.info('current executeData safe properties', JSON.stringify(safeExecuteData))
            const result = await executeFlow(executeData)
            logger.info('========= End of utilBuildChatflow executeFlow =========')

            appServer.abortControllerPool.remove(abortControllerId)
            incrementSuccessMetricCounter(appServer.metricsProvider, isInternal, isAgentFlow)
            return result
        }
    } catch (e) {
        logger.error('[server]: Error:', e)
        appServer.abortControllerPool.remove(`${chatflow.id}_${chatId}`)
        incrementFailedMetricCounter(appServer.metricsProvider, isInternal, isAgentFlow)
        if (e instanceof InternalFlowiseError && e.statusCode === StatusCodes.UNAUTHORIZED) {
            throw e
        } else {
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, getErrorMessage(e))
        }
    }
}

/**
 * Increment success metric counter
 * @param {IMetricsProvider} metricsProvider
 * @param {boolean} isInternal
 * @param {boolean} isAgentFlow
 */
const incrementSuccessMetricCounter = (metricsProvider: IMetricsProvider, isInternal: boolean, isAgentFlow: boolean) => {
    if (isAgentFlow) {
        metricsProvider?.incrementCounter(
            isInternal ? FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_EXTERNAL,
            { status: FLOWISE_COUNTER_STATUS.SUCCESS }
        )
    } else {
        metricsProvider?.incrementCounter(
            isInternal ? FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_EXTERNAL,
            { status: FLOWISE_COUNTER_STATUS.SUCCESS }
        )
    }
}

/**
 * Increment failed metric counter
 * @param {IMetricsProvider} metricsProvider
 * @param {boolean} isInternal
 * @param {boolean} isAgentFlow
 */
const incrementFailedMetricCounter = (metricsProvider: IMetricsProvider, isInternal: boolean, isAgentFlow: boolean) => {
    if (isAgentFlow) {
        metricsProvider?.incrementCounter(
            isInternal ? FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.AGENTFLOW_PREDICTION_EXTERNAL,
            { status: FLOWISE_COUNTER_STATUS.FAILURE }
        )
    } else {
        metricsProvider?.incrementCounter(
            isInternal ? FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_INTERNAL : FLOWISE_METRIC_COUNTERS.CHATFLOW_PREDICTION_EXTERNAL,
            { status: FLOWISE_COUNTER_STATUS.FAILURE }
        )
    }
}