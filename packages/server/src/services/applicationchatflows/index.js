"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../errors/utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const supabase_1 = require("../../utils/supabase");
// Define interfaces for type safety
/**
 * Get the application ID for a chatflow
 * @param chatflowId The ID of the chatflow
 * @returns The application ID or null if not found
 */
const getApplicationIdForChatflow = async (chatflowId) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('application_chatflows')
            .select('application_id')
            .eq('chatflow_id', chatflowId)
            .maybeSingle();
        if (error)
            throw error;
        return data?.application_id || null;
    }
    catch (error) {
        logger_1.default.error(`[applicationchatflows.getApplicationIdForChatflow] ${(0, utils_1.getErrorMessage)(error)}`);
        return null;
    }
};
/**
 * Get all chatflow IDs for a specific application
 * @param applicationId The ID of the application
 * @returns Array of chatflow IDs
 */
const getChatflowIdsForApplication = async (applicationId) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('application_chatflows')
            .select('chatflow_id')
            .eq('application_id', applicationId);
        if (error)
            throw error;
        return data.map((row) => row.chatflow_id);
    }
    catch (error) {
        logger_1.default.error(`[applicationchatflows.getChatflowIdsForApplication] ${(0, utils_1.getErrorMessage)(error)}`);
        return [];
    }
};
/**
 * Associate a chatflow with an application
 * @param chatflowId The ID of the chatflow
 * @param applicationId The ID of the application
 * @param folderPath Optional folder path within the application
 * @returns True if successful, false otherwise
 */
const associateChatflowWithApplication = async (chatflowId, applicationId, folderPath = '/') => {
    try {
        // Check if mapping already exists
        const { data: existingMapping, error: checkError } = await supabase_1.supabase
            .from('application_chatflows')
            .select('id')
            .eq('chatflow_id', chatflowId)
            .maybeSingle();
        if (checkError)
            throw checkError;
        if (existingMapping) {
            // Update existing mapping
            const { error: updateError } = await supabase_1.supabase
                .from('application_chatflows')
                .update({
                application_id: applicationId,
                folder_path: folderPath,
                updated_at: new Date().toISOString()
            })
                .eq('chatflow_id', chatflowId);
            if (updateError)
                throw updateError;
        }
        else {
            // Create new mapping
            const { error: insertError } = await supabase_1.supabase
                .from('application_chatflows')
                .insert({
                application_id: applicationId,
                chatflow_id: chatflowId,
                folder_path: folderPath
            });
            if (insertError)
                throw insertError;
        }
        return true;
    }
    catch (error) {
        logger_1.default.error(`[applicationchatflows.associateChatflowWithApplication] ${(0, utils_1.getErrorMessage)(error)}`);
        return false;
    }
};
/**
 * Remove a chatflow's association with an application
 * @param chatflowId The ID of the chatflow
 * @returns True if successful, false otherwise
 */
const removeChatflowAssociation = async (chatflowId) => {
    try {
        const { error } = await supabase_1.supabase
            .from('application_chatflows')
            .delete()
            .eq('chatflow_id', chatflowId);
        if (error)
            throw error;
        return true;
    }
    catch (error) {
        logger_1.default.error(`[applicationchatflows.removeChatflowAssociation] ${(0, utils_1.getErrorMessage)(error)}`);
        return false;
    }
};
/**
 * Get the default application ID (Platform Sandbox)
 * @returns The default application ID or null if not found
 */
const getDefaultApplicationId = async () => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('applications')
            .select('id')
            .eq('name', 'Platform Sandbox')
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        return data?.id || null;
    }
    catch (error) {
        logger_1.default.error(`[applicationchatflows.getDefaultApplicationId] ${(0, utils_1.getErrorMessage)(error)}`);
        return null;
    }
};
/**
 * Get all applications a user has access to
 * @param userId User ID
 * @returns Array of applications
 */
const getUserApplications = async (userId) => {
    try {
        // Get applications the user has access to through organization membership
        const { data, error } = await supabase_1.supabase
            .from('organization_users')
            .select(`
                organizations (
                    id,
                    name,
                    applications (
                        id,
                        name,
                        description,
                        logo_url
                    )
                ),
                roles (
                    id,
                    name
                )
            `)
            .eq('user_id', userId);
        if (error)
            throw error;
        const applications = data.flatMap((item) => item.organizations.applications.map((app) => ({
            id: app.id,
            name: app.name,
            description: app.description,
            logo_url: item.organizations.logo_url,
            is_admin: ['app_admin', 'platform_admin'].includes(item.roles.name)
        })));
        // Sort by name
        return applications.sort((a, b) => a.name.localeCompare(b.name));
    }
    catch (error) {
        logger_1.default.error(`[applicationchatflows.getUserApplications] ${(0, utils_1.getErrorMessage)(error)}`);
        return [];
    }
};
/**
 * Check if user is a platform admin
 * @param userId The ID of the user
 * @returns True if the user is a platform admin, false otherwise
 */
const isUserPlatformAdmin = async (userId) => {
    return (0, supabase_1.isPlatformAdmin)(userId);
};
exports.default = {
    getApplicationIdForChatflow,
    getChatflowIdsForApplication,
    associateChatflowWithApplication,
    removeChatflowAssociation,
    getDefaultApplicationId,
    getUserApplications,
    isUserPlatformAdmin
};
//# sourceMappingURL=index.js.map