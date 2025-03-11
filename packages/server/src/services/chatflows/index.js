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
const storageUtils_1 = require("@components/storageUtils");
const http_status_codes_1 = require("http-status-codes");
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const ChatMessageFeedback_1 = require("../../database/entities/ChatMessageFeedback");
const UpsertHistory_1 = require("../../database/entities/UpsertHistory");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const documentstore_1 = __importDefault(require("../../services/documentstore"));
const utils_2 = require("../../utils");
const fileRepository_1 = require("../../utils/fileRepository");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const getUploadsConfig_1 = require("../../utils/getUploadsConfig");
const logger_1 = __importDefault(require("../../utils/logger"));
const Interface_Metrics_1 = require("../../Interface.Metrics");
// Check if chatflow valid for streaming
const checkIfChatflowIsValidForStreaming = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        //**
        const chatflow = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!chatflow) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        /*** Get Ending Node with Directed Graph  ***/
        const flowData = chatflow.flowData;
        const parsedFlowData = JSON.parse(flowData);
        const nodes = parsedFlowData.nodes;
        const edges = parsedFlowData.edges;
        const { graph, nodeDependencies } = (0, utils_2.constructGraphs)(nodes, edges);
        const endingNodes = (0, utils_2.getEndingNodes)(nodeDependencies, graph, nodes);
        let isStreaming = false;
        for (const endingNode of endingNodes) {
            const endingNodeData = endingNode.data;
            const isEndingNode = endingNodeData?.outputs?.output === 'EndingNode';
            // Once custom function ending node exists, flow is always unavailable to stream
            if (isEndingNode) {
                return { isStreaming: false };
            }
            isStreaming = (0, utils_2.isFlowValidForStream)(nodes, endingNodeData);
        }
        // If it is a Multi/Sequential Agents, always enable streaming
        if (endingNodes.filter((node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents').length > 0) {
            return { isStreaming: true };
        }
        const dbResponse = { isStreaming: isStreaming };
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowIsValidForStreaming - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Check if chatflow valid for uploads
const checkIfChatflowIsValidForUploads = async (chatflowId) => {
    try {
        const dbResponse = await (0, getUploadsConfig_1.utilGetUploadsConfig)(chatflowId);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.checkIfChatflowIsValidForUploads - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteChatflow = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // INTERCEPT: Remove the chatflow's association with any application
        try {
            const applicationChatflowsService = await Promise.resolve().then(() => __importStar(require('../applicationchatflows')));
            await applicationChatflowsService.default.removeChatflowAssociation(chatflowId);
        }
        catch (error) {
            logger_1.default.error(`[chatflowsService.deleteChatflow] Error removing chatflow association: ${(0, utils_1.getErrorMessage)(error)}`);
        }
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).delete({ id: chatflowId });
        try {
            // Delete all uploads corresponding to this chatflow
            await (0, storageUtils_1.removeFolderFromStorage)(chatflowId);
            await documentstore_1.default.updateDocumentStoreUsage(chatflowId, undefined);
            // Delete all chat messages
            await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).delete({ chatflowid: chatflowId });
            // Delete all chat feedback
            await appServer.AppDataSource.getRepository(ChatMessageFeedback_1.ChatMessageFeedback).delete({ chatflowid: chatflowId });
            // Delete all upsert history
            await appServer.AppDataSource.getRepository(UpsertHistory_1.UpsertHistory).delete({ chatflowid: chatflowId });
        }
        catch (e) {
            logger_1.default.error(`[server]: Error deleting file storage for chatflow ${chatflowId}: ${e}`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.deleteChatflow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/*REMODL TODO: modify this to allow for multi-tenant check again database*/
const getAllChatflows = async (type, req) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).find();
        // Filter by type if specified
        if (type === 'MULTIAGENT') {
            dbResponse = dbResponse.filter((chatflow) => chatflow.type === 'MULTIAGENT');
        }
        else if (type === 'CHATFLOW') {
            // fetch all chatflows that are not agentflow
            dbResponse = dbResponse.filter((chatflow) => chatflow.type === 'CHATFLOW' || !chatflow.type);
        }
        // INTERCEPT: Filter chatflows based on current application context
        try {
            // Get the current application ID from the request
            const applicationId = req?.applicationId;
            if (applicationId) {
                if (applicationId === 'global') {
                    // Platform admin with "Global" option selected - show all chatflows
                    return dbResponse;
                }
                else {
                    // Filter chatflows based on the selected application
                    const applicationChatflowsService = await Promise.resolve().then(() => __importStar(require('../applicationchatflows')));
                    const chatflowIds = await applicationChatflowsService.default.getChatflowIdsForApplication(applicationId);
                    return dbResponse.filter(chatflow => chatflowIds.includes(chatflow.id));
                }
            }
        }
        catch (error) {
            logger_1.default.error(`[chatflowsService.getAllChatflows] Error filtering chatflows: ${(0, utils_1.getErrorMessage)(error)}`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getAllChatflows - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getChatflowByApiKey = async (apiKeyId, keyonly) => {
    try {
        // Here we only get chatflows that are bounded by the apikeyid and chatflows that are not bounded by any apikey
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let query = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
            .createQueryBuilder('cf')
            .where('cf.apikeyid = :apikeyid', { apikeyid: apiKeyId });
        if (keyonly === undefined) {
            query = query.orWhere('cf.apikeyid IS NULL').orWhere('cf.apikeyid = ""');
        }
        const dbResponse = await query.orderBy('cf.name', 'ASC').getMany();
        if (dbResponse.length < 1) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow not found in the database!`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getChatflowByApiKey - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getChatflowById = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!dbResponse) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found in the database!`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getChatflowById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const saveChatflow = async (newChatFlow, req) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let dbResponse;
        if ((0, fileRepository_1.containsBase64File)(newChatFlow)) {
            // we need a 2-step process, as we need to save the chatflow first and then update the file paths
            // this is because we need the chatflow id to create the file paths
            // step 1 - save with empty flowData
            const incomingFlowData = newChatFlow.flowData;
            //REMODL NOTE: this stringifys the JSON data of the chatflow. 
            newChatFlow.flowData = JSON.stringify({});
            //REMODL NOTE: this creates a new chatflow entity in the database.
            const chatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).create(newChatFlow);
            //REMODL NOTE: this saves the chatflow entity to the database.
            const step1Results = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
            // INTERCEPT: Associate the chatflow with the application
            try {
                const applicationId = req?.applicationId;
                if (applicationId && applicationId !== 'global') {
                    // Associate with the specified application
                    const applicationChatflowsService = await Promise.resolve().then(() => __importStar(require('../applicationchatflows')));
                    await applicationChatflowsService.default.associateChatflowWithApplication(step1Results.id, applicationId);
                }
                else {
                    // Associate with the default application
                    const applicationChatflowsService = await Promise.resolve().then(() => __importStar(require('../applicationchatflows')));
                    const defaultAppId = await applicationChatflowsService.default.getDefaultApplicationId();
                    if (defaultAppId) {
                        await applicationChatflowsService.default.associateChatflowWithApplication(step1Results.id, defaultAppId);
                    }
                }
            }
            catch (error) {
                logger_1.default.error(`[chatflowsService.saveChatflow] Error associating chatflow with application: ${(0, utils_1.getErrorMessage)(error)}`);
            }
            // step 2 - convert base64 to file paths and update the chatflow
            step1Results.flowData = await (0, fileRepository_1.updateFlowDataWithFilePaths)(step1Results.id, incomingFlowData);
            await _checkAndUpdateDocumentStoreUsage(step1Results);
            dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(step1Results);
        }
        else {
            const chatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).create(newChatFlow);
            dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
            // INTERCEPT: Associate the chatflow with the application
            try {
                const applicationId = req?.applicationId;
                if (applicationId && applicationId !== 'global') {
                    // Associate with the specified application
                    const applicationChatflowsService = await Promise.resolve().then(() => __importStar(require('../applicationchatflows')));
                    await applicationChatflowsService.default.associateChatflowWithApplication(dbResponse.id, applicationId);
                }
                else {
                    // Associate with the default application
                    const applicationChatflowsService = await Promise.resolve().then(() => __importStar(require('../applicationchatflows')));
                    const defaultAppId = await applicationChatflowsService.default.getDefaultApplicationId();
                    if (defaultAppId) {
                        await applicationChatflowsService.default.associateChatflowWithApplication(dbResponse.id, defaultAppId);
                    }
                }
            }
            catch (error) {
                logger_1.default.error(`[chatflowsService.saveChatflow] Error associating chatflow with application: ${(0, utils_1.getErrorMessage)(error)}`);
            }
        }
        await appServer.telemetry.sendTelemetry('chatflow_created', {
            version: await (0, utils_2.getAppVersion)(),
            chatflowId: dbResponse.id,
            flowGraph: (0, utils_2.getTelemetryFlowObj)(JSON.parse(dbResponse.flowData)?.nodes, JSON.parse(dbResponse.flowData)?.edges)
        });
        appServer.metricsProvider?.incrementCounter(dbResponse?.type === 'MULTIAGENT' ? Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.AGENTFLOW_CREATED : Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.CHATFLOW_CREATED, { status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS });
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.saveChatflow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importChatflows = async (newChatflows, queryRunner) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repository = queryRunner ? queryRunner.manager.getRepository(ChatFlow_1.ChatFlow) : appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow);
        // step 1 - check whether file chatflows array is zero
        if (newChatflows.length == 0)
            return;
        // step 2 - check whether ids are duplicate in database
        let ids = '(';
        let count = 0;
        const lastCount = newChatflows.length - 1;
        newChatflows.forEach((newChatflow) => {
            ids += `'${newChatflow.id}'`;
            if (lastCount != count)
                ids += ',';
            if (lastCount == count)
                ids += ')';
            count += 1;
        });
        const selectResponse = await repository.createQueryBuilder('cf').select('cf.id').where(`cf.id IN ${ids}`).getMany();
        const foundIds = selectResponse.map((response) => {
            return response.id;
        });
        // step 3 - remove ids that are only duplicate
        const prepChatflows = newChatflows.map((newChatflow) => {
            let id = '';
            if (newChatflow.id)
                id = newChatflow.id;
            let flowData = '';
            if (newChatflow.flowData)
                flowData = newChatflow.flowData;
            if (foundIds.includes(id)) {
                newChatflow.id = undefined;
                newChatflow.name += ' (1)';
            }
            newChatflow.flowData = JSON.stringify(JSON.parse(flowData));
            return newChatflow;
        });
        // step 4 - transactional insert array of entities
        const insertResponse = await repository.insert(prepChatflows);
        return insertResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.saveChatflows - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
//REMODL TODO: add the updateChatflow to the supabase table for chatflows for a given application and/or organization. We should be able to thus have "undo and redo" for chatflows
const updateChatflow = async (chatflow, updateChatFlow, req) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (updateChatFlow.flowData && (0, fileRepository_1.containsBase64File)(updateChatFlow)) {
            updateChatFlow.flowData = await (0, fileRepository_1.updateFlowDataWithFilePaths)(chatflow.id, updateChatFlow.flowData);
        }
        const newDbChatflow = appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).merge(chatflow, updateChatFlow);
        await _checkAndUpdateDocumentStoreUsage(newDbChatflow);
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(newDbChatflow);
        // INTERCEPT: Ensure the chatflow is associated with an application
        try {
            const applicationChatflowsService = await Promise.resolve().then(() => __importStar(require('../applicationchatflows')));
            const applicationId = req?.applicationId;
            if (applicationId && applicationId !== 'global') {
                // Associate with the specified application
                await applicationChatflowsService.default.associateChatflowWithApplication(dbResponse.id, applicationId);
            }
            else {
                // Check if already associated with an application
                const currentAppId = await applicationChatflowsService.default.getApplicationIdForChatflow(dbResponse.id);
                if (!currentAppId) {
                    // If not associated with any application, associate with the default
                    const defaultAppId = await applicationChatflowsService.default.getDefaultApplicationId();
                    if (defaultAppId) {
                        await applicationChatflowsService.default.associateChatflowWithApplication(dbResponse.id, defaultAppId);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error(`[chatflowsService.updateChatflow] Error ensuring chatflow association: ${(0, utils_1.getErrorMessage)(error)}`);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.updateChatflow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Get specific chatflow via id (PUBLIC endpoint, used when sharing chatbot link)
const getSinglePublicChatflow = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (dbResponse && dbResponse.isPublic) {
            return dbResponse;
        }
        else if (dbResponse && !dbResponse.isPublic) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Unauthorized`);
        }
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
    }
    catch (error) {
        if (error instanceof internalFlowiseError_1.InternalFlowiseError && error.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
            throw error;
        }
        else {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getSinglePublicChatflow - ${(0, utils_1.getErrorMessage)(error)}`);
        }
    }
};
// Get specific chatflow chatbotConfig via id (PUBLIC endpoint, used to retrieve config for embedded chat)
// Safe as public endpoint as chatbotConfig doesn't contain sensitive credential
const getSinglePublicChatbotConfig = async (chatflowId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
            id: chatflowId
        });
        if (!dbResponse) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Chatflow ${chatflowId} not found`);
        }
        const uploadsConfig = await (0, getUploadsConfig_1.utilGetUploadsConfig)(chatflowId);
        // even if chatbotConfig is not set but uploads are enabled
        // send uploadsConfig to the chatbot
        if (dbResponse.chatbotConfig || uploadsConfig) {
            try {
                const parsedConfig = dbResponse.chatbotConfig ? JSON.parse(dbResponse.chatbotConfig) : {};
                return { ...parsedConfig, uploads: uploadsConfig };
            }
            catch (e) {
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error parsing Chatbot Config for Chatflow ${chatflowId}`);
            }
        }
        return 'OK';
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: chatflowsService.getSinglePublicChatbotConfig - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const _checkAndUpdateDocumentStoreUsage = async (chatflow) => {
    const parsedFlowData = JSON.parse(chatflow.flowData);
    const nodes = parsedFlowData.nodes;
    // from the nodes array find if there is a node with name == documentStore)
    const node = nodes.length > 0 && nodes.find((node) => node.data.name === 'documentStore');
    if (!node || !node.data || !node.data.inputs || node.data.inputs['selectedStore'] === undefined) {
        await documentstore_1.default.updateDocumentStoreUsage(chatflow.id, undefined);
    }
    else {
        await documentstore_1.default.updateDocumentStoreUsage(chatflow.id, node.data.inputs['selectedStore']);
    }
};
exports.default = {
    checkIfChatflowIsValidForStreaming,
    checkIfChatflowIsValidForUploads,
    deleteChatflow,
    getAllChatflows,
    getChatflowByApiKey,
    getChatflowById,
    saveChatflow,
    importChatflows,
    updateChatflow,
    getSinglePublicChatflow,
    getSinglePublicChatbotConfig
};
//# sourceMappingURL=index.js.map