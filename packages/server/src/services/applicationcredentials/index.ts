import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'
import { supabase, isPlatformAdmin } from '../../utils/supabase'

/**
 * Get the application ID for a credential
 * @param credentialId The ID of the credential
 * @returns The application ID or null if not found
 */
export const getApplicationIdForCredential = async (credentialId: string): Promise<string | null> => {
    try {
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
 * @returns Array of credential IDs
 */
export const getCredentialIdsForApplication = async (applicationId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('application_credentials')
            .select('credential_id')
            .eq('application_id', applicationId)

        if (error) throw error

        return data?.map((item: { credential_id: string }) => item.credential_id) || []
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
        // Check if mapping already exists
        const { data: existingMapping, error: checkError } = await supabase
            .from('application_credentials')
            .select('id')
            .eq('credential_id', credentialId)
            .maybeSingle()

        if (checkError) throw checkError

        if (existingMapping) {
            // Update existing mapping
            const { error: updateError } = await supabase
                .from('application_credentials')
                .update({ application_id: applicationId, updated_at: new Date().toISOString() })
                .eq('credential_id', credentialId)

            if (updateError) throw updateError
        } else {
            // Create new mapping
            const { error: insertError } = await supabase.from('application_credentials').insert({
                credential_id: credentialId,
                application_id: applicationId
            })

            if (insertError) throw insertError
        }

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
        const { error } = await supabase.from('application_credentials').delete().eq('credential_id', credentialId)

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
        const { data, error } = await supabase
            .from('applications')
            .select('id')
            .eq('name', 'Platform Sandbox')
            .limit(1)
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

// Export as default object for consistency with other services
export default {
    getApplicationIdForCredential,
    getCredentialIdsForApplication,
    associateCredentialWithApplication,
    removeCredentialAssociation,
    getDefaultApplicationId,
    isUserPlatformAdmin
} 