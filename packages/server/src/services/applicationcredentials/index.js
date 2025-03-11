"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSupabaseConnection = exports.isUserPlatformAdmin = exports.getDefaultApplicationId = exports.removeCredentialAssociation = exports.associateCredentialWithApplication = exports.getCredentialIdsForApplication = exports.getApplicationIdForCredential = void 0;
const utils_1 = require("../../errors/utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const supabase_1 = require("../../utils/supabase");
const index_1 = require("../../index");
// Get the Supabase client from the App instance
const getSupabaseClient = () => {
    const app = (0, index_1.getInstance)();
    if (!app) {
        throw new Error('App instance not available');
    }
    if (!app.Supabase) {
        throw new Error('Supabase client not initialized');
    }
    return app.Supabase;
};
/**
 * Get the application ID for a credential
 * @param credentialId The ID of the credential
 * @returns The application ID or null if not found
 */
const getApplicationIdForCredential = async (credentialId) => {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('application_credentials')
            .select('application_id')
            .eq('credential_id', credentialId)
            .maybeSingle();
        if (error)
            throw error;
        return data?.application_id || null;
    }
    catch (error) {
        logger_1.default.error(`[applicationcredentials.getApplicationIdForCredential] ${(0, utils_1.getErrorMessage)(error)}`);
        return null;
    }
};
exports.getApplicationIdForCredential = getApplicationIdForCredential;
/**
 * Get all credential IDs for an application
 * @param applicationId The ID of the application
 * @param req Optional request object (not used)
 * @returns Array of credential IDs
 */
const getCredentialIdsForApplication = async (applicationId, req) => {
    try {
        logger_1.default.info(`[applicationcredentials.getCredentialIdsForApplication] Getting credential IDs for application: ${applicationId}`);
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('application_credentials')
            .select('credential_id')
            .eq('application_id', applicationId);
        if (error) {
            logger_1.default.error(`[applicationcredentials.getCredentialIdsForApplication] Supabase error: ${JSON.stringify(error)}`);
            throw error;
        }
        const credentialIds = data?.map((item) => item.credential_id) || [];
        logger_1.default.info(`[applicationcredentials.getCredentialIdsForApplication] Found ${credentialIds.length} credential IDs: ${JSON.stringify(credentialIds)}`);
        return credentialIds;
    }
    catch (error) {
        logger_1.default.error(`[applicationcredentials.getCredentialIdsForApplication] ${(0, utils_1.getErrorMessage)(error)}`);
        return [];
    }
};
exports.getCredentialIdsForApplication = getCredentialIdsForApplication;
/**
 * Associate a credential with an application
 * @param credentialId The ID of the credential
 * @param applicationId The ID of the application
 * @returns True if successful, false otherwise
 */
const associateCredentialWithApplication = async (credentialId, applicationId) => {
    try {
        logger_1.default.info(`[applicationcredentials.associateCredentialWithApplication] Associating credential ${credentialId} with application ${applicationId}`);
        // Check if the association already exists
        const supabase = getSupabaseClient();
        const { data: existingAssociation, error: checkError } = await supabase
            .from('application_credentials')
            .select('*')
            .eq('credential_id', credentialId)
            .eq('application_id', applicationId)
            .maybeSingle();
        if (checkError) {
            logger_1.default.error(`[applicationcredentials.associateCredentialWithApplication] Error checking existing association: ${(0, utils_1.getErrorMessage)(checkError)}`);
            throw checkError;
        }
        // If the association already exists, return true
        if (existingAssociation) {
            logger_1.default.info(`[applicationcredentials.associateCredentialWithApplication] Association already exists`);
            return true;
        }
        // Create the association
        const { error: insertError } = await supabase
            .from('application_credentials')
            .insert({
            credential_id: credentialId,
            application_id: applicationId
        });
        if (insertError) {
            logger_1.default.error(`[applicationcredentials.associateCredentialWithApplication] Error creating association: ${(0, utils_1.getErrorMessage)(insertError)}`);
            throw insertError;
        }
        logger_1.default.info(`[applicationcredentials.associateCredentialWithApplication] Association created successfully`);
        return true;
    }
    catch (error) {
        logger_1.default.error(`[applicationcredentials.associateCredentialWithApplication] ${(0, utils_1.getErrorMessage)(error)}`);
        return false;
    }
};
exports.associateCredentialWithApplication = associateCredentialWithApplication;
/**
 * Remove a credential's association with any application
 * @param credentialId The ID of the credential
 * @returns True if successful, false otherwise
 */
const removeCredentialAssociation = async (credentialId) => {
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('application_credentials')
            .delete()
            .eq('credential_id', credentialId);
        if (error)
            throw error;
        return true;
    }
    catch (error) {
        logger_1.default.error(`[applicationcredentials.removeCredentialAssociation] ${(0, utils_1.getErrorMessage)(error)}`);
        return false;
    }
};
exports.removeCredentialAssociation = removeCredentialAssociation;
/**
 * Get the default application ID
 * @returns The default application ID or null if not found
 */
const getDefaultApplicationId = async () => {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('applications')
            .select('id')
            .eq('is_default', true)
            .maybeSingle();
        if (error)
            throw error;
        return data?.id || null;
    }
    catch (error) {
        logger_1.default.error(`[applicationcredentials.getDefaultApplicationId] ${(0, utils_1.getErrorMessage)(error)}`);
        return null;
    }
};
exports.getDefaultApplicationId = getDefaultApplicationId;
/**
 * Check if a user is a platform admin
 * @param userId The ID of the user
 * @returns True if the user is a platform admin, false otherwise
 */
const isUserPlatformAdmin = async (userId) => {
    return (0, supabase_1.isPlatformAdmin)(userId);
};
exports.isUserPlatformAdmin = isUserPlatformAdmin;
/**
 * Test the Supabase connection
 * @returns True if successful, false otherwise
 */
const testSupabaseConnection = async () => {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('application_credentials')
            .select('credential_id')
            .limit(1);
        if (error) {
            logger_1.default.error(`[applicationcredentials.testSupabaseConnection] Supabase error: ${JSON.stringify(error)}`);
            return false;
        }
        logger_1.default.info(`[applicationcredentials.testSupabaseConnection] Supabase connection successful, found ${data?.length || 0} records`);
        return true;
    }
    catch (error) {
        logger_1.default.error(`[applicationcredentials.testSupabaseConnection] ${(0, utils_1.getErrorMessage)(error)}`);
        return false;
    }
};
exports.testSupabaseConnection = testSupabaseConnection;
// Export as default object for consistency with other services
exports.default = {
    getApplicationIdForCredential: exports.getApplicationIdForCredential,
    getCredentialIdsForApplication: exports.getCredentialIdsForApplication,
    associateCredentialWithApplication: exports.associateCredentialWithApplication,
    removeCredentialAssociation: exports.removeCredentialAssociation,
    getDefaultApplicationId: exports.getDefaultApplicationId,
    isUserPlatformAdmin: exports.isUserPlatformAdmin,
    testSupabaseConnection: exports.testSupabaseConnection
};
//# sourceMappingURL=index.js.map