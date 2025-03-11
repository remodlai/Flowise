"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = __importDefault(require("../../services/tools"));
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
const logger_1 = __importDefault(require("../../utils/logger"));
const createTool = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.createTool - body not provided!`);
        }
        // Log the request for debugging
        logger_1.default.debug('Creating tool with body:', req.body);
        const apiResponse = await tools_1.default.createTool(req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteTool = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.deleteTool - id not provided!`);
        }
        // Get applicationId from query parameters if provided
        const applicationId = req.query.applicationId;
        // Log the request for debugging
        logger_1.default.debug('Deleting tool with applicationId:', applicationId);
        const apiResponse = await tools_1.default.deleteTool(req.params.id, applicationId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllTools = async (req, res, next) => {
    try {
        // Get applicationId from query parameters if provided
        const applicationId = req.query.applicationId;
        // Log the request for debugging
        logger_1.default.debug('Getting tools with applicationId:', applicationId);
        const apiResponse = await tools_1.default.getAllTools(applicationId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getToolById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.getToolById - id not provided!`);
        }
        // Get applicationId from query parameters if provided
        const applicationId = req.query.applicationId;
        // Log the request for debugging
        logger_1.default.debug('Getting tool by ID with applicationId:', applicationId);
        const apiResponse = await tools_1.default.getToolById(req.params.id, applicationId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateTool = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.updateTool - id not provided!`);
        }
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: toolsController.deleteTool - body not provided!`);
        }
        // Log the request for debugging
        logger_1.default.debug('Updating tool with id:', req.params.id, 'and body:', req.body);
        const apiResponse = await tools_1.default.updateTool(req.params.id, req.body);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createTool,
    deleteTool,
    getAllTools,
    getToolById,
    updateTool
};
//# sourceMappingURL=index.js.map