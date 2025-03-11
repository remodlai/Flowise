"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationContextMiddleware = exports.getCurrentApplicationId = void 0;
const utils_1 = require("../errors/utils");
const logger_1 = __importDefault(require("../utils/logger"));
const supabase_1 = require("../utils/supabase");
/**
 * Get the current application ID from the request
 * @param req The Express request object
 * @returns The current application ID or null
 */
const getCurrentApplicationId = (req) => {
    if (!req)
        return null;
    return req.applicationId || null;
};
exports.getCurrentApplicationId = getCurrentApplicationId;
/**
 * Middleware to set the current application context
 * @param req The Express request object
 * @param res The Express response object
 * @param next The next middleware function
 */
const applicationContextMiddleware = async (req, res, next) => {
    try {
        // Check for application ID in headers or query parameters
        const applicationId = req.headers['x-application-id'] || req.query.applicationId;
        if (applicationId) {
            // If "global" is specified and user is platform admin, allow global access
            if (applicationId === 'global') {
                const user = req.user;
                if (user && user.userId && await (0, supabase_1.isPlatformAdmin)(user.userId)) {
                    logger_1.default.debug(`Setting application context to 'global' for platform admin user: ${user.userId}`);
                    req.applicationId = 'global';
                }
                else {
                    // User is not a platform admin, ignore the global setting
                    logger_1.default.debug(`User ${user?.userId || 'unknown'} is not a platform admin, ignoring 'global' setting`);
                    req.applicationId = undefined;
                }
            }
            else {
                // For specific application ID (not 'global'), always set it regardless of user role
                // This ensures that even platform admins only see resources for the selected application
                logger_1.default.debug(`Setting application context to specific application: ${applicationId}`);
                req.applicationId = applicationId;
                // Verify user has access to this application (for audit/logging purposes only)
                const user = req.user;
                if (user && user.userId) {
                    const isPlatformAdminUser = await (0, supabase_1.isPlatformAdmin)(user.userId);
                    if (isPlatformAdminUser) {
                        logger_1.default.debug(`Platform admin user ${user.userId} accessing application ${applicationId}`);
                    }
                    else {
                        // Check if user has access to this application
                        const hasAccess = await (0, supabase_1.isAppOwner)(user.userId, applicationId);
                        if (hasAccess) {
                            logger_1.default.debug(`User ${user.userId} has access to application ${applicationId}`);
                        }
                        else {
                            logger_1.default.warn(`User ${user.userId} attempted to access application ${applicationId} without permission`);
                            // We still set the application ID, but the RLS policies will prevent access
                        }
                    }
                }
            }
        }
        else {
            // No application ID specified, use default behavior
            logger_1.default.debug('No application ID specified, using default behavior');
            req.applicationId = undefined;
        }
        next();
    }
    catch (error) {
        logger_1.default.error(`[applicationContextMiddleware] ${(0, utils_1.getErrorMessage)(error)}`);
        next();
    }
};
exports.applicationContextMiddleware = applicationContextMiddleware;
//# sourceMappingURL=applicationContextMiddleware.js.map