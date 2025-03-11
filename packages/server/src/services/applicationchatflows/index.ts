import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'
import { supabase, isPlatformAdmin } from '../../utils/supabase'
import { IApplication } from '../../Interface'
// Define interfaces for type safety

/**
 * Get the application ID for a chatflow
 * @param chatflowId The ID of the chatflow
 * @returns The application ID or null if not found
 */
const getApplicationIdForChatflow = async (chatflowId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('application_chatflows')
            .select('application_id')
            .eq('chatflow_id', chatflowId)
            .maybeSingle()
        
        if (error) throw error
        
        return data?.application_id || null
    } catch (error) {
        logger.error(`[applicationchatflows.getApplicationIdForChatflow] ${getErrorMessage(error)}`)
        return null
    }
}

/**
 * Get all chatflow IDs for a specific application
 * @param applicationId The ID of the application
 * @returns Array of chatflow IDs
 */
const getChatflowIdsForApplication = async (applicationId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('application_chatflows')
            .select('chatflow_id')
            .eq('application_id', applicationId)
        
        if (error) throw error
        
        return data.map((row: { chatflow_id: string }) => row.chatflow_id)
    } catch (error) {
        logger.error(`[applicationchatflows.getChatflowIdsForApplication] ${getErrorMessage(error)}`)
        return []
    }
}

/**
 * Associate a chatflow with an application
 * @param chatflowId The ID of the chatflow
 * @param applicationId The ID of the application
 * @param folderPath Optional folder path within the application
 * @returns True if successful, false otherwise
 */
const associateChatflowWithApplication = async (chatflowId: string, applicationId: string, folderPath: string = '/'): Promise<boolean> => {
    try {
        // Check if mapping already exists
        const { data: existingMapping, error: checkError } = await supabase
            .from('application_chatflows')
            .select('id')
            .eq('chatflow_id', chatflowId)
            .maybeSingle()
        
        if (checkError) throw checkError
        
        if (existingMapping) {
            // Update existing mapping
            const { error: updateError } = await supabase
                .from('application_chatflows')
                .update({
                    application_id: applicationId,
                    folder_path: folderPath,
                    updated_at: new Date().toISOString()
                })
                .eq('chatflow_id', chatflowId)
            
            if (updateError) throw updateError
        } else {
            // Create new mapping
            const { error: insertError } = await supabase
                .from('application_chatflows')
                .insert({
                    application_id: applicationId,
                    chatflow_id: chatflowId,
                    folder_path: folderPath
                })
            
            if (insertError) throw insertError
        }
        
        return true
    } catch (error) {
        logger.error(`[applicationchatflows.associateChatflowWithApplication] ${getErrorMessage(error)}`)
        return false
    }
}

/**
 * Remove a chatflow's association with an application
 * @param chatflowId The ID of the chatflow
 * @returns True if successful, false otherwise
 */
const removeChatflowAssociation = async (chatflowId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('application_chatflows')
            .delete()
            .eq('chatflow_id', chatflowId)
        
        if (error) throw error
        
        return true
    } catch (error) {
        logger.error(`[applicationchatflows.removeChatflowAssociation] ${getErrorMessage(error)}`)
        return false
    }
}

/**
 * Get the default application ID (Platform Sandbox)
 * @returns The default application ID or null if not found
 */
const getDefaultApplicationId = async (): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('id')
            .eq('name', 'Platform Sandbox')
            .limit(1)
            .maybeSingle()
        
        if (error) throw error
        
        return data?.id || null
    } catch (error) {
        logger.error(`[applicationchatflows.getDefaultApplicationId] ${getErrorMessage(error)}`)
        return null
    }
}

/**
 * Get all applications a user has access to
 * @param userId User ID
 * @returns Array of applications
 */
const getUserApplications = async (userId: string): Promise<IApplication[]> => {
    try {
        // Get applications the user has access to through organization membership
        const { data, error } = await supabase
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
            .eq('user_id', userId)
        
        if (error) throw error
        
        // Extract applications from the nested data
        interface OrganizationData {
            organizations: {
                id: string;
                name: string;
                applications: Array<{
                    id: string;
                    name: string;
                    description: string | null;
                    logo_url: string | null;
                }>;
                logo_url?: string | null;
            };
            roles: {
                id: string;
                name: string;
            };
        }

        const applications: IApplication[] = data.flatMap((item: OrganizationData) => 
            item.organizations.applications.map((app: {
                id: string;
                name: string;
                description: string | null;
                logo_url: string | null;
            }) => ({
                id: app.id,
                name: app.name,
                description: app.description,
                logo_url: item.organizations.logo_url,
                is_admin: ['app_admin', 'platform_admin'].includes(item.roles.name)
            }))
        )
        
        // Sort by name
        return applications.sort((a: IApplication, b: IApplication) => a.name.localeCompare(b.name))
    } catch (error) {
        logger.error(`[applicationchatflows.getUserApplications] ${getErrorMessage(error)}`)
        return []
    }
}

/**
 * Check if user is a platform admin
 * @param userId The ID of the user
 * @returns True if the user is a platform admin, false otherwise
 */
const isUserPlatformAdmin = async (userId: string): Promise<boolean> => {
    return isPlatformAdmin(userId)
}

export default {
    getApplicationIdForChatflow,
    getChatflowIdsForApplication,
    associateChatflowWithApplication,
    removeChatflowAssociation,
    getDefaultApplicationId,
    getUserApplications,
    isUserPlatformAdmin
} 