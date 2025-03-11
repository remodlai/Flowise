"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageError = exports.StorageErrorCode = void 0;
const internalFlowiseError_1 = require("../internalFlowiseError");
const http_status_codes_1 = require("http-status-codes");
/**
 * Error codes specific to storage operations
 */
var StorageErrorCode;
(function (StorageErrorCode) {
    // File not found
    StorageErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    // Permission denied
    StorageErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    // Upload failed
    StorageErrorCode["UPLOAD_FAILED"] = "UPLOAD_FAILED";
    // Download failed
    StorageErrorCode["DOWNLOAD_FAILED"] = "DOWNLOAD_FAILED";
    // Delete failed
    StorageErrorCode["DELETE_FAILED"] = "DELETE_FAILED";
    // Invalid file
    StorageErrorCode["INVALID_FILE"] = "INVALID_FILE";
    // Storage quota exceeded
    StorageErrorCode["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    // File already exists
    StorageErrorCode["FILE_ALREADY_EXISTS"] = "FILE_ALREADY_EXISTS";
    // Invalid operation
    StorageErrorCode["INVALID_OPERATION"] = "INVALID_OPERATION";
    // Bucket not found
    StorageErrorCode["BUCKET_NOT_FOUND"] = "BUCKET_NOT_FOUND";
    // Generic storage error
    StorageErrorCode["STORAGE_ERROR"] = "STORAGE_ERROR";
})(StorageErrorCode || (exports.StorageErrorCode = StorageErrorCode = {}));
/**
 * Error class for storage-related errors
 */
class StorageError extends internalFlowiseError_1.InternalFlowiseError {
    /**
     * Create a new StorageError
     * @param code The error code
     * @param message The error message
     * @param statusCode The HTTP status code (defaults based on error code)
     * @param details Additional error details
     */
    constructor(code, message, statusCode, details) {
        // Set default status code based on error code if not provided
        if (!statusCode) {
            statusCode = StorageError.getDefaultStatusCode(code);
        }
        super(statusCode, message);
        this.code = code;
        this.details = details;
    }
    /**
     * Get the default HTTP status code for a storage error code
     * @param code The storage error code
     * @returns The corresponding HTTP status code
     */
    static getDefaultStatusCode(code) {
        switch (code) {
            case StorageErrorCode.FILE_NOT_FOUND:
            case StorageErrorCode.BUCKET_NOT_FOUND:
                return http_status_codes_1.StatusCodes.NOT_FOUND;
            case StorageErrorCode.PERMISSION_DENIED:
                return http_status_codes_1.StatusCodes.FORBIDDEN;
            case StorageErrorCode.QUOTA_EXCEEDED:
                return 413; // REQUEST_ENTITY_TOO_LARGE
            case StorageErrorCode.FILE_ALREADY_EXISTS:
                return http_status_codes_1.StatusCodes.CONFLICT;
            case StorageErrorCode.INVALID_FILE:
            case StorageErrorCode.INVALID_OPERATION:
                return http_status_codes_1.StatusCodes.BAD_REQUEST;
            case StorageErrorCode.UPLOAD_FAILED:
            case StorageErrorCode.DOWNLOAD_FAILED:
            case StorageErrorCode.DELETE_FAILED:
            case StorageErrorCode.STORAGE_ERROR:
            default:
                return http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        }
    }
}
exports.StorageError = StorageError;
//# sourceMappingURL=index.js.map