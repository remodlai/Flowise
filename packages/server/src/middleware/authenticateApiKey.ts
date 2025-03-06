import { Request, Response, NextFunction } from 'express'
import { validateAPIKey } from '../utils/validateKey'
import logger from '../utils/logger'

/**
 * Middleware to authenticate API keys
 * This should be used before the Supabase authentication middleware
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip authentication for public routes and login-related routes
    if (
      req.path.includes('/public/') || 
      req.path === '/login' || 
      req.path === '/auth/login' || 
      req.path === '/auth/magic-link' ||
      req.path.includes('/auth/callback') ||
      req.path.includes('/node-icon/')
    ) {
      return next()
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // No API key, proceed to Supabase authentication
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1]
    
    // Validate the API key
    const isValidApiKey = await validateAPIKey(req)
    
    if (isValidApiKey) {
      // Set a minimal user object for API key authentication
      req.user = {
        userId: 'api-key-user',
        email: 'api-key@example.com',
        provider: 'api-key',
        userMetadata: {},
        app_metadata: {},
        isPlatformAdmin: true, // API keys have full access
        is_platform_admin: true
      }
      
      logger.info('User authenticated via API key')
      
      // Skip Supabase authentication
      return next()
    }
    
    // API key is invalid, proceed to Supabase authentication
    next()
  } catch (error) {
    logger.error('API key authentication error:', error)
    // Proceed to Supabase authentication
    next()
  }
} 