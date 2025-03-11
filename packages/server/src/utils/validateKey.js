"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAPIKey = exports.validateChatflowAPIKey = exports.isLikelyJWT = void 0;
const apikey_1 = __importDefault(require("../services/apikey"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Check if a token is likely a JWT token
 * @param {string} token
 * @returns {boolean}
 */
const isLikelyJWT = (token) => {
    // JWT tokens have three parts separated by dots
    return token.split('.').length === 3;
};
exports.isLikelyJWT = isLikelyJWT;
/**
 * Validate Chatflow API Key
 * @param {Request} req
 * @param {ChatFlow} chatflow
 */
const validateChatflowAPIKey = async (req, chatflow) => {
    const chatFlowApiKeyId = chatflow?.apikeyid;
    if (!chatFlowApiKeyId)
        return true;
    const authorizationHeader = req.headers['Authorization'] ?? req.headers['authorization'] ?? '';
    if (chatFlowApiKeyId && !authorizationHeader)
        return false;
    const suppliedKey = authorizationHeader.split(`Bearer `).pop();
    if (suppliedKey) {
        // Check if this looks like a JWT token
        if ((0, exports.isLikelyJWT)(suppliedKey)) {
            // This is likely a JWT token, not an API key
            // JWT validation is handled by Supabase Auth middleware
            logger_1.default.debug('Authorization header contains a JWT token, skipping API key validation');
            return true;
        }
        else {
            // This is likely an API key, validate it
            try {
                await apikey_1.default.verifyApiKey(suppliedKey, req);
                return true;
            }
            catch (error) {
                logger_1.default.error(`API key validation failed: ${error}`);
                return false;
            }
        }
    }
    return false;
};
exports.validateChatflowAPIKey = validateChatflowAPIKey;
/**
 * Validate API Key
 * @param {Request} req
 */
const validateAPIKey = async (req) => {
    const authorizationHeader = req.headers['Authorization'] ?? req.headers['authorization'] ?? '';
    if (!authorizationHeader)
        return false;
    const suppliedKey = authorizationHeader.split(`Bearer `).pop();
    if (suppliedKey) {
        // Check if this looks like a JWT token
        if ((0, exports.isLikelyJWT)(suppliedKey)) {
            // This is likely a JWT token, not an API key
            // JWT validation is handled by Supabase Auth middleware
            logger_1.default.debug('Authorization header contains a JWT token, skipping API key validation');
            return true;
        }
        else {
            // This is likely an API key, validate it
            try {
                await apikey_1.default.verifyApiKey(suppliedKey, req);
                return true;
            }
            catch (error) {
                logger_1.default.error(`API key validation failed: ${error}`);
                return false;
            }
        }
    }
    return false;
};
exports.validateAPIKey = validateAPIKey;
//# sourceMappingURL=validateKey.js.map