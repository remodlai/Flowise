import { omit } from 'lodash'
import { StatusCodes } from 'http-status-codes'
import { ICredentialReturnResponse } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { decryptCredentialData } from '../../utils'
import { storeSecret, getSecret, updateSecret, deleteSecret, listSecrets } from '../secrets'
import { supabase } from '../../utils/supabase'

const createCredential = async (requestBody: any, req?: any) => {
    try {
        // Get application ID from request or body
        const applicationId = requestBody.applicationId || getApplicationIdFromRequest(req)
        
        // Store credential in Supabase secrets table
        const credentialId = await storeSecret(
            requestBody.name,
            'credential',
            requestBody.plainDataObj || {},
            {
                credentialName: requestBody.credentialName,
                applicationId: applicationId || null,
                createdAt: new Date().toISOString()
            }
        )
        
        // Associate credential with application if applicationId is provided
        if (applicationId) {
            try {
                // Dynamically import applicationcredentials service to avoid circular dependencies
                const applicationcredentials = await import('../applicationcredentials')
                await applicationcredentials.associateCredentialWithApplication(
                    credentialId,
                    applicationId
                )
            } catch (error) {
                logger.error(`Error associating credential with application: ${getErrorMessage(error)}`)
                // Continue even if association fails - the credential is still created
            }
        } else {
            // If no applicationId provided, associate with default application (Platform Sandbox)
            try {
                const applicationcredentials = await import('../applicationcredentials')
                const defaultAppId = await applicationcredentials.getDefaultApplicationId()
                if (defaultAppId) {
                    await applicationcredentials.associateCredentialWithApplication(
                        credentialId,
                        defaultAppId
                    )
                }
            } catch (error) {
                logger.error(`Error associating credential with default application: ${getErrorMessage(error)}`)
                // Continue even if association fails
            }
        }
        
        // Return the created credential
        return {
            id: credentialId,
            name: requestBody.name,
            credentialName: requestBody.credentialName,
            encryptedData: credentialId, // Store the secret ID as the encryptedData
            updatedDate: new Date(),
            createdDate: new Date()
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.createCredential - ${getErrorMessage(error)}`
        )
    }
}

// Delete credential by ID
const deleteCredentials = async (credentialId: string, req?: any): Promise<any> => {
    try {
        // Get application ID from request
        const applicationId = getApplicationIdFromRequest(req)
        
        // If application ID is provided, verify credential belongs to application
        if (applicationId) {
            try {
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                
                if (!credentialIds.includes(credentialId)) {
                    throw new InternalFlowiseError(
                        StatusCodes.FORBIDDEN,
                        `Credential ${credentialId} does not belong to application ${applicationId}`
                    )
                }
            } catch (error) {
                if (error instanceof InternalFlowiseError) {
                    throw error
                }
                logger.error(`Error verifying credential application: ${getErrorMessage(error)}`)
                // Continue even if verification fails
            }
        }
        
        // Delete the credential from Supabase
        await deleteSecret(credentialId)
        
        // Remove credential association from application
        try {
            const applicationcredentials = await import('../applicationcredentials')
            await applicationcredentials.removeCredentialAssociation(credentialId)
        } catch (error) {
            logger.error(`Error removing credential association: ${getErrorMessage(error)}`)
            // Continue even if association removal fails - the credential is still deleted
        }
        
        // Return a response that matches the original format
        return {
            affected: 1,
            raw: []
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.deleteCredential - ${getErrorMessage(error)}`
        )
    }
}

// Helper function to get application ID from request
const getApplicationIdFromRequest = (req?: any, paramCredentialName?: any): string | undefined => {
    if (!req) return undefined
    
    // First check if applicationId is provided in paramCredentialName object
    if (typeof paramCredentialName === 'object' && paramCredentialName?.applicationId) {
        return paramCredentialName.applicationId !== 'global' ? paramCredentialName.applicationId : undefined
    }
    
    // Check if applicationId is provided as a query parameter
    if (req.query?.applicationId && req.query.applicationId !== 'global') {
        console.log('found applicationId in query', req.query.applicationId)
        return req.query.applicationId as string
    }
    
    // Check if applicationId is set in the request context by middleware
    if (req.applicationId && req.applicationId !== 'global') {
        console.log('found applicationId in request', req.applicationId)
        return req.applicationId
    }
    
    // Fallback to X-Application-ID header if present
    const headerAppId = req.headers?.['x-application-id'] || req.headers?.['X-Application-ID']
    if (headerAppId && headerAppId !== 'global') {
        console.log('found applicationId in header', headerAppId)
        return headerAppId as string
    }
    
    return undefined
}

