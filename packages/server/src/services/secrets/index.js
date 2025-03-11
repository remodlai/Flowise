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
exports.listSecrets = exports.deleteSecret = exports.updateSecret = exports.getSecretByKeyId = exports.getSecret = exports.storeSecret = void 0;
const crypto_js_1 = require("crypto-js");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("../../errors/utils");
const platformSettings_1 = require("../../utils/platformSettings");
const logger_1 = __importDefault(require("../../utils/logger"));
const index_1 = require("../../index");
// Create a Supabase client with the service role key
// This has admin privileges and can bypass RLS
// DEPRECATED: Use the centralized client from App class instead
// const supabaseUrl = process.env.SUPABASE_URL || ''
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
// const supabase = createClient(supabaseUrl, supabaseServiceKey)
/**
 * Get the Supabase client from the App instance
 * This ensures we're using a single, properly initialized client
 */
const getSupabaseClient = () => {
    const app = (0, index_1.getInstance)();
    if (!app) {
        throw new Error('App instance not available');
    }
    // Use the direct Supabase property instead of the getter method
    if (!app.Supabase) {
        throw new Error('Supabase client not initialized');
    }
    return app.Supabase;
};
/**
 * Get the master encryption key
 * @returns The master encryption key
 */
const getMasterEncryptionKey = async () => {
    try {
        return await (0, platformSettings_1.getEncryptionKey)();
    }
    catch (error) {
        logger_1.default.error(`Error getting master encryption key: ${(0, utils_1.getErrorMessage)(error)}`);
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to retrieve encryption key from platform settings. Please ensure the ENCRYPTION_KEY is set in platform settings.`);
    }
};
/**
 * Store a secret in Supabase
 * @param name Name of the secret
 * @param type Type of secret (api_key, credential, etc.)
 * @param value Value to encrypt and store
 * @param metadata Additional metadata
 * @param keyId Optional key ID for API keys
 * @returns The ID of the stored secret
 */
const storeSecret = async (name, type, value, metadata = {}, keyId) => {
    try {
        logger_1.default.debug(`Storing secret: ${name}, type: ${type}`);
        // Get the master encryption key
        const masterKey = await getMasterEncryptionKey();
        // Encrypt the value
        const encryptedValue = crypto_js_1.AES.encrypt(JSON.stringify(value), masterKey).toString();
        // Store in Supabase
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('secrets')
            .insert({
            name,
            type,
            value: encryptedValue,
            metadata,
            key_id: keyId
        })
            .select('id')
            .single();
        if (error)
            throw error;
        return data.id;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error storing secret: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.storeSecret = storeSecret;
/**
 * Retrieve and decrypt a secret from Supabase
 * @param id ID of the secret to retrieve
 * @param applicationId Optional application ID to filter by
 * @returns The decrypted secret value
 */
const getSecret = async (id, applicationId) => {
    try {
        logger_1.default.debug(`========= START getSecret =========`);
        logger_1.default.debug(`Getting secret with ID: ${id}${applicationId ? ` for application: ${applicationId}` : ''}`);
        // Get from Supabase using service key
        const supabase = getSupabaseClient();
        // Get the secret by ID
        const { data, error } = await supabase
            .from('secrets')
            .select('value, metadata')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            logger_1.default.error(`Error retrieving secret from Supabase: ${error.message}`);
            logger_1.default.debug(`Full error object: ${JSON.stringify(error)}`);
            throw error;
        }
        if (!data) {
            logger_1.default.error(`Secret not found with ID: ${id}`);
            throw new Error(`Secret not found with ID: ${id}`);
        }
        // If applicationId is provided and not 'global', verify the credential belongs to the application
        if (applicationId && applicationId !== 'global') {
            logger_1.default.debug(`Verifying credential belongs to application: ${applicationId}`);
            try {
                // Import applicationcredentials dynamically to avoid circular dependencies
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId);
                // Check if the secret ID is in the list of credential IDs for the application
                if (!credentialIds.includes(id)) {
                    logger_1.default.error(`Secret with ID ${id} does not belong to application ${applicationId}`);
                    throw new Error(`Secret with ID ${id} does not belong to application ${applicationId}`);
                }
                logger_1.default.debug(`Verified secret belongs to application ${applicationId}`);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('does not belong to application')) {
                    throw error;
                }
                logger_1.default.error(`Error verifying application credential: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if verification fails
            }
        }
        logger_1.default.debug(`Retrieved secret from Supabase with metadata: ${JSON.stringify(data.metadata)}`);
        logger_1.default.debug(`Value exists: ${!!data.value}`);
        // Decrypt the value
        logger_1.default.debug(`Getting master encryption key`);
        const masterKey = await getMasterEncryptionKey();
        logger_1.default.debug(`Got master encryption key, length: ${masterKey ? masterKey.length : 0}`);
        try {
            logger_1.default.debug(`Starting decryption process`);
            const decryptedBytes = crypto_js_1.AES.decrypt(data.value, masterKey);
            logger_1.default.debug(`Decryption completed, converting to string`);
            const decryptedValue = decryptedBytes.toString(crypto_js_1.enc.Utf8);
            logger_1.default.debug(`Converted to string, length: ${decryptedValue ? decryptedValue.length : 0}`);
            if (!decryptedValue) {
                logger_1.default.error(`Failed to decrypt secret value: empty decrypted string`);
                throw new Error('Failed to decrypt secret value: empty decrypted string');
            }
            logger_1.default.debug(`Successfully decrypted secret value, parsing JSON`);
            const parsedValue = JSON.parse(decryptedValue);
            logger_1.default.debug(`Parsed secret value: ${JSON.stringify(parsedValue)}`);
            logger_1.default.debug(`========= END getSecret =========`);
            return parsedValue;
        }
        catch (decryptError) {
            logger_1.default.error(`Error decrypting secret value: ${(0, utils_1.getErrorMessage)(decryptError)}`);
            logger_1.default.debug(`Full decrypt error: ${JSON.stringify(decryptError)}`);
            throw new Error(`Error decrypting secret value: ${(0, utils_1.getErrorMessage)(decryptError)}`);
        }
    }
    catch (error) {
        logger_1.default.error(`Error retrieving secret: ${(0, utils_1.getErrorMessage)(error)}`);
        logger_1.default.debug(`Full error in getSecret: ${JSON.stringify(error)}`);
        logger_1.default.debug(`========= END getSecret with error =========`);
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error retrieving secret: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.getSecret = getSecret;
/**
 * Retrieve a secret by its key ID
 * @param keyId Key ID of the secret to retrieve
 * @param applicationId Optional application ID to filter by
 * @returns The decrypted secret value
 */
const getSecretByKeyId = async (keyId, applicationId) => {
    try {
        logger_1.default.info(`Getting secret with key ID: ${keyId}${applicationId ? ` for application: ${applicationId}` : ''}`);
        // Get from Supabase using service key
        const supabase = getSupabaseClient();
        // First, get the secret ID by key_id
        const { data: secretData, error: secretError } = await supabase
            .from('secrets')
            .select('id, value, metadata')
            .eq('key_id', keyId)
            .maybeSingle();
        if (secretError) {
            logger_1.default.error(`Error retrieving secret from Supabase: ${secretError.message}`);
            throw secretError;
        }
        if (!secretData) {
            logger_1.default.error(`Secret not found with key ID: ${keyId}`);
            throw new Error(`Secret not found with key ID: ${keyId}`);
        }
        // If applicationId is provided and not 'global', verify the credential belongs to the application
        if (applicationId && applicationId !== 'global') {
            logger_1.default.info(`Verifying credential belongs to application: ${applicationId}`);
            try {
                // Import applicationcredentials dynamically to avoid circular dependencies
                const applicationcredentials = await Promise.resolve().then(() => __importStar(require('../applicationcredentials')));
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId);
                // Check if the secret ID is in the list of credential IDs for the application
                if (!credentialIds.includes(secretData.id)) {
                    logger_1.default.error(`Secret with ID ${secretData.id} does not belong to application ${applicationId}`);
                    throw new Error(`Secret with key ID ${keyId} does not belong to application ${applicationId}`);
                }
                logger_1.default.info(`Verified secret belongs to application ${applicationId}`);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('does not belong to application')) {
                    throw error;
                }
                logger_1.default.error(`Error verifying application credential: ${(0, utils_1.getErrorMessage)(error)}`);
                // Continue even if verification fails
            }
        }
        logger_1.default.info(`Retrieved secret from Supabase with metadata: ${JSON.stringify(secretData.metadata)}`);
        // Decrypt the value
        logger_1.default.info(`Getting master encryption key`);
        const masterKey = await getMasterEncryptionKey();
        logger_1.default.info(`Got master encryption key, decrypting value`);
        try {
            const decryptedBytes = crypto_js_1.AES.decrypt(secretData.value, masterKey);
            const decryptedValue = decryptedBytes.toString(crypto_js_1.enc.Utf8);
            if (!decryptedValue) {
                logger_1.default.error(`Failed to decrypt secret value: empty decrypted string`);
                throw new Error('Failed to decrypt secret value: empty decrypted string');
            }
            logger_1.default.info(`Successfully decrypted secret value, parsing JSON`);
            const parsedValue = JSON.parse(decryptedValue);
            logger_1.default.info(`Parsed secret value: ${JSON.stringify(parsedValue)}`);
            return parsedValue;
        }
        catch (decryptError) {
            logger_1.default.error(`Error decrypting secret value: ${(0, utils_1.getErrorMessage)(decryptError)}`);
            throw new Error(`Error decrypting secret value: ${(0, utils_1.getErrorMessage)(decryptError)}`);
        }
    }
    catch (error) {
        logger_1.default.error(`Error retrieving secret by key ID: ${(0, utils_1.getErrorMessage)(error)}`);
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error retrieving secret by key ID: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.getSecretByKeyId = getSecretByKeyId;
/**
 * Update a secret in Supabase
 * @param id ID of the secret to update
 * @param value New value to encrypt and store
 * @param metadata Optional new metadata to store
 */
const updateSecret = async (id, value, metadata) => {
    try {
        // Get the master encryption key
        const masterKey = await getMasterEncryptionKey();
        // Encrypt the value
        const encryptedValue = crypto_js_1.AES.encrypt(JSON.stringify(value), masterKey).toString();
        // Update in Supabase
        const supabase = getSupabaseClient();
        const updateData = { value: encryptedValue };
        if (metadata)
            updateData.metadata = metadata;
        const { error } = await supabase
            .from('secrets')
            .update(updateData)
            .eq('id', id);
        if (error)
            throw error;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error updating secret: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.updateSecret = updateSecret;
/**
 * Delete a secret from Supabase
 * @param id ID of the secret to delete
 */
const deleteSecret = async (id) => {
    try {
        // Delete from Supabase
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('secrets')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error deleting secret: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.deleteSecret = deleteSecret;
/**
 * List all secrets of a specific type
 * @param type Type of secrets to list
 * @returns Array of secrets with their metadata
 */
const listSecrets = async (type) => {
    try {
        // Get from Supabase
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('secrets')
            .select('id, name, key_id, metadata, created_at, updated_at')
            .eq('type', type);
        if (error)
            throw error;
        return data || [];
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error listing secrets: ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.listSecrets = listSecrets;
//# sourceMappingURL=index.js.map