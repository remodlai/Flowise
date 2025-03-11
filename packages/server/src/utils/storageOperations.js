"use strict";
/**
 * Storage Operations
 *
 * This file provides core operations for interacting with Supabase Storage.
 * It includes functions for uploading, downloading, listing, and deleting files,
 * with proper authentication handling for both direct user auth and API keys.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveFile = exports.copyFile = exports.deleteFiles = exports.listFiles = exports.downloadFile = exports.createSignedUrl = exports.getPublicUrl = exports.uploadFile = exports.getAuthContextFromRequest = void 0;
const supabase_1 = require("./supabase");
const storage_1 = require("../constants/storage");
const errors_1 = require("../errors");
const storagePath_1 = require("./storagePath");
/**
 * Extracts authentication context from a request
 *
 * @param req - Express request object
 * @returns Authentication context
 */
const getAuthContextFromRequest = (req) => {
    // Get application ID from body, query, or header
    const appId = req.body?.appId || req.query?.appId || req.headers['x-application-id'];
    // Get organization ID from body, query, or header
    const orgId = req.body?.orgId || req.query?.orgId || req.headers['x-organization-id'];
    // Get user ID from body, query, authenticated user, or generate anonymous ID
    const userId = req.body?.userId || req.query?.userId || req.user?.id;
    // Get API key from header
    const apiKey = req.headers['x-api-key'];
    return {
        userId,
        appId,
        orgId,
        apiKey
    };
};
exports.getAuthContextFromRequest = getAuthContextFromRequest;
/**
 * Uploads a file to Supabase Storage
 *
 * @param bucket - The storage bucket to upload to
 * @param filePath - The path within the bucket
 * @param fileData - The file data to upload
 * @param options - Upload options
 * @param authContext - Authentication context
 * @returns Object containing the file path and metadata
 * @throws StorageError if upload fails
 */
const uploadFile = async (bucket, filePath, fileData, options = {}, authContext) => {
    try {
        // Validate bucket
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(bucket)) {
            throw (0, errors_1.createBucketNotFoundError)(bucket);
        }
        // Validate path
        if (!(0, storagePath_1.isValidStoragePath)(filePath)) {
            throw (0, errors_1.createUploadFailedError)(`Invalid file path: ${filePath}`);
        }
        // Set default content type based on file extension if not provided
        if (!options.contentType) {
            const extension = (0, storagePath_1.getFileExtension)(filePath);
            options.contentType = storage_1.FILE_MIME_TYPES[extension] || 'application/octet-stream';
        }
        // Set default options
        const uploadOptions = {
            cacheControl: options.cacheControl || '3600',
            upsert: options.upsert !== undefined ? options.upsert : false,
            contentType: options.contentType,
            ...(options.metadata ? { metadata: options.metadata } : {})
        };
        // Add auth context to metadata if provided
        if (authContext) {
            uploadOptions.metadata = {
                ...uploadOptions.metadata,
                appId: authContext.appId,
                orgId: authContext.orgId,
                ...(authContext.userId ? { userId: authContext.userId } : {})
            };
        }
        // Upload file
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .upload(filePath, fileData, uploadOptions);
        if (error) {
            throw (0, errors_1.createUploadFailedError)(error.message, {
                bucket,
                path: filePath,
                supabaseError: error
            });
        }
        if (!data) {
            throw (0, errors_1.createUploadFailedError)('Upload returned no data', { bucket, path: filePath });
        }
        return {
            path: data.path
        };
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to upload file to ${bucket}/${filePath}`);
    }
};
exports.uploadFile = uploadFile;
/**
 * Gets a public URL for a file
 *
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @returns The public URL of the file
 * @throws StorageError if the bucket is not public or the file doesn't exist
 */
const getPublicUrl = (bucket, filePath) => {
    try {
        // Validate bucket
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(bucket)) {
            throw (0, errors_1.createBucketNotFoundError)(bucket);
        }
        // Get public URL
        const { data } = supabase_1.supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
        return data.publicUrl;
    }
    catch (error) {
        throw (0, errors_1.convertToStorageError)(error, `Failed to get public URL for ${bucket}/${filePath}`);
    }
};
exports.getPublicUrl = getPublicUrl;
/**
 * Creates a signed URL for temporary access to a file
 *
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @param options - Signed URL options
 * @returns The signed URL
 * @throws StorageError if URL creation fails
 */
const createSignedUrl = async (bucket, filePath, options = {}) => {
    try {
        // Validate bucket
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(bucket)) {
            throw (0, errors_1.createBucketNotFoundError)(bucket);
        }
        // Set default expiration
        const expiresIn = options.expiresIn || storage_1.SIGNED_URL_EXPIRATION.MEDIUM;
        // Create signed URL with compatible transform options
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn, {
            download: options.download,
            transform: options.transform ? {
                width: options.transform.width,
                height: options.transform.height,
                quality: options.transform.quality,
                format: options.transform.format
            } : undefined
        });
        if (error) {
            throw (0, errors_1.convertToStorageError)(error, `Failed to create signed URL for ${bucket}/${filePath}`);
        }
        if (!data || !data.signedUrl) {
            throw (0, errors_1.createFileNotFoundError)(filePath, { bucket });
        }
        return data.signedUrl;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to create signed URL for ${bucket}/${filePath}`);
    }
};
exports.createSignedUrl = createSignedUrl;
/**
 * Downloads a file from Supabase Storage
 *
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @returns The file data as a Blob
 * @throws StorageError if download fails
 */
