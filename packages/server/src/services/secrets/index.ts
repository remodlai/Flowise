import { supabase } from '../../utils/supabase'
import { AES, enc } from 'crypto-js'
import { randomBytes } from 'crypto'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'

// Get the master encryption key from environment variable
const getMasterEncryptionKey = (): string => {
    return process.env.FLOWISE_SECRETKEY_OVERWRITE || 'flowise-default-key'
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
        // Encrypt the value
        const masterKey = getMasterEncryptionKey()
        const encryptedValue = AES.encrypt(JSON.stringify(value), masterKey).toString()
        
        // Store in Supabase
        const { data, error } = await supabase
            .from('secrets')
            .insert({
                key_id: keyId || null,
                name,
                type,
                value: encryptedValue,
                metadata
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
 * @returns The decrypted secret value
 */
export const getSecret = async (id: string): Promise<any> => {
    try {
        // Get from Supabase
        const { data, error } = await supabase
            .from('secrets')
            .select('value')
            .eq('id', id)
            .single()
        
        if (error) throw error
        if (!data) throw new Error('Secret not found')
        
        // Decrypt the value
        const masterKey = getMasterEncryptionKey()
        const decryptedBytes = AES.decrypt(data.value, masterKey)
        const decryptedValue = decryptedBytes.toString(enc.Utf8)
        
        return JSON.parse(decryptedValue)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error retrieving secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Get a secret by key ID (for API keys)
 * @param keyId The API key ID
 * @param applicationId Optional application ID to filter by
 * @returns The secret data
 */
export const getSecretByKeyId = async (keyId: string, applicationId?: string): Promise<any> => {
    try {
        // Build the query
        let query = supabase
            .from('secrets')
            .select('id, value, metadata')
            .eq('key_id', keyId)
        
        // Filter by application ID if provided and not 'global'
        if (applicationId && applicationId !== 'global') {
            console.log(`Filtering secret by application ID: ${applicationId} for key ID: ${keyId}`)
            query = query.eq('metadata->applicationId', applicationId)
        }
        
        // Execute the query
        const { data, error } = await query
        
        if (error) throw error
        if (!data || data.length === 0) {
            console.warn(`No secret found with key ID: ${keyId}${applicationId && applicationId !== 'global' ? ` and application ID: ${applicationId}` : ''}`)
            return null
        }
        
        // If multiple rows are found, use the first one but log a warning
        if (data.length > 1) {
            console.warn(`Multiple secrets found with key ID: ${keyId}, using the first one`)
        }
        
        const secretData = data[0]
        
        // Decrypt the value
        const masterKey = getMasterEncryptionKey()
        const decryptedBytes = AES.decrypt(secretData.value, masterKey)
        const decryptedValue = decryptedBytes.toString(enc.Utf8)
        
        return {
            id: secretData.id,
            value: JSON.parse(decryptedValue),
            metadata: secretData.metadata
        }
    } catch (error) {
        console.error(`Error retrieving secret by key ID: ${getErrorMessage(error)}`)
        return null
    }
}

/**
 * Update an existing secret
 * @param id ID of the secret to update
 * @param value New value
 * @param metadata New metadata (optional)
 */
export const updateSecret = async (id: string, value: any, metadata?: any): Promise<void> => {
    try {
        // Encrypt the value
        const masterKey = getMasterEncryptionKey()
        const encryptedValue = AES.encrypt(JSON.stringify(value), masterKey).toString()
        
        // Update in Supabase
        const updateData: any = { value: encryptedValue }
        if (metadata !== undefined) {
            updateData.metadata = metadata
        }
        
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
 * Delete a secret
 * @param id ID of the secret to delete
 */
export const deleteSecret = async (id: string): Promise<void> => {
    try {
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
 * @returns Array of secrets
 */
export const listSecrets = async (type: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('secrets')
            .select('id, key_id, name, metadata')
            .eq('type', type)
            .order('name')
        
        if (error) throw error
        
        return data || []
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error listing secrets: ${getErrorMessage(error)}`
        )
    }
} 