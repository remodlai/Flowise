import { createClient } from '@supabase/supabase-js'
import { supabase, isPlatformAdmin } from '../../utils/supabase'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'

/**
 * Get the application ID for a tool
 * @param toolId
 * @returns
 */
export const getApplicationIdForTool = async (toolId: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('application_tools')
            .select('application_id')
            .eq('tool_id', toolId)
            .single()

        if (error) {
            logger.error('Error getting application ID for tool:', error)
            return null
        }

        return data?.application_id || null
    } catch (error) {
        logger.error('Error in getApplicationIdForTool:', error)
        return null
    }
}

/**
 * Get all tool IDs for an application
 * @param applicationId
 * @returns
 */
export const getToolIdsForApplication = async (applicationId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('application_tools')
            .select('tool_id')
            .eq('application_id', applicationId)

        if (error) {
            logger.error('Error getting tool IDs for application:', error)
            return []
        }

        return data?.map((item) => item.tool_id) || []
    } catch (error) {
        logger.error('Error in getToolIdsForApplication:', error)
        return []
    }
}

/**
 * Associate a tool with an application
 * @param toolId
 * @param applicationId
 * @returns
 */
export const associateToolWithApplication = async (toolId: string, applicationId: string): Promise<boolean> => {
    try {
        // Check if mapping already exists
        const { data: existingMapping, error: checkError } = await supabase
            .from('application_tools')
            .select('id, application_id')
            .eq('tool_id', toolId)
            .maybeSingle()

        if (checkError) {
            logger.error('Error checking existing tool mapping:', checkError)
            return false
        }

        if (existingMapping) {
            // Update existing mapping if application_id is different
            if (existingMapping.application_id !== applicationId) {
                const { error: updateError } = await supabase
                    .from('application_tools')
                    .update({ application_id: applicationId })
                    .eq('id', existingMapping.id)

                if (updateError) {
                    logger.error('Error updating tool application mapping:', updateError)
                    return false
                }
            }
        } else {
            // Create new mapping
            const { error: insertError } = await supabase
                .from('application_tools')
                .insert({ tool_id: toolId, application_id: applicationId })

            if (insertError) {
                logger.error('Error creating tool application mapping:', insertError)
                return false
            }
        }

        return true
    } catch (error) {
        logger.error('Error in associateToolWithApplication:', error)
        return false
    }
}

/**
 * Remove a tool's association with any application
 * @param toolId
 * @returns
 */
export const removeToolAssociation = async (toolId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('application_tools')
            .delete()
            .eq('tool_id', toolId)

        if (error) {
            logger.error('Error removing tool association:', error)
            return false
        }

        return true
    } catch (error) {
        logger.error('Error in removeToolAssociation:', error)
        return false
    }
}

/**
 * Get the default application ID (Platform Sandbox)
 * @returns
 */
export const getDefaultApplicationId = async (): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('id')
            .eq('name', 'Platform Sandbox')
            .single()

        if (error) {
            logger.error('Error getting default application ID:', error)
            return null
        }

        return data?.id || null
    } catch (error) {
        logger.error('Error in getDefaultApplicationId:', error)
        return null
    }
}

/**
 * Get all applications for a user
 * @param userId
 * @returns
 */
export const getUserApplications = async (userId: string): Promise<any[]> => {
    try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

        if (userError) {
            logger.error('Error getting user data:', userError)
            return []
        }

        const isPlatformAdminUser = userData?.user?.app_metadata?.role === 'platform_admin' || 
                               userData?.user?.user_metadata?.role === 'superadmin'

        if (isPlatformAdminUser) {
            // Platform admins can see all applications
            const { data: allApps, error: appsError } = await supabase
                .from('applications')
                .select('*')
                .order('name')

            if (appsError) {
                logger.error('Error getting all applications:', appsError)
                return []
            }

            return allApps || []
        } else {
            // Regular users can only see applications they have access to
            const appAccess = userData?.user?.app_metadata?.app_access || []
            
            if (appAccess.length === 0) return []

            const { data: userApps, error: appsError } = await supabase
                .from('applications')
                .select('*')
                .in('id', appAccess)
                .order('name')

            if (appsError) {
                logger.error('Error getting user applications:', appsError)
                return []
            }

            return userApps || []
        }
    } catch (error) {
        logger.error('Error in getUserApplications:', error)
        return []
    }
}

/**
 * Check if a user is a platform admin
 * @param userId
 * @returns
 */
export const isUserPlatformAdmin = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.auth.admin.getUserById(userId)

        if (error) {
            logger.error('Error checking if user is platform admin:', error)
            return false
        }

        return data?.user?.app_metadata?.role === 'platform_admin' || 
               data?.user?.user_metadata?.role === 'superadmin'
    } catch (error) {
        logger.error('Error in isUserPlatformAdmin:', error)
        return false
    }
}

export default {
    getApplicationIdForTool,
    getToolIdsForApplication,
    associateToolWithApplication,
    removeToolAssociation,
    getDefaultApplicationId,
    getUserApplications,
    isUserPlatformAdmin
} 