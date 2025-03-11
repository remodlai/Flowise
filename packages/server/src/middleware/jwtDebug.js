"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtDebugMiddleware = void 0;
/**
 * Middleware to log JWT claims for debugging
 */
const jwtDebugMiddleware = (req, res, next) => {
    if (req.user) {
        console.log('JWT Claims Debug:');
        console.log('- User ID:', req.user.userId);
        console.log('- Is Platform Admin:', req.user.is_platform_admin || req.user.isPlatformAdmin);
        console.log('- User Roles:', JSON.stringify(req.user.user_roles || []));
        console.log('- User Permissions:', JSON.stringify(req.user.user_permissions || []));
        console.log('- Test Claim:', req.user.test_claim || 'Not present');
    }
    next();
};
exports.jwtDebugMiddleware = jwtDebugMiddleware;
//# sourceMappingURL=jwtDebug.js.map