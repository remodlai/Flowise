import { Request, Response, NextFunction } from 'express'
import { supabase } from './supabase'
import { IUser } from '../Interface'

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      res.status(401).json({ error: 'Unauthorized Access' })
      return
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1]
    
    // Validate the token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token)
    
    if (error || !data.user) {
      console.error('Token validation error:', error)
      res.status(401).json({ error: 'Invalid authentication token' })
      return
    }
    
    // Set the user object on the request
    const user: IUser = {
      userId: data.user.id,
      email: data.user.email,
      provider: data.user.app_metadata?.provider || 'email',
      userMetadata: data.user.user_metadata || {}
    }
    
    req.user = user
    
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({ error: 'Server error during authentication' })
    return
  }
} 