"use strict";
/**
 * Supabase Storage Service
 *
 * This service provides high-level functions for managing files in Supabase Storage.
 * It combines core storage operations with file metadata management to provide
 * a unified interface for file management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIGNED_URL_EXPIRATION = exports.FILE_RESOURCE_TYPES = exports.FILE_CONTEXT_TYPES = exports.FILE_ACCESS_LEVELS = exports.STORAGE_BUCKETS = exports.getApplicationFiles = exports.getOrganizationFiles = exports.getUserFiles = exports.uploadProfilePicture = exports.uploadApplicationFile = exports.uploadOrganizationFile = exports.uploadUserFile = exports.copyFile = exports.moveFileVirtualPath = exports.searchFiles = exports.updateFile = exports.listFiles = exports.deleteFile = exports.downloadFile = exports.getFileUrl = exports.uploadFile = void 0;
const storageOperations_1 = require("../../utils/storageOperations");
const fileMetadata_1 = require("../fileMetadata");
const storagePath_1 = require("../../utils/storagePath");
const storage_1 = require("../../constants/storage");
Object.defineProperty(exports, "STORAGE_BUCKETS", { enumerable: true, get: function () { return storage_1.STORAGE_BUCKETS; } });
Object.defineProperty(exports, "FILE_ACCESS_LEVELS", { enumerable: true, get: function () { return storage_1.FILE_ACCESS_LEVELS; } });
Object.defineProperty(exports, "FILE_CONTEXT_TYPES", { enumerable: true, get: function () { return storage_1.FILE_CONTEXT_TYPES; } });
Object.defineProperty(exports, "FILE_RESOURCE_TYPES", { enumerable: true, get: function () { return storage_1.FILE_RESOURCE_TYPES; } });
Object.defineProperty(exports, "SIGNED_URL_EXPIRATION", { enumerable: true, get: function () { return storage_1.SIGNED_URL_EXPIRATION; } });
const errors_1 = require("../../errors");
/**
 * Uploads a file to Supabase Storage and creates file metadata
 *
 * @param bucket - The storage bucket to upload to
 * @param fileData - The file data to upload
 * @param options - Upload options
 * @param authContext - Authentication context
 * @returns The uploaded file metadata and URL
 * @throws StorageError if upload fails
 */
const uploadFile = async (bucket, fileData, options, authContext) => {
    try {
        // Generate storage path
        const filePath = (0, storagePath_1.generateStoragePath)({
            contextType: options.contextType,
            contextId: options.contextId,
            resourceType: options.resourceType,
            resourceId: options.resourceId,
            includeUuid: options.includeUuid !== undefined ? options.includeUuid : true,
            folderName: options.folderName,
            originalFilename: options.name
        });
        // Upload file to storage
        const uploadResult = await (0, storageOperations_1.uploadFile)(bucket, filePath, fileData, {
            contentType: options.contentType,
            upsert: options.upsert,
            cacheControl: options.cacheControl,
            metadata: options.metadata
        }, authContext);
        // Create file metadata
        const fileMetadata = await (0, fileMetadata_1.createFileMetadata)({
            name: options.name,
            content_type: options.contentType,
            size: fileData instanceof Buffer ? fileData.length :
                fileData instanceof Blob ? fileData.size :
                    fileData instanceof File ? fileData.size :
                        fileData.byteLength,
            bucket,
            path: uploadResult.path,
            context_type: options.contextType,
            context_id: options.contextId,
            resource_type: options.resourceType,
            resource_id: options.resourceId,
            is_public: options.isPublic !== undefined ? options.isPublic : false,
            access_level: options.accessLevel || storage_1.FILE_ACCESS_LEVELS.PRIVATE,
            metadata: options.metadata,
            virtual_path: options.virtualPath
        }, authContext);
        // Get file URL
        const url = options.isPublic ?
            (0, storageOperations_1.getPublicUrl)(bucket, uploadResult.path) :
            await (0, storageOperations_1.createSignedUrl)(bucket, uploadResult.path, { expiresIn: storage_1.SIGNED_URL_EXPIRATION.MEDIUM });
        return {
            file: fileMetadata,
            url
        };
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, 'Failed to upload file');
    }
};
exports.uploadFile = uploadFile;
/**
 * Gets a file URL (public or signed)
 *
 * @param fileId - The ID of the file
 * @param options - URL options
 * @returns The file URL
 * @throws StorageError if URL generation fails
 */
