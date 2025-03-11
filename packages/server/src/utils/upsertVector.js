"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertVector = exports.executeUpsert = void 0;
const path = __importStar(require("path"));
const lodash_1 = require("lodash");
const utils_1 = require("../../../components/src/utils");
const storageUtils_1 = require("../../../components/src/storageUtils");
const logger_1 = __importDefault(require("../utils/logger"));
const utils_2 = require("../utils");
const validateKey_1 = require("./validateKey");
const Interface_1 = require("../Interface");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const getRunningExpressApp_1 = require("../utils/getRunningExpressApp");
const UpsertHistory_1 = require("../database/entities/UpsertHistory");
const internalFlowiseError_1 = require("../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
const utils_3 = require("../errors/utils");
const uuid_1 = require("uuid");
const Interface_Metrics_1 = require("../Interface.Metrics");
const Variable_1 = require("../database/entities/Variable");
const constants_1 = require("./constants");
const executeUpsert = async ({ componentNodes, incomingInput, chatflow, chatId, appDataSource, telemetry, cachePool, isInternal, files }) => {
    const question = incomingInput.question;
    const overrideConfig = incomingInput.overrideConfig ?? {};
    let stopNodeId = incomingInput?.stopNodeId ?? '';
    const chatHistory = [];
    const isUpsert = true;
    const chatflowid = chatflow.id;
    const apiMessageId = (0, uuid_1.v4)();
    let appId = '';
    let orgId = '';
    let userId = '';
    if (incomingInput.appId) {
        appId = incomingInput.appId;
    }
    else {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Application ID is required - executeFlow.');
    }
    if (incomingInput.orgId) {
        orgId = incomingInput.orgId;
    }
    else {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Organization ID is required');
    }
    if (incomingInput.userId) {
        userId = incomingInput.userId;
    }
    else {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User ID is required');
    }
    if (files?.length) {
        const overrideConfig = { ...incomingInput };
        for (const file of files) {
            const fileNames = [];
            const fileBuffer = await (0, storageUtils_1.getFileFromUpload)(file.path ?? file.key);
            // Address file name with special characters: https://github.com/expressjs/multer/issues/1104
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const storagePath = await (0, storageUtils_1.addArrayFilesToStorage)(file.mimetype, fileBuffer, file.originalname, fileNames, chatflowid);
            const fileInputFieldFromMimeType = (0, utils_1.mapMimeTypeToInputField)(file.mimetype);
            const fileExtension = path.extname(file.originalname);
            const fileInputFieldFromExt = (0, utils_1.mapExtToInputField)(fileExtension);
            let fileInputField = 'txtFile';
            if (fileInputFieldFromExt !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            else if (fileInputFieldFromMimeType !== 'txtFile') {
                fileInputField = fileInputFieldFromExt;
            }
            if (overrideConfig[fileInputField]) {
                const existingFileInputField = overrideConfig[fileInputField].replace('FILE-STORAGE::', '');
                const existingFileInputFieldArray = JSON.parse(existingFileInputField);
                const newFileInputField = storagePath.replace('FILE-STORAGE::', '');
                const newFileInputFieldArray = JSON.parse(newFileInputField);
                const updatedFieldArray = existingFileInputFieldArray.concat(newFileInputFieldArray);
                overrideConfig[fileInputField] = `FILE-STORAGE::${JSON.stringify(updatedFieldArray)}`;
            }
            else {
                overrideConfig[fileInputField] = storagePath;
            }
            await (0, storageUtils_1.removeSpecificFileFromUpload)(file.path ?? file.key);
        }
        if (overrideConfig.vars && typeof overrideConfig.vars === 'string') {
            overrideConfig.vars = JSON.parse(overrideConfig.vars);
        }
        incomingInput = {
            ...incomingInput,
            question: '',
            overrideConfig,
            stopNodeId,
            chatId
        };
    }
    /*** Get chatflows and prepare data  ***/
    const flowData = chatflow.flowData;
    const parsedFlowData = JSON.parse(flowData);
    const nodes = parsedFlowData.nodes;
    const edges = parsedFlowData.edges;
    /*** Get session ID ***/
    const memoryNode = (0, utils_2.findMemoryNode)(nodes, edges);
    let sessionId = (0, utils_2.getMemorySessionId)(memoryNode, incomingInput, chatId, isInternal);
    /*** Find the 1 final vector store will be upserted  ***/
    const vsNodes = nodes.filter((node) => node.data.category === 'Vector Stores');
    const vsNodesWithFileUpload = vsNodes.filter((node) => node.data.inputs?.fileUpload);
    if (vsNodesWithFileUpload.length > 1) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Multiple vector store nodes with fileUpload enabled');
    }
    else if (vsNodesWithFileUpload.length === 1 && !stopNodeId) {
        stopNodeId = vsNodesWithFileUpload[0].data.id;
    }
    /*** Check if multiple vector store nodes exist, and if stopNodeId is specified ***/
    if (vsNodes.length > 1 && !stopNodeId) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'There are multiple vector nodes, please provide stopNodeId in body request');
    }
    else if (vsNodes.length === 1 && !stopNodeId) {
        stopNodeId = vsNodes[0].data.id;
    }
    else if (!vsNodes.length && !stopNodeId) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, 'No vector node found');
    }
    /*** Get Starting Nodes with Reversed Graph ***/
    const { graph } = (0, utils_2.constructGraphs)(nodes, edges, { isReversed: true });
    const nodeIds = (0, utils_2.getAllConnectedNodes)(graph, stopNodeId);
    const filteredGraph = {};
    for (const key of nodeIds) {
        if (Object.prototype.hasOwnProperty.call(graph, key)) {
            filteredGraph[key] = graph[key];
        }
    }
    const { startingNodeIds, depthQueue } = (0, utils_2.getStartingNodes)(filteredGraph, stopNodeId);
    /*** Get API Config ***/
    const availableVariables = await appDataSource.getRepository(Variable_1.Variable).find();
    const { nodeOverrides, variableOverrides, apiOverrideStatus } = (0, utils_2.getAPIOverrideConfig)(chatflow);
    const upsertedResult = await (0, utils_2.buildFlow)({
        startingNodeIds,
        reactFlowNodes: nodes,
        reactFlowEdges: edges,
        apiMessageId,
        graph: filteredGraph,
        depthQueue,
        componentNodes,
        question,
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
        isUpsert,
        stopNodeId,
        appId,
        orgId,
        userId
    });
    // Save to DB
    if (upsertedResult['flowData'] && upsertedResult['result']) {
        const result = (0, lodash_1.cloneDeep)(upsertedResult);
        result['flowData'] = JSON.stringify(result['flowData']);
        result['result'] = JSON.stringify((0, lodash_1.omit)(result['result'], ['totalKeys', 'addedDocs']));
        result.chatflowid = chatflowid;
        const newUpsertHistory = new UpsertHistory_1.UpsertHistory();
        Object.assign(newUpsertHistory, result);
        const upsertHistory = appDataSource.getRepository(UpsertHistory_1.UpsertHistory).create(newUpsertHistory);
        await appDataSource.getRepository(UpsertHistory_1.UpsertHistory).save(upsertHistory);
    }
    await telemetry.sendTelemetry('vector_upserted', {
        version: await (0, utils_2.getAppVersion)(),
        chatlowId: chatflowid,
        type: isInternal ? Interface_1.ChatType.INTERNAL : Interface_1.ChatType.EXTERNAL,
        flowGraph: (0, utils_2.getTelemetryFlowObj)(nodes, edges),
        stopNodeId
    });
    return upsertedResult['result'] ?? { result: 'Successfully Upserted' };
};
exports.executeUpsert = executeUpsert;
/**
 * Upsert documents
 * @param {Request} req
 * @param {boolean} isInternal
 */