const downloadFile = async (bucket, filePath) => {
    try {
        // Validate bucket
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(bucket)) {
            throw (0, errors_1.createBucketNotFoundError)(bucket);
        }
        // Download file
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .download(filePath);
        if (error) {
            throw (0, errors_1.createDownloadFailedError)(filePath, error.message, {
                bucket,
                supabaseError: error
            });
        }
        if (!data) {
            throw (0, errors_1.createFileNotFoundError)(filePath, { bucket });
        }
        return data;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to download file from ${bucket}/${filePath}`);
    }
};
exports.downloadFile = downloadFile;
/**
 * Lists files in a bucket or folder
 *
 * @param bucket - The storage bucket to list files from
 * @param folderPath - The folder path within the bucket (optional)
 * @param options - List options
 * @returns Array of file objects
 * @throws StorageError if listing fails
 */
const listFiles = async (bucket, folderPath, options = {}) => {
    try {
        // Validate bucket
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(bucket)) {
            throw (0, errors_1.createBucketNotFoundError)(bucket);
        }
        // Set up options
        const listOptions = {};
        if (options.limit)
            listOptions.limit = options.limit;
        if (options.offset)
            listOptions.offset = options.offset;
        if (options.sortBy)
            listOptions.sortBy = options.sortBy;
        if (options.search)
            listOptions.search = options.search;
        // List files
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .list(folderPath || '', listOptions);
        if (error) {
            throw (0, errors_1.convertToStorageError)(error, `Failed to list files in ${bucket}/${folderPath || ''}`);
        }
        return data || [];
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to list files in ${bucket}/${folderPath || ''}`);
    }
};
exports.listFiles = listFiles;
/**
 * Deletes files from Supabase Storage
 *
 * @param bucket - The storage bucket containing the files
 * @param filePaths - Array of file paths to delete
 * @returns Array of file paths that were successfully deleted
 * @throws StorageError if deletion fails
 */
const deleteFiles = async (bucket, filePaths) => {
    try {
        // Validate bucket
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(bucket)) {
            throw (0, errors_1.createBucketNotFoundError)(bucket);
        }
        // Delete files
        const { data, error } = await supabase_1.supabase.storage
            .from(bucket)
            .remove(filePaths);
        if (error) {
            throw (0, errors_1.createDeleteFailedError)(filePaths.join(', '), error.message, {
                bucket,
                supabaseError: error
            });
        }
        // Convert string[] to { path: string }[] if needed
        if (data && Array.isArray(data)) {
            return data.map(path => ({ path: typeof path === 'string' ? path : path.name }));
        }
        return [];
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to delete files from ${bucket}`);
    }
};
exports.deleteFiles = deleteFiles;
/**
 * Copies a file within Supabase Storage
 *
 * @param sourceBucket - The source bucket
 * @param sourceFilePath - The source file path
 * @param destinationBucket - The destination bucket
 * @param destinationFilePath - The destination file path
 * @returns Object containing the destination path
 * @throws StorageError if copy fails
 */
const copyFile = async (sourceBucket, sourceFilePath, destinationBucket, destinationFilePath) => {
    try {
        // Validate buckets
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(sourceBucket)) {
            throw (0, errors_1.createBucketNotFoundError)(sourceBucket);
        }
        if (!Object.values(storage_1.STORAGE_BUCKETS).includes(destinationBucket)) {
            throw (0, errors_1.createBucketNotFoundError)(destinationBucket);
        }
        // Download source file
        const sourceFile = await (0, exports.downloadFile)(sourceBucket, sourceFilePath);
        // Upload to destination
        const result = await (0, exports.uploadFile)(destinationBucket, destinationFilePath, sourceFile);
        return { path: result.path };
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to copy file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`);
    }
};
exports.copyFile = copyFile;
/**
 * Moves a file within Supabase Storage (copy and delete)
 *
 * @param sourceBucket - The source bucket
 * @param sourceFilePath - The source file path
 * @param destinationBucket - The destination bucket
 * @param destinationFilePath - The destination file path
 * @returns Object containing the destination path
 * @throws StorageError if move fails
 */
const moveFile = async (sourceBucket, sourceFilePath, destinationBucket, destinationFilePath) => {
    try {
        // Copy the file
        const copyResult = await (0, exports.copyFile)(sourceBucket, sourceFilePath, destinationBucket, destinationFilePath);
        // Delete the source file
        await (0, exports.deleteFiles)(sourceBucket, [sourceFilePath]);
        return { path: copyResult.path };
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to move file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`);
    }
};
exports.moveFile = moveFile;
//# sourceMappingURL=storageOperations.js.map