import { Request, Response, NextFunction } from 'express'
import applicationChatflowsService from '../services/applicationchatflows'
import { getErrorMessage } from '../errors/utils'
import logger from '../utils/logger'
import { isPlatformAdmin, isAppOwner } from '../utils/supabase'
import { IUser } from '../Interface'

// Store the current application ID in the request object
declare global {
    namespace Express {
        interface Request {
            applicationId?: string
        }
    }
}

/**
 * Get the current application ID from the request
 * @param req The Express request object
 * @returns The current application ID or null
 */
export const getCurrentApplicationId = (req?: Request): string | null => {
    if (!req) return null
    return req.applicationId || null
}

/**
 * Middleware to set the current application context
 * @param req The Express request object
 * @param res The Express response object
 * @param next The next middleware function
 */
export const applicationContextMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check for application ID in headers or query parameters
        const applicationId = req.headers['x-application-id'] as string || req.query.applicationId as string
        
        if (applicationId) {
            // If "global" is specified and user is platform admin, allow global access
            if (applicationId === 'global') {
                const user = req.user as IUser | undefined
                if (user && user.userId && await isPlatformAdmin(user.userId)) {
                    req.applicationId = 'global'
                } else {
                    // User is not a platform admin, ignore the global setting
                    req.applicationId = undefined
                }
            } else {
                // Verify user has access to this application
                const user = req.user as IUser | undefined
                if (user && user.userId) {
                    // Check if user has access to this application
                    const hasAccess = await isAppOwner(user.userId, applicationId)
                    
                    if (hasAccess) {
                        req.applicationId = applicationId
                    } else {
                        // User doesn't have access to this application
                        req.applicationId = undefined
                    }
                }
            }
        } else {
            // No application ID specified, use default behavior
            req.applicationId = undefined
        }
        
        next()
    } catch (error) {
        logger.error(`[applicationContextMiddleware] ${getErrorMessage(error)}`)
        next()
    }
} 