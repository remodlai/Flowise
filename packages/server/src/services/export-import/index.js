"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const chatflows_1 = __importDefault(require("../chatflows"));
const tools_1 = __importDefault(require("../tools"));
const variables_1 = __importDefault(require("../variables"));
const assistants_1 = __importDefault(require("../assistants"));
const convertExportInput = (body) => {
    try {
        if (!body || typeof body !== 'object')
            throw new Error('Invalid ExportInput object in request body');
        if (body.tool && typeof body.tool !== 'boolean')
            throw new Error('Invalid tool property in ExportInput object');
        if (body.chatflow && typeof body.chatflow !== 'boolean')
            throw new Error('Invalid chatflow property in ExportInput object');
        if (body.agentflow && typeof body.agentflow !== 'boolean')
            throw new Error('Invalid agentflow property in ExportInput object');
        if (body.variable && typeof body.variable !== 'boolean')
            throw new Error('Invalid variable property in ExportInput object');
        if (body.assistant && typeof body.assistant !== 'boolean')
            throw new Error('Invalid assistant property in ExportInput object');
        return body;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.convertExportInput - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const FileDefaultName = 'ExportData.json';
const exportData = async (exportInput) => {
    try {
        // step 1 - get all Tool
        let allTool = [];
        if (exportInput.tool === true)
            allTool = await tools_1.default.getAllTools();
        // step 2 - get all ChatFlow
        let allChatflow = [];
        if (exportInput.chatflow === true)
            allChatflow = await chatflows_1.default.getAllChatflows('CHATFLOW');
        // step 3 - get all MultiAgent
        let allMultiAgent = [];
        if (exportInput.agentflow === true)
            allMultiAgent = await chatflows_1.default.getAllChatflows('MULTIAGENT');
        let allVars = [];
        if (exportInput.variable === true)
            allVars = await variables_1.default.getAllVariables();
        let allAssistants = [];
        if (exportInput.assistant === true)
            allAssistants = await assistants_1.default.getAllAssistants();
        return {
            FileDefaultName,
            Tool: allTool,
            ChatFlow: allChatflow,
            AgentFlow: allMultiAgent,
            Variable: allVars,
            Assistant: allAssistants
        };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.exportData - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const importData = async (importData) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryRunner = appServer.AppDataSource.createQueryRunner();
        try {
            await queryRunner.startTransaction();
            if (importData.Tool.length > 0)
                await tools_1.default.importTools(importData.Tool, queryRunner);
            if (importData.ChatFlow.length > 0)
                await chatflows_1.default.importChatflows(importData.ChatFlow, queryRunner);
            if (importData.AgentFlow.length > 0)
                await chatflows_1.default.importChatflows(importData.AgentFlow, queryRunner);
            if (importData.Variable.length > 0)
                await variables_1.default.importVariables(importData.Variable, queryRunner);
            if (importData.Assistant.length > 0)
                await assistants_1.default.importAssistants(importData.Assistant, queryRunner);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: exportImportService.importAll - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    convertExportInput,
    exportData,
    importData
};
//# sourceMappingURL=index.js.map