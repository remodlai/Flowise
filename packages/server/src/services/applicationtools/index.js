"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserPlatformAdmin = exports.getUserApplications = exports.getDefaultApplicationId = exports.removeToolAssociation = exports.associateToolWithApplication = exports.getToolIdsForApplication = exports.getApplicationIdForTool = void 0;
const supabase_1 = require("../../utils/supabase");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Get the application ID for a tool
 * @param toolId
 * @returns
 */
const getApplicationIdForTool = async (toolId) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('application_tools')
            .select('application_id')
            .eq('tool_id', toolId)
            .single();
        if (error) {
            logger_1.default.error('Error getting application ID for tool:', error);
            return null;
        }
        return data?.application_id || null;
    }
    catch (error) {
        logger_1.default.error('Error in getApplicationIdForTool:', error);
        return null;
    }
};
exports.getApplicationIdForTool = getApplicationIdForTool;
/**
 * Get all tool IDs for an application
 * @param applicationId
 * @returns
 */
const getToolIdsForApplication = async (applicationId) => {
    try {
        logger_1.default.debug(`Getting tool IDs for application: ${applicationId}`);
        const { data, error } = await supabase_1.supabase
            .from('application_tools')
            .select('tool_id')
            .eq('application_id', applicationId);
        if (error) {
            logger_1.default.error('Error getting tool IDs for application:', error);
            return [];
        }
        return data?.map((item) => item.tool_id) || [];
    }
    catch (error) {
        logger_1.default.error('Error in getToolIdsForApplication:', error);
        return [];
    }
};
exports.getToolIdsForApplication = getToolIdsForApplication;
/**
 * Associate a tool with an application
 * @param toolId
 * @param applicationId
 * @returns
 */
const associateToolWithApplication = async (toolId, applicationId) => {
    try {
        // Check if mapping already exists
        const { data: existingMapping, error: checkError } = await supabase_1.supabase
            .from('application_tools')
            .select('id, application_id')
            .eq('tool_id', toolId)
            .maybeSingle();
        if (checkError) {
            logger_1.default.error('Error checking existing tool mapping:', checkError);
            return false;
        }
        if (existingMapping) {
            // Update existing mapping if application_id is different
            if (existingMapping.application_id !== applicationId) {
                const { error: updateError } = await supabase_1.supabase
                    .from('application_tools')
                    .update({ application_id: applicationId })
                    .eq('id', existingMapping.id);
                if (updateError) {
                    logger_1.default.error('Error updating tool application mapping:', updateError);
                    return false;
                }
            }
        }
        else {
            // Create new mapping
            const { error: insertError } = await supabase_1.supabase
                .from('application_tools')
                .insert({ tool_id: toolId, application_id: applicationId });
            if (insertError) {
                logger_1.default.error('Error creating tool application mapping:', insertError);
                return false;
            }
        }
        return true;
    }
    catch (error) {
        logger_1.default.error('Error in associateToolWithApplication:', error);
        return false;
    }
};
exports.associateToolWithApplication = associateToolWithApplication;
/**
 * Remove a tool's association with any application
 * @param toolId
 * @returns
 */
const removeToolAssociation = async (toolId) => {
    try {
        const { error } = await supabase_1.supabase
            .from('application_tools')
            .delete()
            .eq('tool_id', toolId);
        if (error) {
            logger_1.default.error('Error removing tool association:', error);
            return false;
        }
        return true;
    }
    catch (error) {
        logger_1.default.error('Error in removeToolAssociation:', error);
        return false;
    }
};
exports.removeToolAssociation = removeToolAssociation;
/**
 * Get the default application ID (Platform Sandbox)
 * @returns
 */
const getDefaultApplicationId = async () => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('applications')
            .select('id')
            .eq('name', 'Platform Sandbox')
            .single();
        if (error) {
            logger_1.default.error('Error getting default application ID:', error);
            return null;
        }
        return data?.id || null;
    }
    catch (error) {
        logger_1.default.error('Error in getDefaultApplicationId:', error);
        return null;
    }
};
exports.getDefaultApplicationId = getDefaultApplicationId;
/**
 * Get all applications for a user
 * @param userId
 * @returns
 */
const getUserApplications = async (userId) => {
    try {
        const { data: userData, error: userError } = await supabase_1.supabase.auth.admin.getUserById(userId);
        if (userError) {
            logger_1.default.error('Error getting user data:', userError);
            return [];
        }
        const isPlatformAdminUser = userData?.user?.app_metadata?.role === 'platform_admin' ||
            userData?.user?.user_metadata?.role === 'superadmin';
        if (isPlatformAdminUser) {
            // Platform admins can see all applications
            const { data: allApps, error: appsError } = await supabase_1.supabase
                .from('applications')
                .select('*')
                .order('name');
            if (appsError) {
                logger_1.default.error('Error getting all applications:', appsError);
                return [];
            }
            return allApps || [];
        }
        else {
            // Regular users can only see applications they have access to
            const appAccess = userData?.user?.app_metadata?.app_access || [];
            if (appAccess.length === 0)
                return [];
            const { data: userApps, error: appsError } = await supabase_1.supabase
                .from('applications')
                .select('*')
                .in('id', appAccess)
                .order('name');
            if (appsError) {
                logger_1.default.error('Error getting user applications:', appsError);
                return [];
            }
            return userApps || [];
        }
    }
    catch (error) {
        logger_1.default.error('Error in getUserApplications:', error);
        return [];
    }
};
exports.getUserApplications = getUserApplications;
/**
 * Check if a user is a platform admin
 * @param userId
 * @returns
 */
const isUserPlatformAdmin = async (userId) => {
    try {
        const { data, error } = await supabase_1.supabase.auth.admin.getUserById(userId);
        if (error) {
            logger_1.default.error('Error checking if user is platform admin:', error);
            return false;
        }
        return data?.user?.app_metadata?.role === 'platform_admin' ||
            data?.user?.user_metadata?.role === 'superadmin';
    }
    catch (error) {
        logger_1.default.error('Error in isUserPlatformAdmin:', error);
        return false;
    }
};
exports.isUserPlatformAdmin = isUserPlatformAdmin;
exports.default = {
    getApplicationIdForTool: exports.getApplicationIdForTool,
    getToolIdsForApplication: exports.getToolIdsForApplication,
    associateToolWithApplication: exports.associateToolWithApplication,
    removeToolAssociation: exports.removeToolAssociation,
    getDefaultApplicationId: exports.getDefaultApplicationId,
    getUserApplications: exports.getUserApplications,
    isUserPlatformAdmin: exports.isUserPlatformAdmin
};
//# sourceMappingURL=index.js.map