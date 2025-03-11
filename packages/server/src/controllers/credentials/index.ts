import { Request, Response, NextFunction } from 'express'
import credentialsService from '../../services/credentials'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger'

const createCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.createCredential - body not provided!`
            )
        }
        
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId
        
        
        // Check if required values are present
        if (!appId) {
            return res.status(StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to create this credential')
        }
    
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.applicationId = appId
        }
    
      
        
        const apiResponse = await credentialsService.createCredential(req.body, req)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const deleteCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.deleteCredentials - id not provided!`
            )
        }
        
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId
  
        
        // Check if required values are present
        if (!appId) {
            return res.status(StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to delete this credential')
        }
    
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.applicationId = appId
        }
     
      
        
        const apiResponse = await credentialsService.deleteCredentials(req.params.id, req)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getAllCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId || req.query.applicationId
        let orgId = req.headers['x-organization-id'] || req.body.orgId
        let userId = req.headers['x-user-id'] || req.body.userId
        logger.debug(`[server]: getAllCredentials - appId: ${appId}, orgId: ${orgId}, userId: ${userId}`)
        // Check if required values are present
        if (!appId) {
            return res.status(StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to get all credentials')
        }
      
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.applicationId = appId
            req.body.appId = appId
        }
      
    
        
        const apiResponse = await credentialsService.getAllCredentials(req.query.credentialName, req)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const getCredentialById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.getCredentialById - id not provided!`
            )
        }
        
        // Extract application ID from headers, body, or query parameters
        let appId = req.headers['x-application-id'] || req.body.appId || req.query.applicationId
        
        // If application ID is provided, set it in the request headers and body for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.appId = appId
            
            logger.debug(`Credential request with application ID: ${appId}`)
        } else {
            logger.debug(`Credential request without application ID`)
        }
        
        const apiResponse = await credentialsService.getCredentialById(req.params.id, req)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

const updateCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.updateCredential - id not provided!`
            )
        }
        if (!req.body) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: credentialsController.updateCredential - body not provided!`
            )
        }
        
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId
 
        
        // Check if required values are present
        if (!appId) {
            return res.status(StatusCodes.BAD_REQUEST).send('Application ID is required - you are not authorized to update this credential')
        }
      
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.appId = appId
        }
   
        
        const apiResponse = await credentialsService.updateCredential(req.params.id, req.body, req)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}

export default {
    createCredential,
    deleteCredentials,
    getAllCredentials,
    getCredentialById,
    updateCredential
}
