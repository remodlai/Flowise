import { Request, Response, NextFunction } from 'express'

/**
 * Middleware to log JWT claims for debugging
 */
export const jwtDebugMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        console.log('JWT Claims Debug:')
        console.log('- User ID:', req.user.userId)
        console.log('- Is Platform Admin:', req.user.is_platform_admin || req.user.isPlatformAdmin)
        console.log('- User Roles:', JSON.stringify(req.user.user_roles || []))
        console.log('- User Permissions:', JSON.stringify(req.user.user_permissions || []))
        console.log('- Test Claim:', req.user.test_claim || 'Not present')
    }
    next()
} 