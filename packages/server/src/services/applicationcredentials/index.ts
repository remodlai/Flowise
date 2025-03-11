import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'
import { isPlatformAdmin } from '../../utils/supabase'
import { getInstance } from '../../index'

// Get the Supabase client from the App instance
const getSupabaseClient = () => {
    const app = getInstance()
    if (!app) {
        throw new Error('App instance not available')
    }
    if (!app.Supabase) {
        throw new Error('Supabase client not initialized')
    }
    return app.Supabase
}

/**
 * Get the application ID for a credential
 * @param credentialId The ID of the credential
 * @returns The application ID or null if not found
 */
export const getApplicationIdForCredential = async (credentialId: string): Promise<string | null> => {
    try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('application_credentials')
            .select('application_id')
            .eq('credential_id', credentialId)
            .maybeSingle()

        if (error) throw error

        return data?.application_id || null
    } catch (error) {
        logger.error(`[applicationcredentials.getApplicationIdForCredential] ${getErrorMessage(error)}`)
        return null
    }
}

/**
 * Get all credential IDs for an application
 * @param applicationId The ID of the application
 * @param req Optional request object (not used)
 * @returns Array of credential IDs
 */
export const getCredentialIdsForApplication = async (applicationId: string, req?: any): Promise<string[]> => {
    try {
        logger.info(`[applicationcredentials.getCredentialIdsForApplication] Getting credential IDs for application: ${applicationId}`)
        
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('application_credentials')
            .select('credential_id')
            .eq('application_id', applicationId)

        if (error) {
            logger.error(`[applicationcredentials.getCredentialIdsForApplication] Supabase error: ${JSON.stringify(error)}`)
            throw error
        }

        const credentialIds = data?.map((item: { credential_id: string }) => item.credential_id) || []
        logger.info(`[applicationcredentials.getCredentialIdsForApplication] Found ${credentialIds.length} credential IDs: ${JSON.stringify(credentialIds)}`)
        
        return credentialIds
    } catch (error) {
        logger.error(`[applicationcredentials.getCredentialIdsForApplication] ${getErrorMessage(error)}`)
        return []
    }
}

/**
 * Associate a credential with an application
 * @param credentialId The ID of the credential
 * @param applicationId The ID of the application
 * @returns True if successful, false otherwise
 */
export const associateCredentialWithApplication = async (
    credentialId: string,
    applicationId: string
): Promise<boolean> => {
    try {
        logger.info(`[applicationcredentials.associateCredentialWithApplication] Associating credential ${credentialId} with application ${applicationId}`)
        
        // Check if the association already exists
        const supabase = getSupabaseClient()
        const { data: existingAssociation, error: checkError } = await supabase
            .from('application_credentials')
            .select('*')
            .eq('credential_id', credentialId)
            .eq('application_id', applicationId)
            .maybeSingle()
        
        if (checkError) {
            logger.error(`[applicationcredentials.associateCredentialWithApplication] Error checking existing association: ${getErrorMessage(checkError)}`)
            throw checkError
        }
        
        // If the association already exists, return true
        if (existingAssociation) {
            logger.info(`[applicationcredentials.associateCredentialWithApplication] Association already exists`)
            return true
        }
        
        // Create the association
        const { error: insertError } = await supabase
            .from('application_credentials')
            .insert({
                credential_id: credentialId,
                application_id: applicationId
            })
        
        if (insertError) {
            logger.error(`[applicationcredentials.associateCredentialWithApplication] Error creating association: ${getErrorMessage(insertError)}`)
            throw insertError
        }
        
        logger.info(`[applicationcredentials.associateCredentialWithApplication] Association created successfully`)
        return true
    } catch (error) {
        logger.error(`[applicationcredentials.associateCredentialWithApplication] ${getErrorMessage(error)}`)
        return false
    }
}

/**
 * Remove a credential's association with any application
 * @param credentialId The ID of the credential
 * @returns True if successful, false otherwise
 */
export const removeCredentialAssociation = async (credentialId: string): Promise<boolean> => {
    try {
        const supabase = getSupabaseClient()
        const { error } = await supabase
            .from('application_credentials')
            .delete()
            .eq('credential_id', credentialId)
        
        if (error) throw error
        
        return true
    } catch (error) {
        logger.error(`[applicationcredentials.removeCredentialAssociation] ${getErrorMessage(error)}`)
        return false
    }
}

/**
 * Get the default application ID
 * @returns The default application ID or null if not found
 */
export const getDefaultApplicationId = async (): Promise<string | null> => {
    try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('applications')
            .select('id')
            .eq('is_default', true)
            .maybeSingle()
        
        if (error) throw error
        
        return data?.id || null
    } catch (error) {
        logger.error(`[applicationcredentials.getDefaultApplicationId] ${getErrorMessage(error)}`)
        return null
    }
}

/**
 * Check if a user is a platform admin
 * @param userId The ID of the user
 * @returns True if the user is a platform admin, false otherwise
 */
export const isUserPlatformAdmin = async (userId: string): Promise<boolean> => {
    return isPlatformAdmin(userId)
}

/**
 * Test the Supabase connection
 * @returns True if successful, false otherwise
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('application_credentials')
            .select('credential_id')
            .limit(1)
        
        if (error) {
            logger.error(`[applicationcredentials.testSupabaseConnection] Supabase error: ${JSON.stringify(error)}`)
            return false
        }
        
        logger.info(`[applicationcredentials.testSupabaseConnection] Supabase connection successful, found ${data?.length || 0} records`)
        return true
    } catch (error) {
        logger.error(`[applicationcredentials.testSupabaseConnection] ${getErrorMessage(error)}`)
        return false
    }
}

// Export as default object for consistency with other services
export default {
    getApplicationIdForCredential,
    getCredentialIdsForApplication,
    associateCredentialWithApplication,
    removeCredentialAssociation,
    getDefaultApplicationId,
    isUserPlatformAdmin,
    testSupabaseConnection
} 