"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToStorageError = exports.createStorageError = exports.createBucketNotFoundError = exports.createFileAlreadyExistsError = exports.createQuotaExceededError = exports.createInvalidFileError = exports.createDeleteFailedError = exports.createDownloadFailedError = exports.createUploadFailedError = exports.createPermissionDeniedError = exports.createFileNotFoundError = void 0;
const index_1 = require("./index");
/**
 * Create a file not found error
 * @param fileId The ID of the file that was not found
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createFileNotFoundError = (fileId, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.FILE_NOT_FOUND, `File with ID ${fileId} not found`, undefined, details);
};
exports.createFileNotFoundError = createFileNotFoundError;
/**
 * Create a permission denied error
 * @param fileId The ID of the file for which permission was denied
 * @param userId The ID of the user who was denied permission
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createPermissionDeniedError = (fileId, userId, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.PERMISSION_DENIED, `User ${userId} does not have permission to access file ${fileId}`, undefined, details);
};
exports.createPermissionDeniedError = createPermissionDeniedError;
/**
 * Create an upload failed error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createUploadFailedError = (message, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.UPLOAD_FAILED, `File upload failed: ${message}`, undefined, details);
};
exports.createUploadFailedError = createUploadFailedError;
/**
 * Create a download failed error
 * @param fileId The ID of the file that failed to download
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createDownloadFailedError = (fileId, message, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.DOWNLOAD_FAILED, `Failed to download file ${fileId}: ${message}`, undefined, details);
};
exports.createDownloadFailedError = createDownloadFailedError;
/**
 * Create a delete failed error
 * @param fileId The ID of the file that failed to delete
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createDeleteFailedError = (fileId, message, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.DELETE_FAILED, `Failed to delete file ${fileId}: ${message}`, undefined, details);
};
exports.createDeleteFailedError = createDeleteFailedError;
/**
 * Create an invalid file error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createInvalidFileError = (message, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.INVALID_FILE, `Invalid file: ${message}`, undefined, details);
};
exports.createInvalidFileError = createInvalidFileError;
/**
 * Create a quota exceeded error
 * @param userId The ID of the user who exceeded their quota
 * @param fileSize The size of the file that exceeded the quota
 * @param quotaLimit The user's quota limit
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createQuotaExceededError = (userId, fileSize, quotaLimit, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.QUOTA_EXCEEDED, `Storage quota exceeded for user ${userId}. File size: ${fileSize}, Quota limit: ${quotaLimit}`, undefined, details);
};
exports.createQuotaExceededError = createQuotaExceededError;
/**
 * Create a file already exists error
 * @param fileName The name of the file that already exists
 * @param path The path where the file already exists
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createFileAlreadyExistsError = (fileName, path, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.FILE_ALREADY_EXISTS, `File ${fileName} already exists at path ${path}`, undefined, details);
};
exports.createFileAlreadyExistsError = createFileAlreadyExistsError;
/**
 * Create a bucket not found error
 * @param bucketName The name of the bucket that was not found
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createBucketNotFoundError = (bucketName, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.BUCKET_NOT_FOUND, `Bucket ${bucketName} not found`, undefined, details);
};
exports.createBucketNotFoundError = createBucketNotFoundError;
/**
 * Create a generic storage error
 * @param message The error message
 * @param details Additional error details
 * @returns A StorageError instance
 */
const createStorageError = (message, details) => {
    return new index_1.StorageError(index_1.StorageErrorCode.STORAGE_ERROR, `Storage error: ${message}`, undefined, details);
};
exports.createStorageError = createStorageError;
/**
 * Convert a generic error to a StorageError
 * @param error The error to convert
 * @param defaultMessage The default message to use if the error doesn't have one
 * @returns A StorageError instance
 */
const convertToStorageError = (error, defaultMessage = 'Unknown storage error') => {
    if (error instanceof index_1.StorageError) {
        return error;
    }
    const message = error instanceof Error ? error.message : defaultMessage;
    return (0, exports.createStorageError)(message, { originalError: error });
};
exports.convertToStorageError = convertToStorageError;
//# sourceMappingURL=utils.js.map