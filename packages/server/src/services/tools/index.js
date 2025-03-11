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
const http_status_codes_1 = require("http-status-codes");
const Tool_1 = require("../../database/entities/Tool");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const utils_2 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Interface_Metrics_1 = require("../../Interface.Metrics");
const typeorm_1 = require("typeorm");
const logger_1 = __importDefault(require("../../utils/logger"));
// Dynamic import for applicationtools service
const importApplicationTools = async () => {
    try {
        return await Promise.resolve().then(() => __importStar(require('../applicationtools')));
    }
    catch (error) {
        logger_1.default.error('Error importing applicationtools service:', error);
        return null;
    }
};
const createTool = async (requestBody) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newTool = new Tool_1.Tool();
        Object.assign(newTool, requestBody);
        const tool = await appServer.AppDataSource.getRepository(Tool_1.Tool).create(newTool);
        const dbResponse = await appServer.AppDataSource.getRepository(Tool_1.Tool).save(tool);
        // Associate tool with application if applicationId is provided
        if (requestBody.applicationId) {
            try {
                const applicationTools = await importApplicationTools();
                if (applicationTools) {
                    await applicationTools.associateToolWithApplication(dbResponse.id, requestBody.applicationId);
                }
            }
            catch (error) {
                logger_1.default.error('Error associating tool with application:', error);
            }
        }
        else {
            // Associate with default application if no applicationId is provided
            try {
                const applicationTools = await importApplicationTools();
                if (applicationTools) {
                    const defaultAppId = await applicationTools.getDefaultApplicationId();
                    if (defaultAppId) {
                        await applicationTools.associateToolWithApplication(dbResponse.id, defaultAppId);
                    }
                }
            }
            catch (error) {
                logger_1.default.error('Error associating tool with default application:', error);
            }
        }
        await appServer.telemetry.sendTelemetry('tool_created', {
            version: await (0, utils_2.getAppVersion)(),
            toolId: dbResponse.id,
            toolName: dbResponse.name
        });
        appServer.metricsProvider?.incrementCounter(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS.TOOL_CREATED, { status: Interface_Metrics_1.FLOWISE_COUNTER_STATUS.SUCCESS });
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.createTool - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteTool = async (toolId, applicationId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // Remove tool's association with any application
        try {
            const applicationTools = await importApplicationTools();
            if (applicationTools) {
                await applicationTools.removeToolAssociation(toolId);
            }
        }
        catch (error) {
            logger_1.default.error('Error removing tool association:', error);
        }
        const dbResponse = await appServer.AppDataSource.getRepository(Tool_1.Tool).delete({
            id: toolId
        });
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.deleteTool - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllTools = async (applicationId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // If applicationId is provided, filter tools by application
        if (applicationId) {
            try {
                const applicationTools = await importApplicationTools();
                if (applicationTools) {
                    const toolIds = await applicationTools.getToolIdsForApplication(applicationId);
                    if (toolIds.length > 0) {
                        return await appServer.AppDataSource.getRepository(Tool_1.Tool).find({
                            where: {
                                id: (0, typeorm_1.In)(toolIds)
                            }
                        });
                    }
                    return [];
                }
            }
            catch (error) {
                logger_1.default.error('Error getting tools for application:', error);
            }
        }
        // If no applicationId or error occurred, return all tools
        const dbResponse = await appServer.AppDataSource.getRepository(Tool_1.Tool).find();
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.getAllTools - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getToolById = async (toolId, applicationId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(Tool_1.Tool).findOneBy({
            id: toolId
        });
        if (!dbResponse) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Tool ${toolId} not found`);
        }
        // Get the associated application ID
        try {
            const applicationTools = await importApplicationTools();
            if (applicationTools) {
                const toolApplicationId = await applicationTools.getApplicationIdForTool(toolId);
                // If applicationId is provided, check if tool belongs to that application
                if (applicationId && applicationId !== 'global' && toolApplicationId !== applicationId) {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.FORBIDDEN, `Tool ${toolId} does not belong to application ${applicationId}`);
                }
                if (toolApplicationId) {
                    return { ...dbResponse, applicationId: toolApplicationId };
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error getting application ID for tool:', error);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.getToolById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateTool = async (toolId, toolBody) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const tool = await appServer.AppDataSource.getRepository(Tool_1.Tool).findOneBy({
            id: toolId
        });
        if (!tool) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Tool ${toolId} not found`);
        }
        // Update tool's application association if applicationId is provided
        if (toolBody.applicationId) {
            try {
                const applicationTools = await importApplicationTools();
                if (applicationTools) {
                    await applicationTools.associateToolWithApplication(toolId, toolBody.applicationId);
                }
            }
            catch (error) {
                logger_1.default.error('Error updating tool application association:', error);
            }
            // Remove applicationId from toolBody to avoid saving it to the Tool entity
            const { applicationId, ...toolBodyWithoutAppId } = toolBody;
            toolBody = toolBodyWithoutAppId;
        }
        const updateTool = new Tool_1.Tool();
        Object.assign(updateTool, toolBody);
        await appServer.AppDataSource.getRepository(Tool_1.Tool).merge(tool, updateTool);
        const dbResponse = await appServer.AppDataSource.getRepository(Tool_1.Tool).save(tool);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.updateTool - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importTools = async (newTools, queryRunner) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repository = queryRunner ? queryRunner.manager.getRepository(Tool_1.Tool) : appServer.AppDataSource.getRepository(Tool_1.Tool);
        // step 1 - check whether file tools array is zero
        if (newTools.length == 0)
            return;
        // step 2 - check whether ids are duplicate in database
        let ids = '(';
        let count = 0;
        const lastCount = newTools.length - 1;
        newTools.forEach((newTools) => {
            ids += `'${newTools.id}'`;
            if (lastCount != count)
                ids += ',';
            if (lastCount == count)
                ids += ')';
            count += 1;
        });
        const selectResponse = await repository.createQueryBuilder('t').select('t.id').where(`t.id IN ${ids}`).getMany();
        const foundIds = selectResponse.map((response) => {
            return response.id;
        });
        // step 3 - remove ids that are only duplicate
        const prepTools = newTools.map((newTool) => {
            let id = '';
            if (newTool.id)
                id = newTool.id;
            if (foundIds.includes(id)) {
                newTool.id = undefined;
                newTool.name += ' (1)';
            }
            return newTool;
        });
        // step 4 - transactional insert array of entities
        const insertResponse = await repository.insert(prepTools);
        // step 5 - associate imported tools with default application
        try {
            const applicationTools = await importApplicationTools();
            if (applicationTools) {
                const defaultAppId = await applicationTools.getDefaultApplicationId();
                if (defaultAppId) {
                    // Get the IDs of the newly inserted tools
                    const newToolIds = insertResponse.identifiers.map(identifier => identifier.id);
                    // Associate each tool with the default application
                    for (const toolId of newToolIds) {
                        await applicationTools.associateToolWithApplication(toolId, defaultAppId);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error associating imported tools with default application:', error);
        }
        return insertResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: toolsService.importTools - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createTool,
    deleteTool,
    getAllTools,
    getToolById,
    updateTool,
    importTools
};
//# sourceMappingURL=index.js.map