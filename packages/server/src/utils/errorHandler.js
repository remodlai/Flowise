"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
/**
 * Handle API errors and return appropriate response
 * @param res Express Response object
 * @param error Error object
 * @param defaultMessage Default error message
 * @returns Response with error details
 */
const handleError = (res, error, defaultMessage) => {
    console.error(`API Error: ${defaultMessage}`, error);
    // Handle Supabase errors
    if (error?.code && error?.message) {
        return res.status(400).json({
            error: error.message,
            code: error.code
        });
    }
    // Handle other errors
    return res.status(500).json({
        error: defaultMessage,
        details: error?.message || 'Unknown error'
    });
};
exports.handleError = handleError;
//# sourceMappingURL=errorHandler.js.map