const getFileUrl = async (fileId, options = {}) => {
    try {
        // Get file metadata
        const fileMetadata = await (0, fileMetadata_1.getFileMetadataById)(fileId);
        if (!fileMetadata) {
            throw (0, errors_1.createFileNotFoundError)(fileId);
        }
        // Get URL based on options
        if (fileMetadata.is_public && !options.signed) {
            return (0, storageOperations_1.getPublicUrl)(fileMetadata.bucket, fileMetadata.path);
        }
        else {
            return await (0, storageOperations_1.createSignedUrl)(fileMetadata.bucket, fileMetadata.path, {
                expiresIn: options.expiresIn || storage_1.SIGNED_URL_EXPIRATION.MEDIUM,
                download: options.download,
                transform: options.transform
            });
        }
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to get URL for file ${fileId}`);
    }
};
exports.getFileUrl = getFileUrl;
/**
 * Downloads a file from Supabase Storage
 *
 * @param fileId - The ID of the file to download
 * @returns The file data and metadata
 * @throws StorageError if download fails
 */
const downloadFile = async (fileId) => {
    try {
        // Get file metadata
        const fileMetadata = await (0, fileMetadata_1.getFileMetadataById)(fileId);
        if (!fileMetadata) {
            throw (0, errors_1.createFileNotFoundError)(fileId);
        }
        // Download file
        const data = await (0, storageOperations_1.downloadFile)(fileMetadata.bucket, fileMetadata.path);
        return {
            data,
            file: fileMetadata
        };
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to download file ${fileId}`);
    }
};
exports.downloadFile = downloadFile;
/**
 * Deletes a file from Supabase Storage and its metadata
 *
 * @param fileId - The ID of the file to delete
 * @param authContext - Authentication context
 * @returns True if the file was deleted
 * @throws StorageError if deletion fails
 */
const deleteFile = async (fileId, authContext) => {
    try {
        // Get file metadata
        const fileMetadata = await (0, fileMetadata_1.getFileMetadataById)(fileId);
        if (!fileMetadata) {
            return false;
        }
        // Check if user has permission to delete the file
        if (fileMetadata.created_by !== authContext.userId &&
            fileMetadata.context_id !== authContext.appId &&
            fileMetadata.context_id !== authContext.orgId) {
            throw (0, errors_1.createPermissionDeniedError)(fileId, authContext.userId || 'anonymous');
        }
        // Delete file from storage
        await (0, storageOperations_1.deleteFiles)(fileMetadata.bucket, [fileMetadata.path]);
        // Delete file metadata
        return await (0, fileMetadata_1.deleteFileMetadata)(fileId);
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to delete file ${fileId}`);
    }
};
exports.deleteFile = deleteFile;
/**
 * Lists files based on various criteria
 *
 * @param options - List options
 * @returns The files and total count
 * @throws StorageError if listing fails
 */
const listFiles = async (options = {}) => {
    try {
        // List files
        const files = await (0, fileMetadata_1.listFileMetadata)(options);
        return {
            files,
            total: files.length
        };
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, 'Failed to list files');
    }
};
exports.listFiles = listFiles;
/**
 * Updates a file's metadata
 *
 * @param fileId - The ID of the file to update
 * @param options - Update options
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
const updateFile = async (fileId, options, authContext) => {
    try {
        // Get file metadata
        const fileMetadata = await (0, fileMetadata_1.getFileMetadataById)(fileId);
        if (!fileMetadata) {
            throw (0, errors_1.createFileNotFoundError)(fileId);
        }
        // Check if user has permission to update the file
        if (fileMetadata.created_by !== authContext.userId &&
            fileMetadata.context_id !== authContext.appId &&
            fileMetadata.context_id !== authContext.orgId) {
            throw (0, errors_1.createPermissionDeniedError)(fileId, authContext.userId || 'anonymous');
        }
        // Update file metadata
        return await (0, fileMetadata_1.updateFileMetadata)(fileId, {
            name: options.name,
            content_type: options.contentType,
            is_public: options.isPublic,
            access_level: options.accessLevel,
            metadata: options.metadata,
            virtual_path: options.virtualPath
        }, authContext);
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to update file ${fileId}`);
    }
};
exports.updateFile = updateFile;
/**
 * Searches for files based on a search term
 *
 * @param searchTerm - The search term
 * @param options - Search options
 * @returns The matching files and total count
 * @throws StorageError if search fails
 */
