"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const apikey_1 = __importDefault(require("../../services/apikey"));
const ChatFlow_1 = require("../../database/entities/ChatFlow");
const rateLimit_1 = require("../../utils/rateLimit");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const chatflows_1 = __importDefault(require("../../services/chatflows"));
const checkIfChatflowIsValidForStreaming = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.checkIfChatflowIsValidForStreaming - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowIsValidForStreaming(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const checkIfChatflowIsValidForUploads = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.checkIfChatflowIsValidForUploads - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.checkIfChatflowIsValidForUploads(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteChatflow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.deleteChatflow - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.deleteChatflow(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllChatflows = async (req, res, next) => {
    try {
        const apiResponse = await chatflows_1.default.getAllChatflows(req.query?.type, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
// Get specific chatflow via api key
const getChatflowByApiKey = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.apikey) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getChatflowByApiKey - apikey not provided!`);
        }
        const apikey = await apikey_1.default.getApiKey(req.params.apikey);
        if (!apikey) {
            return res.status(401).send('Unauthorized');
        }
        const apiResponse = await chatflows_1.default.getChatflowByApiKey(apikey.id, req.query.keyonly);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getChatflowById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getChatflowById - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.getChatflowById(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const saveChatflow = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.saveChatflow - body not provided!`);
        }
        const body = req.body;
        const newChatFlow = new ChatFlow_1.ChatFlow();
        Object.assign(newChatFlow, body);
        const apiResponse = await chatflows_1.default.saveChatflow(newChatFlow, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const importChatflows = async (req, res, next) => {
    try {
        const chatflows = req.body.Chatflows;
        const apiResponse = await chatflows_1.default.importChatflows(chatflows);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateChatflow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.updateChatflow - id not provided!`);
        }
        const chatflow = await chatflows_1.default.getChatflowById(req.params.id);
        if (!chatflow) {
            return res.status(404).send(`Chatflow ${req.params.id} not found`);
        }
        const body = req.body;
        const updateChatFlow = new ChatFlow_1.ChatFlow();
        Object.assign(updateChatFlow, body);
        updateChatFlow.id = chatflow.id;
        const rateLimiterManager = rateLimit_1.RateLimiterManager.getInstance();
        await rateLimiterManager.updateRateLimiter(updateChatFlow);
        const apiResponse = await chatflows_1.default.updateChatflow(chatflow, updateChatFlow, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getSinglePublicChatflow = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getSinglePublicChatflow - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.getSinglePublicChatflow(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getSinglePublicChatbotConfig = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: chatflowsRouter.getSinglePublicChatbotConfig - id not provided!`);
        }
        const apiResponse = await chatflows_1.default.getSinglePublicChatbotConfig(req.params.id);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
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