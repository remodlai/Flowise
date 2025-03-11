import { createClient } from '@supabase/supabase-js'
import { AES, enc } from 'crypto-js'
import { randomBytes } from 'crypto'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'
import { getEncryptionKey } from '../../utils/platformSettings'
import logger from '../../utils/logger'
import { getInstance } from '../../index'

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
    const app = getInstance()
    if (!app) {
        throw new Error('App instance not available')
    }
    // Use the direct Supabase property instead of the getter method
    if (!app.Supabase) {
        throw new Error('Supabase client not initialized')
    }
    return app.Supabase
}

/**
 * Get the master encryption key
 * @returns The master encryption key
 */
const getMasterEncryptionKey = async (): Promise<string> => {
    try {
        return await getEncryptionKey()
    } catch (error) {
        logger.error(`Error getting master encryption key: ${getErrorMessage(error)}`)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to retrieve encryption key from platform settings. Please ensure the ENCRYPTION_KEY is set in platform settings.`
        )
    }
}

/**
 * Store a secret in Supabase
 * @param name Name of the secret
 * @param type Type of secret (api_key, credential, etc.)
 * @param value Value to encrypt and store
 * @param metadata Additional metadata
 * @param keyId Optional key ID for API keys
 * @returns The ID of the stored secret
 */
export const storeSecret = async (
    name: string,
    type: string,
    value: any,
    metadata: any = {},
    keyId?: string
): Promise<string> => {
    try {
        logger.debug(`Storing secret: ${name}, type: ${type}`)
        
        // Get the master encryption key
        const masterKey = await getMasterEncryptionKey()
        
        // Encrypt the value
        const encryptedValue = AES.encrypt(JSON.stringify(value), masterKey).toString()
        
        // Store in Supabase
        const supabase = getSupabaseClient()
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
            .single()
        
        if (error) throw error
        
        return data.id
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error storing secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Retrieve and decrypt a secret from Supabase
 * @param id ID of the secret to retrieve
 * @param applicationId Optional application ID to filter by
 * @returns The decrypted secret value
 */
export const getSecret = async (id: string, applicationId?: string): Promise<any> => {
    try {
        logger.debug(`========= START getSecret =========`)
        logger.debug(`Getting secret with ID: ${id}${applicationId ? ` for application: ${applicationId}` : ''}`)
        
        // Get from Supabase using service key
        const supabase = getSupabaseClient()
        
        // Get the secret by ID
        const { data, error } = await supabase
            .from('secrets')
            .select('value, metadata')
            .eq('id', id)
            .maybeSingle();
        
        if (error) {
            logger.error(`Error retrieving secret from Supabase: ${error.message}`)
            logger.debug(`Full error object: ${JSON.stringify(error)}`)
            throw error
        }
        
        if (!data) {
            logger.error(`Secret not found with ID: ${id}`)
            throw new Error(`Secret not found with ID: ${id}`)
        }
        
        // If applicationId is provided and not 'global', verify the credential belongs to the application
        if (applicationId && applicationId !== 'global') {
            logger.debug(`Verifying credential belongs to application: ${applicationId}`)
            
            try {
                // Import applicationcredentials dynamically to avoid circular dependencies
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                
                // Check if the secret ID is in the list of credential IDs for the application
                if (!credentialIds.includes(id)) {
                    logger.error(`Secret with ID ${id} does not belong to application ${applicationId}`)
                    throw new Error(`Secret with ID ${id} does not belong to application ${applicationId}`)
                }
                
                logger.debug(`Verified secret belongs to application ${applicationId}`)
            } catch (error) {
                if (error instanceof Error && error.message.includes('does not belong to application')) {
                    throw error
                }
                logger.error(`Error verifying application credential: ${getErrorMessage(error)}`)
                // Continue even if verification fails
            }
        }
        
        logger.debug(`Retrieved secret from Supabase with metadata: ${JSON.stringify(data.metadata)}`)
        logger.debug(`Value exists: ${!!data.value}`)
        
        // Decrypt the value
        logger.debug(`Getting master encryption key`)
        const masterKey = await getMasterEncryptionKey()
        logger.debug(`Got master encryption key, length: ${masterKey ? masterKey.length : 0}`)
        
        try {
            logger.debug(`Starting decryption process`)
            const decryptedBytes = AES.decrypt(data.value, masterKey)
            logger.debug(`Decryption completed, converting to string`)
            const decryptedValue = decryptedBytes.toString(enc.Utf8)
            logger.debug(`Converted to string, length: ${decryptedValue ? decryptedValue.length : 0}`)
            
            if (!decryptedValue) {
                logger.error(`Failed to decrypt secret value: empty decrypted string`)
                throw new Error('Failed to decrypt secret value: empty decrypted string')
            }
            
            logger.debug(`Successfully decrypted secret value, parsing JSON`)
            const parsedValue = JSON.parse(decryptedValue)
            logger.debug(`Parsed secret value: ${JSON.stringify(parsedValue)}`)
            logger.debug(`========= END getSecret =========`)
            
            return parsedValue
        } catch (decryptError) {
            logger.error(`Error decrypting secret value: ${getErrorMessage(decryptError)}`)
            logger.debug(`Full decrypt error: ${JSON.stringify(decryptError)}`)
            throw new Error(`Error decrypting secret value: ${getErrorMessage(decryptError)}`)
        }
    } catch (error) {
        logger.error(`Error retrieving secret: ${getErrorMessage(error)}`)
        logger.debug(`Full error in getSecret: ${JSON.stringify(error)}`)
        logger.debug(`========= END getSecret with error =========`)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error retrieving secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Retrieve a secret by its key ID
 * @param keyId Key ID of the secret to retrieve
 * @param applicationId Optional application ID to filter by
 * @returns The decrypted secret value
 */
export const getSecretByKeyId = async (keyId: string, applicationId?: string): Promise<any> => {
    try {
        logger.info(`Getting secret with key ID: ${keyId}${applicationId ? ` for application: ${applicationId}` : ''}`)
        
        // Get from Supabase using service key
        const supabase = getSupabaseClient()
        
        // First, get the secret ID by key_id
        const { data: secretData, error: secretError } = await supabase
            .from('secrets')
            .select('id, value, metadata')
            .eq('key_id', keyId)
            .maybeSingle();
        
        if (secretError) {
            logger.error(`Error retrieving secret from Supabase: ${secretError.message}`)
            throw secretError
        }
        
        if (!secretData) {
            logger.error(`Secret not found with key ID: ${keyId}`)
            throw new Error(`Secret not found with key ID: ${keyId}`)
        }
        
        // If applicationId is provided and not 'global', verify the credential belongs to the application
        if (applicationId && applicationId !== 'global') {
            logger.info(`Verifying credential belongs to application: ${applicationId}`)
            
            try {
                // Import applicationcredentials dynamically to avoid circular dependencies
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                
                // Check if the secret ID is in the list of credential IDs for the application
                if (!credentialIds.includes(secretData.id)) {
                    logger.error(`Secret with ID ${secretData.id} does not belong to application ${applicationId}`)
                    throw new Error(`Secret with key ID ${keyId} does not belong to application ${applicationId}`)
                }
                
                logger.info(`Verified secret belongs to application ${applicationId}`)
            } catch (error) {
                if (error instanceof Error && error.message.includes('does not belong to application')) {
                    throw error
                }
                logger.error(`Error verifying application credential: ${getErrorMessage(error)}`)
                // Continue even if verification fails
            }
        }
        
        logger.info(`Retrieved secret from Supabase with metadata: ${JSON.stringify(secretData.metadata)}`)
        
        // Decrypt the value
        logger.info(`Getting master encryption key`)
        const masterKey = await getMasterEncryptionKey()
        logger.info(`Got master encryption key, decrypting value`)
        
        try {
            const decryptedBytes = AES.decrypt(secretData.value, masterKey)
            const decryptedValue = decryptedBytes.toString(enc.Utf8)
            
            if (!decryptedValue) {
                logger.error(`Failed to decrypt secret value: empty decrypted string`)
                throw new Error('Failed to decrypt secret value: empty decrypted string')
            }
            
            logger.info(`Successfully decrypted secret value, parsing JSON`)
            const parsedValue = JSON.parse(decryptedValue)
            logger.info(`Parsed secret value: ${JSON.stringify(parsedValue)}`)
            
            return parsedValue
        } catch (decryptError) {
            logger.error(`Error decrypting secret value: ${getErrorMessage(decryptError)}`)
            throw new Error(`Error decrypting secret value: ${getErrorMessage(decryptError)}`)
        }
    } catch (error) {
        logger.error(`Error retrieving secret by key ID: ${getErrorMessage(error)}`)
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error retrieving secret by key ID: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Update a secret in Supabase
 * @param id ID of the secret to update
 * @param value New value to encrypt and store
 * @param metadata Optional new metadata to store
 */
export const updateSecret = async (id: string, value: any, metadata?: any): Promise<void> => {
    try {
        // Get the master encryption key
        const masterKey = await getMasterEncryptionKey()
        
        // Encrypt the value
        const encryptedValue = AES.encrypt(JSON.stringify(value), masterKey).toString()
        
        // Update in Supabase
        const supabase = getSupabaseClient()
        const updateData: any = { value: encryptedValue }
        if (metadata) updateData.metadata = metadata
        
        const { error } = await supabase
            .from('secrets')
            .update(updateData)
            .eq('id', id)
        
        if (error) throw error
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error updating secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Delete a secret from Supabase
 * @param id ID of the secret to delete
 */
export const deleteSecret = async (id: string): Promise<void> => {
    try {
        // Delete from Supabase
        const supabase = getSupabaseClient()
        const { error } = await supabase
            .from('secrets')
            .delete()
            .eq('id', id)
        
        if (error) throw error
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error deleting secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * List all secrets of a specific type
 * @param type Type of secrets to list
 * @returns Array of secrets with their metadata
 */
export const listSecrets = async (type: string): Promise<any[]> => {
    try {
        // Get from Supabase
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
            .from('secrets')
            .select('id, name, key_id, metadata, created_at, updated_at')
            .eq('type', type)
        
        if (error) throw error
        
        return data || []
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error listing secrets: ${getErrorMessage(error)}`
        )
    }
} 