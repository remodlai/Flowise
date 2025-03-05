import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'
import { supabase, isPlatformAdmin } from '../../utils/supabase'

// Define interfaces for type safety
interface IApplication {
    id: string
    name: string
    description: string | null
    logo_url: string | null
    is_admin: boolean
}

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
 * @param userId The ID of the user
 * @returns Array of application objects
 */
const getUserApplications = async (userId: string): Promise<IApplication[]> => {
    try {
        // Get applications where the user has admin or member role
        const { data, error } = await supabase
            .from('user_custom_roles')
            .select(`
                resource_id,
                custom_roles!inner(name),
                applications!inner(id, name, description, logo_url)
            `)
            .eq('user_id', userId)
            .eq('resource_type', 'application')
        
        if (error) throw error
        
        // Format the response
        const applications = data.map((item: any) => ({
            id: item.applications.id,
            name: item.applications.name,
            description: item.applications.description,
            logo_url: item.applications.logo_url,
            is_admin: ['app_admin', 'platform_admin'].includes(item.custom_roles.name)
        }))
        
        // Sort by name
        return applications.sort((a, b) => a.name.localeCompare(b.name))
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