const searchFiles = async (searchTerm, options = {}) => {
    try {
        // Search files
        const files = await (0, fileMetadata_1.searchFileMetadata)(searchTerm, options);
        return {
            files,
            total: files.length
        };
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to search files for "${searchTerm}"`);
    }
};
exports.searchFiles = searchFiles;
/**
 * Moves a file to a new virtual path
 *
 * @param fileId - The ID of the file to move
 * @param virtualPath - The new virtual path
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if move fails
 */
const moveFileVirtualPath = async (fileId, virtualPath, authContext) => {
    try {
        // Get file metadata
        const fileMetadata = await (0, fileMetadata_1.getFileMetadataById)(fileId);
        if (!fileMetadata) {
            throw (0, errors_1.createFileNotFoundError)(fileId);
        }
        // Check if user has permission to move the file
        if (fileMetadata.created_by !== authContext.userId &&
            fileMetadata.context_id !== authContext.appId &&
            fileMetadata.context_id !== authContext.orgId) {
            throw (0, errors_1.createPermissionDeniedError)(fileId, authContext.userId || 'anonymous');
        }
        // Update file virtual path
        return await (0, fileMetadata_1.updateFileVirtualPath)(fileId, virtualPath, authContext);
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to move file ${fileId} to ${virtualPath}`);
    }
};
exports.moveFileVirtualPath = moveFileVirtualPath;
/**
 * Copies a file to a new location
 *
 * @param fileId - The ID of the file to copy
 * @param destinationOptions - Options for the destination file
 * @param authContext - Authentication context
 * @returns The new file metadata and URL
 * @throws StorageError if copy fails
 */
