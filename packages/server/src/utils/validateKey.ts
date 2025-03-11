import { Request } from 'express'
import { ChatFlow } from '../database/entities/ChatFlow'
import { compareKeys } from './apiKey'
import apikeyService from '../services/apikey'
import { appConfig } from '../AppConfig'
import logger from './logger'

/**
 * Check if a token is likely a JWT token
 * @param {string} token
 * @returns {boolean}
 */
export const isLikelyJWT = (token: string): boolean => {
    // JWT tokens have three parts separated by dots
    return token.split('.').length === 3
}

/**
 * Validate Chatflow API Key
 * @param {Request} req
 * @param {ChatFlow} chatflow
 */
export const validateChatflowAPIKey = async (req: Request, chatflow: ChatFlow) => {
    const chatFlowApiKeyId = chatflow?.apikeyid
    if (!chatFlowApiKeyId) return true

    const authorizationHeader = (req.headers['Authorization'] as string) ?? (req.headers['authorization'] as string) ?? ''
    if (chatFlowApiKeyId && !authorizationHeader) return false

    const suppliedKey = authorizationHeader.split(`Bearer `).pop()
    if (suppliedKey) {
        // Check if this looks like a JWT token
        if (isLikelyJWT(suppliedKey)) {
            // This is likely a JWT token, not an API key
            // JWT validation is handled by Supabase Auth middleware
            logger.debug('Authorization header contains a JWT token, skipping API key validation')
            return true
        } else {
            // This is likely an API key, validate it
            try {
                await apikeyService.verifyApiKey(suppliedKey, req)
                return true
            } catch (error) {
                logger.error(`API key validation failed: ${error}`)
                return false
            }
        }
    }
    return false
}

/**
 * Validate API Key
 * @param {Request} req
 */
export const validateAPIKey = async (req: Request) => {
    const authorizationHeader = (req.headers['Authorization'] as string) ?? (req.headers['authorization'] as string) ?? ''
    if (!authorizationHeader) return false

    const suppliedKey = authorizationHeader.split(`Bearer `).pop()
    if (suppliedKey) {
        // Check if this looks like a JWT token
        if (isLikelyJWT(suppliedKey)) {
            // This is likely a JWT token, not an API key
            // JWT validation is handled by Supabase Auth middleware
            logger.debug('Authorization header contains a JWT token, skipping API key validation')
            return true
        } else {
            // This is likely an API key, validate it
            try {
                await apikeyService.verifyApiKey(suppliedKey, req)
                return true
            } catch (error) {
                logger.error(`API key validation failed: ${error}`)
                return false
            }
        }
    }
    return false
}
