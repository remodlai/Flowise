"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const credentials_1 = __importDefault(require("../../services/credentials"));
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
const logger_1 = __importDefault(require("../../utils/logger"));
const createCredential = async (req, res, next) => {
    try {
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialsController.createCredential - body not provided!`);
        }
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId;
        // Check if required values are present
        if (!appId) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to create this credential');
        }
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId;
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId;
            // Ensure it's in the body as well
            req.body.applicationId = appId;
        }
        const apiResponse = await credentials_1.default.createCredential(req.body, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const deleteCredentials = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialsController.deleteCredentials - id not provided!`);
        }
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId;
        // Check if required values are present
        if (!appId) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to delete this credential');
        }
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId;
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId;
            // Ensure it's in the body as well
            req.body.applicationId = appId;
        }
        const apiResponse = await credentials_1.default.deleteCredentials(req.params.id, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getAllCredentials = async (req, res, next) => {
    try {
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId || req.query.applicationId;
        let orgId = req.headers['x-organization-id'] || req.body.orgId;
        let userId = req.headers['x-user-id'] || req.body.userId;
        logger_1.default.debug(`[server]: getAllCredentials - appId: ${appId}, orgId: ${orgId}, userId: ${userId}`);
        // Check if required values are present
        if (!appId) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to get all credentials');
        }
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId;
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId;
            // Ensure it's in the body as well
            req.body.applicationId = appId;
            req.body.appId = appId;
        }
        const apiResponse = await credentials_1.default.getAllCredentials(req.query.credentialName, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const getCredentialById = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialsController.getCredentialById - id not provided!`);
        }
        // Extract application ID from headers, body, or query parameters
        let appId = req.headers['x-application-id'] || req.body.appId || req.query.applicationId;
        // If application ID is provided, set it in the request headers and body for consistency
        if (appId) {
            req.headers['x-application-id'] = appId;
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId;
            // Ensure it's in the body as well
            req.body.appId = appId;
            logger_1.default.debug(`Credential request with application ID: ${appId}`);
        }
        else {
            logger_1.default.debug(`Credential request without application ID`);
        }
        const apiResponse = await credentials_1.default.getCredentialById(req.params.id, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
const updateCredential = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialsController.updateCredential - id not provided!`);
        }
        if (!req.body) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: credentialsController.updateCredential - body not provided!`);
        }
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId;
        // Check if required values are present
        if (!appId) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to update this credential');
        }
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId;
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId;
            // Ensure it's in the body as well
            req.body.appId = appId;
        }
        const apiResponse = await credentials_1.default.updateCredential(req.params.id, req.body, req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    updateCredential
};
//# sourceMappingURL=index.js.map