"use strict";
/**
 * JWT Claims Utility Functions
 *
 * This file contains utility functions for working with JWT claims,
 * specifically for extracting user ID and organization ID.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserContext = exports.extractUserContextFromJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Extract user context (userId and orgId) from JWT claims in the request
 *
 * @param req - Express request object containing the JWT token
 * @returns Object containing userId and orgId
 */
const extractUserContextFromJWT = (req) => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('No valid authorization header found');
        }
        // Extract the token
        const token = authHeader.split(' ')[1];
        // Decode the JWT to get claims
        const decodedJwt = jsonwebtoken_1.default.decode(token);
        if (!decodedJwt) {
            throw new Error('Invalid JWT token');
        }
        // Extract userId and orgId from claims
        const userId = decodedJwt.userId || decodedJwt.sub;
        const orgId = decodedJwt.organizationId || null;
        const isPlatformAdmin = decodedJwt.is_platform_admin === true;
        return {
            userId,
            orgId,
            isPlatformAdmin
        };
    }
    catch (error) {
        console.error('Error extracting user context from JWT:', error);
        return {
            userId: '',
            orgId: null,
            isPlatformAdmin: false
        };
    }
};
exports.extractUserContextFromJWT = extractUserContextFromJWT;
/**
 * Extract user context from the request object
 * This function first tries to get the context from req.user,
 * and falls back to extracting it from the JWT if not available
 *
 * @param req - Express request object
 * @returns Object containing userId and orgId
 */
const getUserContext = (req) => {
    try {
        // If req.user exists and has userId, use that
        if (req.user && req.user.userId) {
            return {
                userId: req.user.userId,
                orgId: req.user.organizationId || null,
                isPlatformAdmin: req.user.is_platform_admin === true
            };
        }
        // Otherwise, extract from JWT
        return (0, exports.extractUserContextFromJWT)(req);
    }
    catch (error) {
        console.error('Error getting user context:', error);
        return {
            userId: '',
            orgId: null,
            isPlatformAdmin: false
        };
    }
};
exports.getUserContext = getUserContext;
//# sourceMappingURL=jwtClaims.js.map