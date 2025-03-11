import { StorageError } from './index';
/**
 * Create a file not found error
 * @param fileId The ID of the file that was not found
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createFileNotFoundError: (fileId: string, details?: Record<string, any>) => StorageError;
/**
 * Create a permission denied error
 * @param fileId The ID of the file for which permission was denied
 * @param userId The ID of the user who was denied permission
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createPermissionDeniedError: (fileId: string, userId: string, details?: Record<string, any>) => StorageError;
/**
 * Create an upload failed error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createUploadFailedError: (message: string, details?: Record<string, any>) => StorageError;
/**
 * Create a download failed error
 * @param fileId The ID of the file that failed to download
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createDownloadFailedError: (fileId: string, message: string, details?: Record<string, any>) => StorageError;
/**
 * Create a delete failed error
 * @param fileId The ID of the file that failed to delete
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createDeleteFailedError: (fileId: string, message: string, details?: Record<string, any>) => StorageError;
/**
 * Create an invalid file error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createInvalidFileError: (message: string, details?: Record<string, any>) => StorageError;
/**
 * Create a quota exceeded error
 * @param userId The ID of the user who exceeded their quota
 * @param fileSize The size of the file that exceeded the quota
 * @param quotaLimit The user's quota limit
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createQuotaExceededError: (userId: string, fileSize: number, quotaLimit: number, details?: Record<string, any>) => StorageError;
/**
 * Create a file already exists error
 * @param fileName The name of the file that already exists
 * @param path The path where the file already exists
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createFileAlreadyExistsError: (fileName: string, path: string, details?: Record<string, any>) => StorageError;
/**
 * Create a bucket not found error
 * @param bucketName The name of the bucket that was not found
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createBucketNotFoundError: (bucketName: string, details?: Record<string, any>) => StorageError;
/**
 * Create a generic storage error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
export declare const createStorageError: (message: string, details?: Record<string, any>) => StorageError;
/**
 * Convert a generic error to a StorageError
 * @param error The error to convert
 * @param defaultMessage The default message to use if the error doesn't have one
 * @returns A StorageError instance
 */
export declare const convertToStorageError: (error: unknown, defaultMessage?: string) => StorageError;
