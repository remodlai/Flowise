import { StorageError, StorageErrorCode } from './index'

/**
 * Create a file not found error
 * @param fileId The ID of the file that was not found
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createFileNotFoundError = (fileId: string, details?: Record<string, any>): StorageError => {
    return new StorageError(
        StorageErrorCode.FILE_NOT_FOUND,
        `File with ID ${fileId} not found`,
        undefined,
        details
    )
}

/**
 * Create a permission denied error
 * @param fileId The ID of the file for which permission was denied
 * @param userId The ID of the user who was denied permission
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createPermissionDeniedError = (
    fileId: string,
    userId: string,
    details?: Record<string, any>
): StorageError => {
    return new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        `User ${userId} does not have permission to access file ${fileId}`,
        undefined,
        details
    )
}

/**
 * Create an upload failed error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createUploadFailedError = (message: string, details?: Record<string, any>): StorageError => {
    return new StorageError(
        StorageErrorCode.UPLOAD_FAILED,
        `File upload failed: ${message}`,
        undefined,
        details
    )
}

/**
 * Create a download failed error
 * @param fileId The ID of the file that failed to download
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createDownloadFailedError = (
    fileId: string,
    message: string,
    details?: Record<string, any>
): StorageError => {
    return new StorageError(
        StorageErrorCode.DOWNLOAD_FAILED,
        `Failed to download file ${fileId}: ${message}`,
        undefined,
        details
    )
}

/**
 * Create a delete failed error
 * @param fileId The ID of the file that failed to delete
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createDeleteFailedError = (
    fileId: string,
    message: string,
    details?: Record<string, any>
): StorageError => {
    return new StorageError(
        StorageErrorCode.DELETE_FAILED,
        `Failed to delete file ${fileId}: ${message}`,
        undefined,
        details
    )
}

/**
 * Create an invalid file error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createInvalidFileError = (message: string, details?: Record<string, any>): StorageError => {
    return new StorageError(
        StorageErrorCode.INVALID_FILE,
        `Invalid file: ${message}`,
        undefined,
        details
    )
}

/**
 * Create a quota exceeded error
 * @param userId The ID of the user who exceeded their quota
 * @param fileSize The size of the file that exceeded the quota
 * @param quotaLimit The user's quota limit
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createQuotaExceededError = (
    userId: string,
    fileSize: number,
    quotaLimit: number,
    details?: Record<string, any>
): StorageError => {
    return new StorageError(
        StorageErrorCode.QUOTA_EXCEEDED,
        `Storage quota exceeded for user ${userId}. File size: ${fileSize}, Quota limit: ${quotaLimit}`,
        undefined,
        details
    )
}

/**
 * Create a file already exists error
 * @param fileName The name of the file that already exists
 * @param path The path where the file already exists
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createFileAlreadyExistsError = (
    fileName: string,
    path: string,
    details?: Record<string, any>
): StorageError => {
    return new StorageError(
        StorageErrorCode.FILE_ALREADY_EXISTS,
        `File ${fileName} already exists at path ${path}`,
        undefined,
        details
    )
}

/**
 * Create a bucket not found error
 * @param bucketName The name of the bucket that was not found
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createBucketNotFoundError = (
    bucketName: string,
    details?: Record<string, any>
): StorageError => {
    return new StorageError(
        StorageErrorCode.BUCKET_NOT_FOUND,
        `Bucket ${bucketName} not found`,
        undefined,
        details
    )
}

/**
 * Create a generic storage error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export const createStorageError = (message: string, details?: Record<string, any>): StorageError => {
    return new StorageError(
        StorageErrorCode.STORAGE_ERROR,
        `Storage error: ${message}`,
        undefined,
        details
    )
}

/**
 * Convert a generic error to a StorageError
 * @param error The error to convert
 * @param defaultMessage The default message to use if the error doesn't have one
 * @returns A StorageError instance
 */
export const convertToStorageError = (error: unknown, defaultMessage = 'Unknown storage error'): StorageError => {
    if (error instanceof StorageError) {
        return error
    }

    const message = error instanceof Error ? error.message : defaultMessage
    return createStorageError(message, { originalError: error })
} 