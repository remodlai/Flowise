"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = void 0;
const validateKey_1 = require("../utils/validateKey");
const logger_1 = __importDefault(require("../utils/logger"));
const validateKey_2 = require("../utils/validateKey");
// A constant UUID for API key users to avoid UUID validation errors
const API_KEY_USER_ID = '00000000-0000-0000-0000-000000000000';
/**
 * Middleware to authenticate API keys
 * This should be used before the Supabase authentication middleware
 */
const authenticateApiKey = async (req, res, next) => {
    try {
        // Skip authentication for public routes and login-related routes
        if (req.path.includes('/public/') ||
            req.path === '/login' ||
            req.path === '/auth/login' ||
            req.path === '/auth/magic-link' ||
            req.path.includes('/auth/callback') ||
            req.path.includes('/node-icon/')) {
            return next();
        }
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // No API key, proceed to Supabase authentication
        }
        // Extract the token
        const token = authHeader.split(' ')[1];
        // Check if this is a JWT token
        if ((0, validateKey_2.isLikelyJWT)(token)) {
            logger_1.default.debug('JWT token detected in authenticateApiKey middleware, skipping API key authentication');
            return next(); // It's a JWT token, proceed to Supabase authentication
        }
        // Validate the API key
        const isValidApiKey = await (0, validateKey_1.validateAPIKey)(req);
        if (isValidApiKey) {
            // Set a minimal user object for API key authentication with a valid UUID
            req.user = {
                userId: API_KEY_USER_ID, // Use a constant valid UUID instead of 'api-key-user'
                email: 'api-key@example.com',
                provider: 'api-key',
                userMetadata: {},
                app_metadata: {},
                isPlatformAdmin: true, // API keys have full access
                is_platform_admin: true
            };
            logger_1.default.info('User authenticated via API key');
            // Skip Supabase authentication
            return next();
        }
        // API key is invalid, proceed to Supabase authentication
        next();
    }
    catch (error) {
        logger_1.default.error('API key authentication error:', error);
        // Proceed to Supabase authentication
        next();
    }
};
exports.authenticateApiKey = authenticateApiKey;
//# sourceMappingURL=authenticateApiKey.js.map