const getAllCredentials = async (paramCredentialName: any, req?: any) => {
    try {
        logger.info(`Getting all credentials. Param credential name: ${paramCredentialName}`)
        logger.info(`Request headers: ${JSON.stringify(req?.headers)}`)
        logger.info(`Request query: ${JSON.stringify(req?.query)}`)
        
        // Get all credentials from Supabase
        const credentials = await listSecrets('credential')
        logger.info(`Found ${credentials.length} total credentials in Supabase`)
        
        // Get application ID from request
        const applicationId = getApplicationIdFromRequest(req, paramCredentialName)
        logger.info(`Application ID from request: ${applicationId}`)
        
        // Filter credentials by name if provided
        let filteredCredentials = credentials
        if (paramCredentialName) {
            logger.info(`Filtering credentials by name: ${paramCredentialName}`)
            if (Array.isArray(paramCredentialName)) {
                filteredCredentials = credentials.filter(cred => 
                    paramCredentialName.includes(cred.metadata?.credentialName)
                )
            } else {
                filteredCredentials = credentials.filter(cred => 
                    cred.metadata?.credentialName === paramCredentialName
                )
            }
            logger.info(`After filtering by name, found ${filteredCredentials.length} credentials`)
        }
        
        // Filter credentials by application if an applicationId is available
        if (applicationId) {
            try {
                logger.info(`Filtering credentials by application ID: ${applicationId}`)
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                logger.info(`Found ${credentialIds.length} credential IDs for application ${applicationId}: ${JSON.stringify(credentialIds)}`)
                
                // Filter credentials by IDs from application_credentials
                filteredCredentials = filteredCredentials.filter(cred => credentialIds.includes(cred.id))
                logger.info(`After filtering by application, found ${filteredCredentials.length} credentials`)
            } catch (error) {
                logger.error(`Error filtering credentials by application: ${getErrorMessage(error)}`)
                // Return all credentials if filtering fails
            }
        }
        
        // Format the response to match the original format
        const formattedCredentials = filteredCredentials.map(cred => ({
            id: cred.id,
            name: cred.name,
            credentialName: cred.metadata?.credentialName,
            applicationId: cred.metadata?.applicationId || null,
            encryptedData: cred.id, // Store the secret ID as the encryptedData
            updatedDate: new Date(cred.metadata?.updatedAt || Date.now()),
            createdDate: new Date(cred.metadata?.createdAt || Date.now())
        }))
        
        logger.info(`Returning ${formattedCredentials.length} credentials with IDs: ${JSON.stringify(formattedCredentials.map(cred => cred.id))}`)
        return formattedCredentials
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.getAllCredentials - ${getErrorMessage(error)}`
        )
    }
}

const getCredentialById = async (credentialId: string, req?: any): Promise<any> => {
    try {
        // Get application ID from request
        const applicationId = getApplicationIdFromRequest(req)
        
        // If application ID is provided, verify credential belongs to application
        if (applicationId) {
            try {
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                
                if (!credentialIds.includes(credentialId)) {
                    throw new InternalFlowiseError(
                        StatusCodes.FORBIDDEN,
                        `Credential ${credentialId} does not belong to application ${applicationId}`
                    )
                }
            } catch (error) {
                if (error instanceof InternalFlowiseError) {
                    throw error
                }
                logger.error(`Error verifying credential application: ${getErrorMessage(error)}`)
                // Continue even if verification fails
            }
        }
        
        // Get the credential data from Supabase
        const secretData = await getSecret(credentialId)
        
        // Get the credential metadata from Supabase
        const { data, error } = await supabase
            .from('secrets')
            .select('name, metadata')
            .eq('id', credentialId)
            .single()
            
        if (error) throw error
        if (!data) throw new Error('Credential not found')
        
        // Get the component credentials from the app server
        const appServer = getRunningExpressApp()
        
        // Prepare the return object
        const returnCredential: ICredentialReturnResponse = {
            id: credentialId,
            name: data.name,
            credentialName: data.metadata?.credentialName,
            plainDataObj: secretData,
            encryptedData: '', // Not needed as we're using Supabase
            updatedDate: new Date(data.metadata?.updatedAt || Date.now()),
            createdDate: new Date(data.metadata?.createdAt || Date.now())
        }
        
        // Add application ID to the return object if available
        if (data.metadata?.applicationId) {
            (returnCredential as any).applicationId = data.metadata.applicationId
        } else {
            // Try to get application ID from application_credentials table
            try {
                const applicationcredentials = await import('../applicationcredentials')
                const credentialAppId = await applicationcredentials.getApplicationIdForCredential(credentialId)
                
                if (credentialAppId) {
                    // Add application ID to the return object
                    (returnCredential as any).applicationId = credentialAppId
                }
            } catch (error) {
                logger.error(`Error getting application for credential: ${getErrorMessage(error)}`)
                // Continue even if getting application fails
            }
        }
        
        return returnCredential
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.getCredentialById - ${getErrorMessage(error)}`
        )
    }
}