const copyFile = async (fileId, destinationOptions, authContext) => {
    try {
        // Get file metadata
        const fileMetadata = await (0, fileMetadata_1.getFileMetadataById)(fileId);
        if (!fileMetadata) {
            throw (0, errors_1.createFileNotFoundError)(fileId);
        }
        // Download file
        const { data } = await (0, exports.downloadFile)(fileId);
        // Upload to new location
        return await (0, exports.uploadFile)(destinationOptions.resourceType === storage_1.FILE_RESOURCE_TYPES.PROFILE_PICTURE ?
            storage_1.STORAGE_BUCKETS.PROFILES :
            fileMetadata.bucket, data, {
            ...destinationOptions,
            contentType: destinationOptions.contentType || fileMetadata.content_type,
            metadata: {
                ...fileMetadata.metadata,
                ...destinationOptions.metadata,
                originalFileId: fileId
            }
        }, authContext);
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to copy file ${fileId}`);
    }
};
exports.copyFile = copyFile;
/**
 * Uploads a user file
 *
 * @param userId - The ID of the user
 * @param fileData - The file data to upload
 * @param options - Upload options
 * @param authContext - Authentication context
 * @returns The uploaded file metadata and URL
 * @throws StorageError if upload fails
 */
const uploadUserFile = async (userId, fileData, options, authContext) => {
    return (0, exports.uploadFile)(storage_1.STORAGE_BUCKETS.USER_FILES, fileData, {
        ...options,
        contextType: storage_1.FILE_CONTEXT_TYPES.USER,
        contextId: userId
    }, authContext);
};
exports.uploadUserFile = uploadUserFile;
/**
 * Uploads an organization file
 *
 * @param organizationId - The ID of the organization
 * @param fileData - The file data to upload
 * @param options - Upload options
 * @param authContext - Authentication context
 * @returns The uploaded file metadata and URL
 * @throws StorageError if upload fails
 */
const uploadOrganizationFile = async (organizationId, fileData, options, authContext) => {
    return (0, exports.uploadFile)(storage_1.STORAGE_BUCKETS.ORGANIZATIONS, fileData, {
        ...options,
        contextType: storage_1.FILE_CONTEXT_TYPES.ORGANIZATION,
        contextId: organizationId
    }, authContext);
};
exports.uploadOrganizationFile = uploadOrganizationFile;
/**
 * Uploads an application file
 *
 * @param applicationId - The ID of the application
 * @param fileData - The file data to upload
 * @param options - Upload options
 * @param authContext - Authentication context
 * @returns The uploaded file metadata and URL
 * @throws StorageError if upload fails
 */
const uploadApplicationFile = async (applicationId, fileData, options, authContext) => {
    return (0, exports.uploadFile)(storage_1.STORAGE_BUCKETS.APPS, fileData, {
        ...options,
        contextType: storage_1.FILE_CONTEXT_TYPES.APPLICATION,
        contextId: applicationId
    }, authContext);
};
exports.uploadApplicationFile = uploadApplicationFile;
/**
 * Uploads a profile picture
 *
 * @param userId - The ID of the user
 * @param fileData - The file data to upload
 * @param options - Upload options
 * @param authContext - Authentication context
 * @returns The uploaded file metadata and URL
 * @throws StorageError if upload fails
 */
const uploadProfilePicture = async (userId, fileData, options, authContext) => {
    return (0, exports.uploadFile)(storage_1.STORAGE_BUCKETS.PROFILES, fileData, {
        ...options,
        contextType: storage_1.FILE_CONTEXT_TYPES.USER,
        contextId: userId,
        resourceType: storage_1.FILE_RESOURCE_TYPES.PROFILE_PICTURE,
        isPublic: options.isPublic !== undefined ? options.isPublic : true
    }, authContext);
};
exports.uploadProfilePicture = uploadProfilePicture;
/**
 * Gets user files
 *
 * @param userId - The ID of the user
 * @param options - List options
 * @returns The user files and total count
 * @throws StorageError if listing fails
 */
const getUserFiles = async (userId, options = {}) => {
    const files = await (0, fileMetadata_1.getFilesByContext)(storage_1.FILE_CONTEXT_TYPES.USER, userId, {
        ...options,
        filters: {
            ...options.filters,
            context_type: storage_1.FILE_CONTEXT_TYPES.USER,
            context_id: userId
        }
    });
    return {
        files,
        total: files.length
    };
};
exports.getUserFiles = getUserFiles;
/**
 * Gets organization files
 *
 * @param organizationId - The ID of the organization
 * @param options - List options
 * @returns The organization files and total count
 * @throws StorageError if listing fails
 */
const getOrganizationFiles = async (organizationId, options = {}) => {
    const files = await (0, fileMetadata_1.getFilesByContext)(storage_1.FILE_CONTEXT_TYPES.ORGANIZATION, organizationId, {
        ...options,
        filters: {
            ...options.filters,
            context_type: storage_1.FILE_CONTEXT_TYPES.ORGANIZATION,
            context_id: organizationId
        }
    });
    return {
        files,
        total: files.length
    };
};
exports.getOrganizationFiles = getOrganizationFiles;
/**
 * Gets application files
 *
 * @param applicationId - The ID of the application
 * @param options - List options
 * @returns The application files and total count
 * @throws StorageError if listing fails
 */
const getApplicationFiles = async (applicationId, options = {}) => {
    const files = await (0, fileMetadata_1.getFilesByContext)(storage_1.FILE_CONTEXT_TYPES.APPLICATION, applicationId, {
        ...options,
        filters: {
            ...options.filters,
            context_type: storage_1.FILE_CONTEXT_TYPES.APPLICATION,
            context_id: applicationId
        }
    });
    return {
        files,
        total: files.length
    };
};
exports.getApplicationFiles = getApplicationFiles;
//# sourceMappingURL=index.js.map