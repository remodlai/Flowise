import { omit } from 'lodash'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Credential } from '../../database/entities/Credential'
import { transformToCredentialEntity, decryptCredentialData } from '../../utils'
import { ICredentialReturnResponse } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'

const createCredential = async (requestBody: any, req?: any) => {
    try {
        const appServer = getRunningExpressApp()
        const newCredential = await transformToCredentialEntity(requestBody)
        const credential = await appServer.AppDataSource.getRepository(Credential).create(newCredential)
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        
        // Get application ID from request body
        // We can rely on this being set by the controller
        const appId = requestBody.appId
        
        // Associate credential with application if appId is provided
        if (appId) {
            try {
                // Dynamically import applicationcredentials service to avoid circular dependencies
                const applicationcredentials = await import('../applicationcredentials')
                await applicationcredentials.associateCredentialWithApplication(
                    dbResponse.id,
                    appId
                )
            } catch (error) {
                logger.error(`Error associating credential with application: ${getErrorMessage(error)}`)
                // Continue even if association fails - the credential is still created
            }
        } else {
            // If no appId provided, associate with default application (Platform Sandbox)
            try {
                const applicationcredentials = await import('../applicationcredentials')
                const defaultAppId = await applicationcredentials.getDefaultApplicationId()
                if (defaultAppId) {
                    await applicationcredentials.associateCredentialWithApplication(
                        dbResponse.id,
                        defaultAppId
                    )
                }
            } catch (error) {
                logger.error(`Error associating credential with default application: ${getErrorMessage(error)}`)
                // Continue even if association fails
            }
        }
        
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.createCredential - ${getErrorMessage(error)}`
        )
    }
}

// Delete all credentials from chatflowid
const deleteCredentials = async (credentialId: string, req?: any): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        
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
        
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).delete({ id: credentialId })
        if (!dbResponse) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }
        
        // Remove credential association from application
        try {
            const applicationcredentials = await import('../applicationcredentials')
            await applicationcredentials.removeCredentialAssociation(credentialId)
        } catch (error) {
            logger.error(`Error removing credential association: ${getErrorMessage(error)}`)
            // Continue even if association removal fails - the credential is still deleted
        }
        
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.deleteCredential - ${getErrorMessage(error)}`
        )
    }
}

// Helper function to get application ID from request
// This is now simpler since we ensure appId is set in the request body in the controller
const getApplicationIdFromRequest = (req?: any, paramCredentialName?: any): string | undefined => {
    if (!req) return undefined
    
    // First check if appId is provided in the request body
    if (req.body?.appId && req.body.appId !== 'global') {
        return req.body.appId
    }
    
    // For backward compatibility, check other sources
    
    // Check if appId is provided in paramCredentialName object
    if (typeof paramCredentialName === 'object' && paramCredentialName?.appId) {
        return paramCredentialName.appId !== 'global' ? paramCredentialName.appId : undefined
    }
    
    // Check if appId is provided as a query parameter
    if (req.query?.appId && req.query.appId !== 'global') {
        return req.query.appId as string
    }
    
    // Check if appId is set in the request context by middleware
    if (req.appId && req.appId !== 'global') {
        return req.appId
    }
    
    // Fallback to X-Application-ID header if present
    const headerAppId = req.headers?.['x-application-id'] || req.headers?.['X-Application-ID']
    if (headerAppId && headerAppId !== 'global') {
        return headerAppId as string
    }
    
    return undefined
}

const getAllCredentials = async (paramCredentialName: any, req?: any) => {
    try {
        const appServer = getRunningExpressApp()
        let dbResponse = []
        if (paramCredentialName) {
            if (Array.isArray(paramCredentialName)) {
                for (let i = 0; i < paramCredentialName.length; i += 1) {
                    const name = paramCredentialName[i] as string
                    const credentials = await appServer.AppDataSource.getRepository(Credential).findBy({
                        credentialName: name
                    })
                    dbResponse.push(...credentials)
                }
            } else {
                const credentials = await appServer.AppDataSource.getRepository(Credential).findBy({
                    credentialName: paramCredentialName as string
                })
                dbResponse = [...credentials]
            }
        } else {
            const credentials = await appServer.AppDataSource.getRepository(Credential).find()
            for (const credential of credentials) {
                dbResponse.push(omit(credential, ['encryptedData']))
            }
        }

        // Get application ID from request using the helper function
        const applicationId = getApplicationIdFromRequest(req, paramCredentialName)
        
        // Filter credentials by application if an applicationId is available
        if (applicationId) {
            try {
                logger.debug(`Filtering credentials by application ID: ${applicationId}`)
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                
                // Filter credentials by IDs from application_credentials
                return dbResponse.filter(cred => credentialIds.includes(cred.id))
            } catch (error) {
                logger.error(`Error filtering credentials by application: ${getErrorMessage(error)}`)
                // Return all credentials if filtering fails
            }
        }

        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.getAllCredentials - ${getErrorMessage(error)}`
        )
    }
}

const getCredentialById = async (credentialId: string, req?: any): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        
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
        
        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId
        })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }

        // Decrpyt credentialData
        const decryptedCredentialData = await decryptCredentialData(
            credential.encryptedData,
            credential.credentialName,
            appServer.nodesPool.componentCredentials
        )
        const returnCredential: ICredentialReturnResponse = {
            ...credential,
            plainDataObj: decryptedCredentialData
        }

        // Get application information for this credential
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

        const dbResponse = omit(returnCredential, ['encryptedData'])
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: credentialsService.getCredentialById - ${getErrorMessage(error)}`
        )
    }
}

const updateCredential = async (credentialId: string, requestBody: any, req?: any): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
        
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
        
        const credential = await appServer.AppDataSource.getRepository(Credential).findOneBy({
            id: credentialId
        })
        if (!credential) {
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, `Credential ${credentialId} not found`)
        }
        
        const decryptedCredentialData = await decryptCredentialData(credential.encryptedData)
        requestBody.plainDataObj = { ...decryptedCredentialData, ...requestBody.plainDataObj }
        const updateCredential = await transformToCredentialEntity(requestBody)
        await appServer.AppDataSource.getRepository(Credential).merge(credential, updateCredential)
        
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        
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
        
        return dbResponse
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
