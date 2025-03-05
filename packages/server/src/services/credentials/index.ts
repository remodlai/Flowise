import { omit } from 'lodash'
import { StatusCodes } from 'http-status-codes'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { Credential } from '../../database/entities/Credential'
import { transformToCredentialEntity, decryptCredentialData } from '../../utils'
import { ICredentialReturnResponse } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import logger from '../../utils/logger'

const createCredential = async (requestBody: any) => {
    try {
        const appServer = getRunningExpressApp()
        const newCredential = await transformToCredentialEntity(requestBody)
        const credential = await appServer.AppDataSource.getRepository(Credential).create(newCredential)
        const dbResponse = await appServer.AppDataSource.getRepository(Credential).save(credential)
        
        // Associate credential with application if applicationId is provided
        if (requestBody.applicationId) {
            try {
                // Dynamically import applicationcredentials service to avoid circular dependencies
                const applicationcredentials = await import('../applicationcredentials')
                await applicationcredentials.associateCredentialWithApplication(
                    dbResponse.id,
                    requestBody.applicationId
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
const deleteCredentials = async (credentialId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
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

const getAllCredentials = async (paramCredentialName: any) => {
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

        // If applicationId is provided in paramCredentialName object, filter credentials by application
        if (typeof paramCredentialName === 'object' && paramCredentialName?.applicationId) {
            try {
                const applicationId = paramCredentialName.applicationId
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

const getCredentialById = async (credentialId: string): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
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
            const applicationId = await applicationcredentials.getApplicationIdForCredential(credentialId)
            
            if (applicationId) {
                // Add application ID to the return object
                (returnCredential as any).applicationId = applicationId
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

const updateCredential = async (credentialId: string, requestBody: any): Promise<any> => {
    try {
        const appServer = getRunningExpressApp()
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
        if (requestBody.applicationId) {
            try {
                const applicationcredentials = await import('../applicationcredentials')
                await applicationcredentials.associateCredentialWithApplication(
                    credentialId,
                    requestBody.applicationId
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
