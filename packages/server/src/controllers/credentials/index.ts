import { Request, Response, NextFunction } from 'express'
import credentialsService from '../../services/credentials'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

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
        let orgId = req.headers['x-organization-id'] || req.body.orgId
        let userId = req.headers['x-user-id'] || req.body.userId
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.appId = appId
        }
        if (orgId) {
            req.headers['x-organization-id'] = orgId
            // Also set the capitalized version for compatibility
            req.headers['X-Organization-Id'] = orgId
            // Ensure it's in the body as well
            req.body.orgId = orgId
        }
        if (userId) {
            req.headers['x-user-id'] = userId
            // Also set the capitalized version for compatibility
            req.headers['X-User-Id'] = userId
            // Ensure it's in the body as well
            req.body.userId = userId
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
        let orgId = req.headers['x-organization-id'] || req.body.orgId
        let userId = req.headers['x-user-id'] || req.body.userId
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.appId = appId
        }
        if (orgId) {
            req.headers['x-organization-id'] = orgId
            // Also set the capitalized version for compatibility
            req.headers['X-Organization-Id'] = orgId
            // Ensure it's in the body as well
            req.body.orgId = orgId
        }
        if (userId) {
            req.headers['x-user-id'] = userId
            // Also set the capitalized version for compatibility
            req.headers['X-User-Id'] = userId
            // Ensure it's in the body as well
            req.body.userId = userId
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
        let appId = req.headers['x-application-id'] || req.body.appId || req.query.appId
        let orgId = req.headers['x-organization-id'] || req.body.orgId
        let userId = req.headers['x-user-id'] || req.body.userId
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.appId = appId
        }
        if (orgId) {
            req.headers['x-organization-id'] = orgId
            // Also set the capitalized version for compatibility
            req.headers['X-Organization-Id'] = orgId
            // Ensure it's in the body as well
            req.body.orgId = orgId
        }
        if (userId) {
            req.headers['x-user-id'] = userId
            // Also set the capitalized version for compatibility
            req.headers['X-User-Id'] = userId
            // Ensure it's in the body as well
            req.body.userId = userId
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
        
        // Extract application ID, organization ID, and user ID from headers or body
        let appId = req.headers['x-application-id'] || req.body.appId
        let orgId = req.headers['x-organization-id'] || req.body.orgId
        let userId = req.headers['x-user-id'] || req.body.userId
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.appId = appId
        }
        if (orgId) {
            req.headers['x-organization-id'] = orgId
            // Also set the capitalized version for compatibility
            req.headers['X-Organization-Id'] = orgId
            // Ensure it's in the body as well
            req.body.orgId = orgId
        }
        if (userId) {
            req.headers['x-user-id'] = userId
            // Also set the capitalized version for compatibility
            req.headers['X-User-Id'] = userId
            // Ensure it's in the body as well
            req.body.userId = userId
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
        let orgId = req.headers['x-organization-id'] || req.body.orgId
        let userId = req.headers['x-user-id'] || req.body.userId
        
        // Set these values in the request headers for consistency
        if (appId) {
            req.headers['x-application-id'] = appId
            // Also set the capitalized version for compatibility
            req.headers['X-Application-Id'] = appId
            // Ensure it's in the body as well
            req.body.appId = appId
        }
        if (orgId) {
            req.headers['x-organization-id'] = orgId
            // Also set the capitalized version for compatibility
            req.headers['X-Organization-Id'] = orgId
            // Ensure it's in the body as well
            req.body.orgId = orgId
        }
        if (userId) {
            req.headers['x-user-id'] = userId
            // Also set the capitalized version for compatibility
            req.headers['X-User-Id'] = userId
            // Ensure it's in the body as well
            req.body.userId = userId
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
