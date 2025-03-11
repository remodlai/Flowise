"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserContextFromJWT = void 0;
const jwtClaims_1 = require("../../utils/jwtClaims");
/**
 * GET /api/v1/auth/user-context
 *
 * Returns the user context (userId and orgId) from JWT claims
 * This endpoint is useful for client applications that need to access
 * the user context without having to decode the JWT themselves
 */
const getUserContextFromJWT = async (req, res) => {
    try {
        // Extract user context from JWT claims
        const userContext = (0, jwtClaims_1.getUserContext)(req);
        // Return the user context
        return res.status(200).json({
            success: true,
            data: {
                userId: userContext.userId,
                orgId: userContext.orgId,
                isPlatformAdmin: userContext.isPlatformAdmin
            }
        });
    }
    catch (error) {
        console.error('Error getting user context from JWT:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get user context from JWT'
        });
    }
};
exports.getUserContextFromJWT = getUserContextFromJWT;
//# sourceMappingURL=user-context.js.map