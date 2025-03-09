/**
 * JWT Helper Functions
 * 
 * This file contains utility functions for working with JWT claims,
 * specifically for extracting user ID and organization ID.
 */

import { jwtDecode } from 'jwt-decode'
import client from '../api/client'

/**
 * Get the JWT token from local storage
 * 
 * @returns {string|null} The JWT token or null if not found
 */
export const getJwtToken = () => {
    try {
        // First try to get the token directly from localStorage
        const accessToken = localStorage.getItem('access_token')
        if (accessToken) return accessToken
        
        // Fall back to checking authData for backward compatibility
        const authData = localStorage.getItem('authData')
        if (!authData) return null
        
        const parsedAuthData = JSON.parse(authData)
        return parsedAuthData.access_token || null
    } catch (error) {
        console.error('Error getting JWT token:', error)
        return null
    }
}

/**
 * Extract user context (userId and orgId) from JWT claims
 * 
 * @returns {Object} Object containing userId and orgId
 */
export const getUserContextFromJWT = () => {
    try {
        const token = getJwtToken()
        if (!token) {
            throw new Error('No JWT token found')
        }
        
        // Decode the JWT to get claims
        const decodedJwt = jwtDecode(token)
        
        // Extract userId and orgId from claims
        return {
            userId: decodedJwt.userId || decodedJwt.sub || '',
            orgId: decodedJwt.organizationId || null,
            isPlatformAdmin: decodedJwt.is_platform_admin === true
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
 * Get user context from the server
 * This is useful when the JWT token is not available or when you need
 * to ensure you have the most up-to-date information
 * 
 * @returns {Promise<Object>} Promise resolving to an object containing userId and orgId
 */
export const getUserContextFromServer = async () => {
    try {
        const response = await client.get('/auth/user-context')
        return response.data.data
    } catch (error) {
        console.error('Error getting user context from server:', error)
        
        // Fall back to JWT if available
        const jwtContext = getUserContextFromJWT()
        if (jwtContext.userId) {
            return jwtContext
        }
        
        return {
            userId: '',
            orgId: null,
            isPlatformAdmin: false
        }
    }
}

/**
 * Get user context from either JWT or server
 * This function first tries to get the context from JWT,
 * and falls back to the server if not available
 * 
 * @returns {Promise<Object>} Promise resolving to an object containing userId and orgId
 */
export const getUserContext = async () => {
    try {
        // First try to get from JWT
        const jwtContext = getUserContextFromJWT()
        if (jwtContext.userId) {
            return jwtContext
        }
        
        // Fall back to server
        return await getUserContextFromServer()
    } catch (error) {
        console.error('Error getting user context:', error)
        return {
            userId: '',
            orgId: null,
            isPlatformAdmin: false
        }
    }
} 