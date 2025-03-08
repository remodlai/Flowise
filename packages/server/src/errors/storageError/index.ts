import { InternalFlowiseError } from '../internalFlowiseError'
import { StatusCodes } from 'http-status-codes'

/**
 * Error codes specific to storage operations
 */
export enum StorageErrorCode {
    // File not found
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    // Permission denied
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    // Upload failed
    UPLOAD_FAILED = 'UPLOAD_FAILED',
    // Download failed
    DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
    // Delete failed
    DELETE_FAILED = 'DELETE_FAILED',
    // Invalid file
    INVALID_FILE = 'INVALID_FILE',
    // Storage quota exceeded
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    // File already exists
    FILE_ALREADY_EXISTS = 'FILE_ALREADY_EXISTS',
    // Invalid operation
    INVALID_OPERATION = 'INVALID_OPERATION',
    // Bucket not found
    BUCKET_NOT_FOUND = 'BUCKET_NOT_FOUND',
    // Generic storage error
    STORAGE_ERROR = 'STORAGE_ERROR'
}

/**
 * Error class for storage-related errors
 */
export class StorageError extends InternalFlowiseError {
    code: StorageErrorCode
    details?: Record<string, any>

    /**
     * Create a new StorageError
     * @param code The error code
     * @param message The error message
     * @param statusCode The HTTP status code (defaults based on error code)
     * @param details Additional error details
     */
    constructor(
        code: StorageErrorCode,
        message: string,
        statusCode?: number,
        details?: Record<string, any>
    ) {
        // Set default status code based on error code if not provided
        if (!statusCode) {
            statusCode = StorageError.getDefaultStatusCode(code)
        }
        
        super(statusCode, message)
        this.code = code
        this.details = details
    }

    /**
     * Get the default HTTP status code for a storage error code
     * @param code The storage error code
     * @returns The corresponding HTTP status code
     */
    private static getDefaultStatusCode(code: StorageErrorCode): number {
        switch (code) {
            case StorageErrorCode.FILE_NOT_FOUND:
            case StorageErrorCode.BUCKET_NOT_FOUND:
                return StatusCodes.NOT_FOUND
            case StorageErrorCode.PERMISSION_DENIED:
                return StatusCodes.FORBIDDEN
            case StorageErrorCode.QUOTA_EXCEEDED:
                return 413 // REQUEST_ENTITY_TOO_LARGE
            case StorageErrorCode.FILE_ALREADY_EXISTS:
                return StatusCodes.CONFLICT
            case StorageErrorCode.INVALID_FILE:
            case StorageErrorCode.INVALID_OPERATION:
                return StatusCodes.BAD_REQUEST
            case StorageErrorCode.UPLOAD_FAILED:
            case StorageErrorCode.DOWNLOAD_FAILED:
            case StorageErrorCode.DELETE_FAILED:
            case StorageErrorCode.STORAGE_ERROR:
            default:
                return StatusCodes.INTERNAL_SERVER_ERROR
        }
    }
} 