const upsertVector = async (req, isInternal = false) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    try {
        const chatflowid = req.params.id;
        const appId = req.headers['x-application-id'] || req.body.appId;
        const orgId = req.headers['x-organization-id'] || req.body.orgId;
        const userId = req.headers['x-user-id'] || req.body.userId;
        // Check if chatflow exists
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowid
        });
        if (!chatflow) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowid} not found`);
        }
        const httpProtocol = req.get('x-forwarded-proto') || req.protocol;
        const baseURL = `${httpProtocol}://${req.get('host')}`;
        const incomingInput = req.body;
        const chatId = incomingInput.chatId ?? incomingInput.overrideConfig?.sessionId ?? (0, uuid_1.v4)();
        const files = req.files || [];
        if (!isInternal) {
            const isKeyValidated = await (0, validateKey_1.validateChatflowAPIKey)(req, chatflow);
            if (!isKeyValidated) {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Unauthorized`);
            }
        }
        const executeData = {
            componentNodes: appServer.nodesPool.componentNodes,
            incomingInput,
            chatflow,
            chatId,
            appId,
            orgId,
            userId,
            appDataSource: appServer.AppDataSource,
            telemetry: appServer.telemetry,
            cachePool: appServer.cachePool,
            sseStreamer: appServer.sseStreamer,
            baseURL,
            isInternal,
            files,
            isUpsert: true
        };
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            const upsertQueue = appServer.queueManager.getQueue('upsert');
            const job = await upsertQueue.addJob((0, lodash_1.omit)(executeData, constants_1.OMIT_QUEUE_JOB_DATA));
            logger_1.default.debug(`[server]: Job added to queue: ${job.id}`);
            const queueEvents = upsertQueue.getQueueEvents();
            const result = await job.waitUntilFinished(queueEvents);
            if (!result) {
                throw new Error('Job execution failed');
            }
            appServer.metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
                status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS
            });
            return result;
        }
        else {
            const result = await (0, exports.executeUpsert)(executeData);
            appServer.metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, {
                status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS
            });
            return result;
        }
    }
    catch (e) {
        logger_1.default.error('[server]: Error:', e);
        appServer.metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.VECTORSTORE_UPSERT, { status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.FAILURE });
        if (e instanceof internalFlowiseError_1.InternalFlowiseError && e.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
            throw e;
        }
        else {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, (0, utils_3.getErrorMessage)(e));
        }
    }
};
exports.upsertVector = upsertVector;
//# sourceMappingURL=upsertVector.js.map