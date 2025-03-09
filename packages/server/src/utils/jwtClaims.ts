/**
 * JWT Claims Utility Functions
 * 
 * This file contains utility functions for working with JWT claims,
 * specifically for extracting user ID and organization ID.
 */

import { Request } from 'express'
import jwt from 'jsonwebtoken'

/**
 * Interface for the user context extracted from JWT claims
 */
export interface IUserContext {
    userId: string
    orgId: string | null
    isPlatformAdmin: boolean
}

/**
 * Extract user context (userId and orgId) from JWT claims in the request
 * 
 * @param req - Express request object containing the JWT token
 * @returns Object containing userId and orgId
 */
export const extractUserContextFromJWT = (req: Request): IUserContext => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('No valid authorization header found')
        }
        
        // Extract the token
        const token = authHeader.split(' ')[1]
        
        // Decode the JWT to get claims
        const decodedJwt: any = jwt.decode(token)
        
        if (!decodedJwt) {
            throw new Error('Invalid JWT token')
        }
        
        // Extract userId and orgId from claims
        const userId = decodedJwt.userId || decodedJwt.sub
        const orgId = decodedJwt.organizationId || null
        const isPlatformAdmin = decodedJwt.is_platform_admin === true
        
        return {
            userId,
            orgId,
            isPlatformAdmin
        }
    } catch (error) {
        console.error('Error extracting user context from JWT:', error)
        return {
            userId: '',
            orgId: null,
            isPlatformAdmin: false
        }
    }
}

/**
 * Extract user context from the request object
 * This function first tries to get the context from req.user,
 * and falls back to extracting it from the JWT if not available
 * 
 * @param req - Express request object
 * @returns Object containing userId and orgId
 */
export const getUserContext = (req: Request): IUserContext => {
    try {
        // If req.user exists and has userId, use that
        if (req.user && req.user.userId) {
            return {
                userId: req.user.userId,
                orgId: req.user.organizationId || null,
                isPlatformAdmin: req.user.is_platform_admin === true
            }
        }
        
        // Otherwise, extract from JWT
        return extractUserContextFromJWT(req)
    } catch (error) {
        console.error('Error getting user context:', error)
        return {
            userId: '',
            orgId: null,
            isPlatformAdmin: false
        }
    }
} 