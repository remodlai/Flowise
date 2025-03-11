"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuthorization = void 0;
/**
 * Middleware to check if user has platform admin permissions
 * Simply checks the JWT claim instead of making a database call
 * @param requiredPermissions Array of permissions required to access the route (not used, kept for backward compatibility)
 */
const checkAuthorization = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            // Check if user exists
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized - Not authenticated' });
            }
            // Simply check if the user is a platform admin from the JWT claim
            const isPlatformAdmin = req.user?.is_platform_admin === true;
            if (!isPlatformAdmin) {
                return res.status(403).json({ error: 'Forbidden - Platform admin access required' });
            }
            // User is a platform admin, proceed to the next middleware/controller
            next();
        }
        catch (error) {
            console.error('Authorization middleware error:', error);
            return res.status(500).json({ error: 'Internal server error during authorization check' });
        }
    };
};
exports.checkAuthorization = checkAuthorization;
//# sourceMappingURL=authorizationMiddleware.js.map