const updateCredential = async (credentialId: string, requestBody: any, req?: any): Promise<any> => {
    try {
        // Get application ID from request or body
        const applicationId = requestBody.applicationId || getApplicationIdFromRequest(req)
        
        // If application ID is provided, verify credential belongs to application
        if (applicationId) {
            try {
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                
                if (!credentialIds.includes(credentialId)) {
                    throw new InternalFlowiseError(
                        StatusCodes.FORBIDDEN,
                        `Credential ${credentialId} does not belong to application ${applicationId}`
                    )
                }
            } catch (error) {
                if (error instanceof InternalFlowiseError) {
                    throw error
                }
                logger.error(`Error verifying credential application: ${getErrorMessage(error)}`)
                // Continue even if verification fails
            }
        }
        
        // Get the current credential data
        const currentData = await getSecret(credentialId)
        
        // Get the current credential metadata
        const { data, error } = await supabase
            .from('secrets')
            .select('name, metadata')
            .eq('id', credentialId)
            .single()
            
        if (error) throw error
        if (!data) throw new Error('Credential not found')
        
        // Merge the current data with the new data
        const updatedData = { ...currentData, ...requestBody.plainDataObj }
        
        // Update the metadata
        const updatedMetadata = {
            ...data.metadata,
            credentialName: requestBody.credentialName || data.metadata.credentialName,
            applicationId: applicationId || data.metadata.applicationId,
            updatedAt: new Date().toISOString()
        }
        
        // Update the name if provided
        if (requestBody.name) {
            await supabase
                .from('secrets')
                .update({ name: requestBody.name })
                .eq('id', credentialId)
        }
        
        // Update the credential in Supabase
        await updateSecret(credentialId, updatedData, updatedMetadata)
        
        // Update application association if applicationId is provided
        if (applicationId) {
            try {
                const applicationcredentials = await import('../applicationcredentials')
                await applicationcredentials.associateCredentialWithApplication(
                    credentialId,
                    applicationId
                )
            } catch (error) {
                logger.error(`Error updating credential application association: ${getErrorMessage(error)}`)
                // Continue even if association update fails - the credential is still updated
            }
        }
        
        // Return the updated credential
        return {
            id: credentialId,
            name: requestBody.name || data.name,
            credentialName: requestBody.credentialName || data.metadata.credentialName,
            applicationId: applicationId || data.metadata.applicationId,
            encryptedData: '', // Not needed as we're using Supabase
            updatedDate: new Date(data.metadata?.updatedAt || Date.now()),
            createdDate: new Date(data.metadata?.createdAt || Date.now())
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.updateCredential - ${getErrorMessage(error)}`
        )
    }
}

export default {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    updateCredential
}
