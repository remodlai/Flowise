import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

/**
 * Middleware to check if user has required permissions
 * @param requiredPermissions Array of permissions required to access the route
 */
export const checkAuthorization = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get token from authorization header
            const token = req.headers.authorization?.split(' ')[1]
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized - No token provided' })
            }

            // Get Supabase client
            const supabaseUrl = process.env.SUPABASE_URL
            const supabaseKey = process.env.SUPABASE_SERVICE_KEY

            if (!supabaseUrl || !supabaseKey) {
                console.error('Supabase URL or key not configured')
                return res.status(500).json({ error: 'Server configuration error' })
            }

            const supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            })

            // Check if user has any of the required permissions
            const { data: userPermissions, error } = await supabase.rpc('get_user_permissions')
            
            if (error) {
                console.error('Error fetching user permissions:', error)
                return res.status(500).json({ error: 'Error checking permissions' })
            }

            // If no permissions are returned, user is not authorized
            if (!userPermissions || userPermissions.length === 0) {
                return res.status(403).json({ error: 'Forbidden - Insufficient permissions' })
            }

            // Check if user has any of the required permissions
            const hasPermission = requiredPermissions.some(permission => 
                userPermissions.includes(permission)
            )

            if (!hasPermission) {
                return res.status(403).json({ error: 'Forbidden - Insufficient permissions' })
            }

            // User has permission, proceed to the next middleware/controller
            next()
        } catch (error) {
            console.error('Authorization middleware error:', error)
            return res.status(500).json({ error: 'Internal server error during authorization check' })
        }
    }
} 