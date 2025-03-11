import { InternalFlowiseError } from '../internalFlowiseError';
/**
 * Error codes specific to storage operations
 */
export declare enum StorageErrorCode {
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    UPLOAD_FAILED = "UPLOAD_FAILED",
    DOWNLOAD_FAILED = "DOWNLOAD_FAILED",
    DELETE_FAILED = "DELETE_FAILED",
    INVALID_FILE = "INVALID_FILE",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
    FILE_ALREADY_EXISTS = "FILE_ALREADY_EXISTS",
    INVALID_OPERATION = "INVALID_OPERATION",
    BUCKET_NOT_FOUND = "BUCKET_NOT_FOUND",
    STORAGE_ERROR = "STORAGE_ERROR"
}
/**
 * Error class for storage-related errors
 */
export declare class StorageError extends InternalFlowiseError {
    code: StorageErrorCode;
    details?: Record<string, any>;
    /**
     * Create a new StorageError
     * @param code The error code
     * @param message The error message
     * @param statusCode The HTTP status code (defaults based on error code)
     * @param details Additional error details
     */
    constructor(code: StorageErrorCode, message: string, statusCode?: number, details?: Record<string, any>);
    /**
     * Get the default HTTP status code for a storage error code
     * @param code The storage error code
     * @returns The corresponding HTTP status code
     */
    private static getDefaultStatusCode;
}
