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
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const secrets_1 = require("../secrets");
const supabase_1 = require("../../utils/supabase");
const createCredential = async (requestBody, req) => {
    try {
        // Get application ID from request or body
        const applicationId = requestBody.applicationId || getApplicationIdFromRequest(req);
        // Store credential in Supabase secrets table
        const credentialId = await (0, secrets_1.storeSecret)(requestBody.name, 'credential', requestBody.plainDataObj || {}, {
            credentialName: requestBody.credentialName,
            applicationId: applicationId || null,
            createdAt: new Date().toISOString()
        });
        // Associate credential with application if applicationId is provided
        if (applicationId) {
            try {
                // Dynamically import applicationcredentials service to avoid circular dependencies
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                await applicationcredentials.associateCredentialWithApplication(credentialId, applicationId);
            }
            catch (error) {
                logger_1.default.error(`Error associating credential with application: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if association fails - the credential is still created
            }
        }
        else {
            // If no applicationId provided, associate with default application (Platform Sandbox)
            try {
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const defaultAppId = await applicationcredentials.getDefaultApplicationId();
                if (defaultAppId) {
                    await applicationcredentials.associateCredentialWithApplication(credentialId, defaultAppId);
                }
            }
            catch (error) {
                logger_1.default.error(`Error associating credential with default application: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if association fails
            }
        }
        // Return the created credential
        return {
            id: credentialId,
            name: requestBody.name,
            credentialName: requestBody.credentialName,
            encryptedData: credentialId, // Store the secret ID as the encryptedData
            updatedDate: new Date(),
            createdDate: new Date()
        };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.createCredential - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Delete credential by ID
const deleteCredentials = async (credentialId, req) => {
    try {
        // Get application ID from request
        const applicationId = getApplicationIdFromRequest(req);
        // If application ID is provided, verify credential belongs to application
        if (applicationId) {
            try {
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId);
                if (!credentialIds.includes(credentialId)) {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.FORBIDDEN, `Credential ${credentialId} does not belong to application ${applicationId}`);
                }
            }
            catch (error) {
                if (error instanceof internalFlowiseError_1.InternalFlowiseError) {
                    throw error;
                }
                logger_1.default.error(`Error verifying credential application: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if verification fails
            }
        }
        // Delete the credential from Supabase
        await (0, secrets_1.deleteSecret)(credentialId);
        // Remove credential association from application
        try {
            const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
            await applicationcredentials.removeCredentialAssociation(credentialId);
        }
        catch (error) {
            logger_1.default.error(`Error removing credential association: ${(0, utils_1.getErrorMessage)(error)}`);
            // Continue even if association removal fails - the credential is still deleted
        }
        // Return a response that matches the original format
        return {
            affected: 1,
            raw: []
        };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.deleteCredential - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Helper function to get application ID from request
const getApplicationIdFromRequest = (req, paramCredentialName) => {
    if (!req)
        return undefined;
    // First check if applicationId is provided in paramCredentialName object
    if (typeof paramCredentialName === 'object' && paramCredentialName?.applicationId) {
        return paramCredentialName.applicationId !== 'global' ? paramCredentialName.applicationId : undefined;
    }
    // Check if applicationId is provided as a query parameter
    if (req.query?.applicationId && req.query.applicationId !== 'global') {
        console.log('found applicationId in query', req.query.applicationId);
        return req.query.applicationId;
    }
    // Check if applicationId is set in the request context by middleware
    if (req.applicationId && req.applicationId !== 'global') {
        console.log('found applicationId in request', req.applicationId);
        return req.applicationId;
    }
    // Fallback to X-Application-ID header if present
    const headerAppId = req.headers?.['x-application-id'] || req.headers?.['X-Application-ID'];
    if (headerAppId && headerAppId !== 'global') {
        console.log('found applicationId in header', headerAppId);
        return headerAppId;
    }
    return undefined;
};
const getAllCredentials = async (paramCredentialName, req) => {
    try {
        logger_1.default.info(`Getting all credentials. Param credential name: ${paramCredentialName}`);
        logger_1.default.info(`Request headers: ${JSON.stringify(req?.headers)}`);
        logger_1.default.info(`Request query: ${JSON.stringify(req?.query)}`);
        // Get all credentials from Supabase
        const credentials = await (0, secrets_1.listSecrets)('credential');
        logger_1.default.info(`Found ${credentials.length} total credentials in Supabase`);
        // Get application ID from request
        const applicationId = getApplicationIdFromRequest(req, paramCredentialName);
        logger_1.default.info(`Application ID from request: ${applicationId}`);
        // Filter credentials by name if provided
        let filteredCredentials = credentials;
        if (paramCredentialName) {
            logger_1.default.info(`Filtering credentials by name: ${paramCredentialName}`);
            if (Array.isArray(paramCredentialName)) {
                filteredCredentials = credentials.filter(cred => paramCredentialName.includes(cred.metadata?.credentialName));
            }
            else {
                filteredCredentials = credentials.filter(cred => cred.metadata?.credentialName === paramCredentialName);
            }
            logger_1.default.info(`After filtering by name, found ${filteredCredentials.length} credentials`);
        }
        // Filter credentials by application if an applicationId is available
        if (applicationId) {
            try {
                logger_1.default.info(`Filtering credentials by application ID: ${applicationId}`);
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId);
                logger_1.default.info(`Found ${credentialIds.length} credential IDs for application ${applicationId}: ${JSON.stringify(credentialIds)}`);
                // Filter credentials by IDs from application_credentials
                filteredCredentials = filteredCredentials.filter(cred => credentialIds.includes(cred.id));
                logger_1.default.info(`After filtering by application, found ${filteredCredentials.length} credentials`);
            }
            catch (error) {
                logger_1.default.error(`Error filtering credentials by application: ${(0, utils_1.getErrorMessage)(error)}`);
                // Return all credentials if filtering fails
            }
        }
        // Format the response to match the original format
        const formattedCredentials = filteredCredentials.map(cred => ({
            id: cred.id,
            name: cred.name,
            credentialName: cred.metadata?.credentialName,
            applicationId: cred.metadata?.applicationId || null,
            encryptedData: cred.id, // Store the secret ID as the encryptedData
            updatedDate: new Date(cred.metadata?.updatedAt || Date.now()),
            createdDate: new Date(cred.metadata?.createdAt || Date.now())
        }));
        logger_1.default.info(`Returning ${formattedCredentials.length} credentials with IDs: ${JSON.stringify(formattedCredentials.map(cred => cred.id))}`);
        return formattedCredentials;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.getAllCredentials - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getCredentialById = async (credentialId, req) => {
    try {
        // Get application ID from request
        const applicationId = getApplicationIdFromRequest(req);
        // If application ID is provided, verify credential belongs to application
        if (applicationId) {
            try {
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId);
                if (!credentialIds.includes(credentialId)) {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.FORBIDDEN, `Credential ${credentialId} does not belong to application ${applicationId}`);
                }
            }
            catch (error) {
                if (error instanceof internalFlowiseError_1.InternalFlowiseError) {
                    throw error;
                }
                logger_1.default.error(`Error verifying credential application: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if verification fails
            }
        }
        // Get the credential data from Supabase
        const secretData = await (0, secrets_1.getSecret)(credentialId);
        // Get the credential metadata from Supabase
        const { data, error } = await supabase_1.supabase
            .from('secrets')
            .select('name, metadata')
            .eq('id', credentialId)
            .single();
        if (error)
            throw error;
        if (!data)
            throw new Error('Credential not found');
        // Get the component credentials from the app server
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // Prepare the return object
        const returnCredential = {
            id: credentialId,
            name: data.name,
            credentialName: data.metadata?.credentialName,
            plainDataObj: secretData,
            encryptedData: '', // Not needed as we're using Supabase
            updatedDate: new Date(data.metadata?.updatedAt || Date.now()),
            createdDate: new Date(data.metadata?.createdAt || Date.now())
        };
        // Add application ID to the return object if available
        if (data.metadata?.applicationId) {
            returnCredential.applicationId = data.metadata.applicationId;
        }
        else {
            // Try to get application ID from application_credentials table
            try {
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const credentialAppId = await applicationcredentials.getApplicationIdForCredential(credentialId);
                if (credentialAppId) {
                    // Add application ID to the return object
                    returnCredential.applicationId = credentialAppId;
                }
            }
            catch (error) {
                logger_1.default.error(`Error getting application for credential: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if getting application fails
            }
        }
        return returnCredential;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.getCredentialById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateCredential = async (credentialId, requestBody, req) => {
    try {
        // Get application ID from request or body
        const applicationId = requestBody.applicationId || getApplicationIdFromRequest(req);
        // If application ID is provided, verify credential belongs to application
        if (applicationId) {
            try {
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId);
                if (!credentialIds.includes(credentialId)) {
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.FORBIDDEN, `Credential ${credentialId} does not belong to application ${applicationId}`);
                }
            }
            catch (error) {
                if (error instanceof internalFlowiseError_1.InternalFlowiseError) {
                    throw error;
                }
                logger_1.default.error(`Error verifying credential application: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if verification fails
            }
        }
        // Get the current credential data
        const currentData = await (0, secrets_1.getSecret)(credentialId);
        // Get the current credential metadata
        const { data, error } = await supabase_1.supabase
            .from('secrets')
            .select('name, metadata')
            .eq('id', credentialId)
            .single();
        if (error)
            throw error;
        if (!data)
            throw new Error('Credential not found');
        // Merge the current data with the new data
        const updatedData = { ...currentData, ...requestBody.plainDataObj };
        // Update the metadata
        const updatedMetadata = {
            ...data.metadata,
            credentialName: requestBody.credentialName || data.metadata.credentialName,
            applicationId: applicationId || data.metadata.applicationId,
            updatedAt: new Date().toISOString()
        };
        // Update the name if provided
        if (requestBody.name) {
            await supabase_1.supabase
                .from('secrets')
                .update({ name: requestBody.name })
                .eq('id', credentialId);
        }
        // Update the credential in Supabase
        await (0, secrets_1.updateSecret)(credentialId, updatedData, updatedMetadata);
        // Update application association if applicationId is provided
        if (applicationId) {
            try {
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                await applicationcredentials.associateCredentialWithApplication(credentialId, applicationId);
            }
            catch (error) {
                logger_1.default.error(`Error updating credential application association: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if association update fails - the credential is still updated
            }
        }
        // Return the updated credential
        return {
            id: credentialId,
            name: requestBody.name || data.name,
            credentialName: requestBody.credentialName || data.metadata.credentialName,
            applicationId: applicationId || data.metadata.applicationId,
            encryptedData: '', // Not needed as we're using Supabase
            updatedDate: new Date(data.metadata?.updatedAt || Date.now()),
            createdDate: new Date(data.metadata?.createdAt || Date.now())
        };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: credentialsService.updateCredential - ${(0, utils_1.getErrorMessage)(error)}`);
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