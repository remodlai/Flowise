import { StatusCodes } from 'http-status-codes'
import {
    generateAPIKey,
    generateSecretHash
} from '../../utils/apiKey'
import { addChatflowsCount } from '../../utils/addChatflowsCount'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { randomBytes } from 'crypto'
import { storeSecret, getSecret, getSecretByKeyId, updateSecret, deleteSecret, listSecrets } from '../secrets'

// Helper function to get application ID from request
const getApplicationIdFromRequest = (req?: any): string | undefined => {
    if (!req) return undefined
    
    // First check if applicationId is set in the request context by middleware
    if (req.applicationId && req.applicationId !== 'global' || req.body.appId && req.body.appId !== 'global') {
        return req.applicationId || req.body.appId
    }
    
    // Fallback to X-Application-ID header if present
    const headerAppId = req.headers?.['x-application-id'] || req.headers?.['X-Application-ID']
    if (headerAppId && headerAppId !== 'global') {
        return headerAppId
    }
    
    return undefined
}

const getAllApiKeys = async (req?: any) => {
    try {
        // Get all API keys from Supabase
        const secrets = await listSecrets('api_key')
        
        // Format the response to match the expected structure
        const keys = await Promise.all(secrets.map(async (item) => {
            const secretData = await getSecret(item.id)
            return {
                id: item.key_id,
                keyName: item.name,
                apiKey: item.key_id,
                apiSecret: secretData.apiSecret,
                createdAt: item.metadata.createdAt || new Date().toISOString(),
                applicationId: item.metadata.applicationId || null
            }
        }))
        
        // Create a default key if none exist
        if (keys.length === 0) {
            await createApiKey('DefaultKey')
            return getAllApiKeys(req)
        }
        
        // Filter by application ID if provided in request context
        let filteredKeys = keys
        if (req && req.applicationId && req.applicationId !== 'global') {
            filteredKeys = keys.filter(key => key.applicationId === req.applicationId)
        }
        
        return await addChatflowsCount(filteredKeys)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getAllApiKeys - ${getErrorMessage(error)}`)
    }
}

const getApiKey = async (apiKey: string, req?: any) => {
    try {
        // Get application ID from request context or header
        const applicationId = getApplicationIdFromRequest(req)
        
        // Get the secret by key ID, filtered by application ID if available
        const secretData = await getSecretByKeyId(apiKey, applicationId)
        if (!secretData) return undefined
        
        return {
            id: apiKey,
            apiKey,
            apiSecret: secretData.value.apiSecret,
            keyName: secretData.metadata.keyName,
            applicationId: secretData.metadata.applicationId || null
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getApiKey - ${getErrorMessage(error)}`)
    }
}

const createApiKey = async (keyName: string, req?: any) => {
    try {
        // Generate API key and secret
        const apiKey = generateAPIKey()
        const apiSecret = generateSecretHash(apiKey)
        
        // Get application ID from request context
        const applicationId = req?.applicationId && req.applicationId !== 'global' ? req.applicationId : null
        
        // Store in Supabase
        await storeSecret(
            keyName,
            'api_key',
            { apiKey, apiSecret },
            { 
                keyName, 
                createdAt: new Date().toISOString(),
                applicationId
            },
            apiKey
        )
        
        return getAllApiKeys(req)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.createApiKey - ${getErrorMessage(error)}`)
    }
}

// Update api key
const updateApiKey = async (id: string, keyName: string, req?: any) => {
    try {
        // Get application ID from request context or header
        const applicationId = getApplicationIdFromRequest(req)
        
        // Get the secret by key ID, filtered by application ID if available
        const secretData = await getSecretByKeyId(id, applicationId)
        if (!secretData) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `API key not found: ${id}`
            )
        }
        
        // Update the metadata
        const metadata = { ...secretData.metadata, keyName }
        await updateSecret(secretData.id, secretData.value, metadata)
        
        return getAllApiKeys(req)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.updateApiKey - ${getErrorMessage(error)}`)
    }
}

const deleteApiKey = async (id: string, req?: any) => {
    try {
        // Get application ID from request context or header
        const applicationId = getApplicationIdFromRequest(req)
        
        // Get the secret by key ID, filtered by application ID if available
        const secretData = await getSecretByKeyId(id, applicationId)
        if (!secretData) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `API key not found: ${id}`
            )
        }
        
        // Delete the secret
        await deleteSecret(secretData.id)
        
        return getAllApiKeys(req)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.deleteApiKey - ${getErrorMessage(error)}`)
    }
}

const importKeys = async (body: any) => {
    try {
        const jsonFile = body.jsonFile
        const splitDataURI = jsonFile.split(',')
        if (splitDataURI[0] !== 'data:application/json;base64') {
            throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Invalid dataURI`)
        }
        const bf = Buffer.from(splitDataURI[1] || '', 'base64')
        const plain = bf.toString('utf8')
        const keys = JSON.parse(plain)
        
        // Get all existing API keys from Supabase
        const existingSecrets = await listSecrets('api_key')
        
        // If importMode is replaceAll, delete all existing keys
        if (body.importMode === 'replaceAll') {
            for (const secret of existingSecrets) {
                await deleteSecret(secret.id)
            }
        }
        
        // If importMode is errorIfExist, check for existing keys
        if (body.importMode === 'errorIfExist') {
            for (const key of keys) {
                const keyNameExists = existingSecrets.find((s) => s.name === key.keyName)
                if (keyNameExists) {
                    throw new InternalFlowiseError(
                        StatusCodes.INTERNAL_SERVER_ERROR,
                        `Key with name ${key.keyName} already exists`
                    )
                }
            }
        }
        
        // Import the keys
        for (const key of keys) {
            const keyNameExists = existingSecrets.find((s) => s.name === key.keyName)
            if (keyNameExists) {
                switch (body.importMode) {
                    case 'overwriteIfExist': {
                        // Update the existing key
                        await updateSecret(
                            keyNameExists.id,
                            { apiKey: key.apiKey, apiSecret: key.apiSecret },
                            { keyName: key.keyName, createdAt: key.createdAt || new Date().toISOString() }
                        )
                        break
                    }
                    case 'ignoreIfExist': {
                        // Ignore this key and continue
                        continue
                    }
                    case 'errorIfExist': {
                        // Should not reach here as we have already checked for existing keys
                        throw new Error(`Key with name ${key.keyName} already exists`)
                    }
                    default: {
                        throw new Error(`Unknown overwrite option ${body.importMode}`)
                    }
                }
            } else {
                // Add the new key
                await storeSecret(
                    key.keyName,
                    'api_key',
                    { apiKey: key.apiKey, apiSecret: key.apiSecret },
                    { keyName: key.keyName, createdAt: key.createdAt || new Date().toISOString() },
                    key.apiKey
                )
            }
        }
        
        return getAllApiKeys()
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.importKeys - ${getErrorMessage(error)}`)
    }
}

const verifyApiKey = async (paramApiKey: string, req?: any): Promise<string> => {
    try {
        // Get application ID from request context or header
        const applicationId = getApplicationIdFromRequest(req)
        
        // Get the secret by key ID, filtered by application ID if available
        const apiKey = await getSecretByKeyId(paramApiKey, applicationId)
        if (!apiKey) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }
        return 'OK'
    } catch (error) {
        if (error instanceof InternalFlowiseError && error.statusCode === StatusCodes.UNAUTHORIZED) {
            throw error
        } else {
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Error: apikeyService.verifyApiKey - ${getErrorMessage(error)}`
            )
        }
    }
}

export default {
    getAllApiKeys,
    getApiKey,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    importKeys,
    verifyApiKey
}
