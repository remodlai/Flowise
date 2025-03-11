/**
 * Supabase Storage Service
 *
 * This service provides high-level functions for managing files in Supabase Storage.
 * It combines core storage operations with file metadata management to provide
 * a unified interface for file management.
 */
import { StorageAuthContext } from '../../utils/storageOperations';
import { FileMetadata, ListFileMetadataOptions } from '../fileMetadata';
import { STORAGE_BUCKETS, FILE_ACCESS_LEVELS, FILE_CONTEXT_TYPES, FILE_RESOURCE_TYPES, SIGNED_URL_EXPIRATION } from '../../constants/storage';
/**
 * Options for uploading a file
 */
export interface UploadFileOptions {
    /** The name of the file */
    name: string;
    /** The content type of the file */
    contentType: string;
    /** The context type (user, organization, application, etc.) */
    contextType: string;
    /** The ID of the context */
    contextId: string;
    /** The resource type (document, image, etc.) */
    resourceType: string;
    /** The ID of the resource (optional) */
    resourceId?: string;
    /** Whether the file is publicly accessible (optional) */
    isPublic?: boolean;
    /** The access level of the file (optional) */
    accessLevel?: string;
    /** Custom metadata for the file (optional) */
    metadata?: Record<string, any>;
    /** Virtual path for organizing files in the UI (optional) */
    virtualPath?: string;
    /** Whether to upsert the file if it already exists (optional) */
    upsert?: boolean;
    /** Custom cache control header (optional) */
    cacheControl?: string;
    /** Whether to include a UUID in the filename (optional) */
    includeUuid?: boolean;
    /** Custom folder name to include in the path (optional) */
    folderName?: string;
}
/**
 * Options for getting a file URL
 */
export interface GetFileUrlOptions {
    /** Whether to create a signed URL (optional) */
    signed?: boolean;
    /** Expiration time in seconds for signed URLs (optional) */
    expiresIn?: number;
    /** Download options for signed URLs (optional) */
    download?: boolean | string;
    /** Transform options for images (optional) */
    transform?: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'origin';
    };
}
/**
 * Options for updating a file
 */
export interface UpdateFileOptions {
    /** The new name of the file (optional) */
    name?: string;
    /** The new content type of the file (optional) */
    contentType?: string;
    /** Whether the file is publicly accessible (optional) */
    isPublic?: boolean;
    /** The new access level of the file (optional) */
    accessLevel?: string;
    /** Custom metadata to merge with existing metadata (optional) */
    metadata?: Record<string, any>;
    /** New virtual path for organizing files in the UI (optional) */
    virtualPath?: string;
}
/**
 * Result of a file upload operation
 */
export interface UploadFileResult {
    /** The file metadata */
    file: FileMetadata;
    /** The URL of the file */
    url: string;
}
/**
 * Result of a file download operation
 */
export interface DownloadFileResult {
    /** The file data */
    data: Blob;
    /** The file metadata */
    file: FileMetadata;
}
/**
 * Result of a file listing operation
 */
export interface ListFilesResult {
    /** The files */
    files: FileMetadata[];
    /** The total number of files */
    total: number;
}
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
export declare const uploadFile: (bucket: string, fileData: Buffer | Blob | File | ArrayBuffer, options: UploadFileOptions, authContext: StorageAuthContext) => Promise<UploadFileResult>;
/**
 * Gets a file URL (public or signed)
 *
 * @param fileId - The ID of the file
 * @param options - URL options
 * @returns The file URL
 * @throws StorageError if URL generation fails
 */
export declare const getFileUrl: (fileId: string, options?: GetFileUrlOptions) => Promise<string>;
/**
 * Downloads a file from Supabase Storage
 *
 * @param fileId - The ID of the file to download
 * @returns The file data and metadata
 * @throws StorageError if download fails
 */
export declare const downloadFile: (fileId: string) => Promise<DownloadFileResult>;
/**
 * Deletes a file from Supabase Storage and its metadata
 *
 * @param fileId - The ID of the file to delete
 * @param authContext - Authentication context
 * @returns True if the file was deleted
 * @throws StorageError if deletion fails
 */
export declare const deleteFile: (fileId: string, authContext: StorageAuthContext) => Promise<boolean>;
/**
 * Lists files based on various criteria
 *
 * @param options - List options
 * @returns The files and total count
 * @throws StorageError if listing fails
 */
export declare const listFiles: (options?: ListFileMetadataOptions) => Promise<ListFilesResult>;
/**
 * Updates a file's metadata
 *
 * @param fileId - The ID of the file to update
 * @param options - Update options
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
export declare const updateFile: (fileId: string, options: UpdateFileOptions, authContext: StorageAuthContext) => Promise<FileMetadata>;
/**
 * Searches for files based on a search term
 *
 * @param searchTerm - The search term
 * @param options - Search options
 * @returns The matching files and total count
 * @throws StorageError if search fails
 */
export declare const searchFiles: (searchTerm: string, options?: ListFileMetadataOptions) => Promise<ListFilesResult>;
/**
 * Moves a file to a new virtual path
 *
 * @param fileId - The ID of the file to move
 * @param virtualPath - The new virtual path
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if move fails
 */
export declare const moveFileVirtualPath: (fileId: string, virtualPath: string, authContext: StorageAuthContext) => Promise<FileMetadata>;
/**
 * Copies a file to a new location
 *
 * @param fileId - The ID of the file to copy
 * @param destinationOptions - Options for the destination file
 * @param authContext - Authentication context
 * @returns The new file metadata and URL
 * @throws StorageError if copy fails
 */
export declare const copyFile: (fileId: string, destinationOptions: UploadFileOptions, authContext: StorageAuthContext) => Promise<UploadFileResult>;
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
export declare const uploadUserFile: (userId: string, fileData: Buffer | Blob | File | ArrayBuffer, options: Omit<UploadFileOptions, "contextType" | "contextId">, authContext: StorageAuthContext) => Promise<UploadFileResult>;
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
export declare const uploadOrganizationFile: (organizationId: string, fileData: Buffer | Blob | File | ArrayBuffer, options: Omit<UploadFileOptions, "contextType" | "contextId">, authContext: StorageAuthContext) => Promise<UploadFileResult>;
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
export declare const uploadApplicationFile: (applicationId: string, fileData: Buffer | Blob | File | ArrayBuffer, options: Omit<UploadFileOptions, "contextType" | "contextId">, authContext: StorageAuthContext) => Promise<UploadFileResult>;
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
export declare const uploadProfilePicture: (userId: string, fileData: Buffer | Blob | File | ArrayBuffer, options: Omit<UploadFileOptions, "contextType" | "contextId" | "resourceType">, authContext: StorageAuthContext) => Promise<UploadFileResult>;
/**
 * Gets user files
 *
 * @param userId - The ID of the user
 * @param options - List options
 * @returns The user files and total count
 * @throws StorageError if listing fails
 */
export declare const getUserFiles: (userId: string, options?: Omit<ListFileMetadataOptions, "filters"> & {
    filters?: Omit<ListFileMetadataOptions["filters"], "context_type" | "context_id">;
}) => Promise<ListFilesResult>;
/**
 * Gets organization files
 *
 * @param organizationId - The ID of the organization
 * @param options - List options
 * @returns The organization files and total count
 * @throws StorageError if listing fails
 */
export declare const getOrganizationFiles: (organizationId: string, options?: Omit<ListFileMetadataOptions, "filters"> & {
    filters?: Omit<ListFileMetadataOptions["filters"], "context_type" | "context_id">;
}) => Promise<ListFilesResult>;
/**
 * Gets application files
 *
 * @param applicationId - The ID of the application
 * @param options - List options
 * @returns The application files and total count
 * @throws StorageError if listing fails
 */
export declare const getApplicationFiles: (applicationId: string, options?: Omit<ListFileMetadataOptions, "filters"> & {
    filters?: Omit<ListFileMetadataOptions["filters"], "context_type" | "context_id">;
}) => Promise<ListFilesResult>;
export { STORAGE_BUCKETS, FILE_ACCESS_LEVELS, FILE_CONTEXT_TYPES, FILE_RESOURCE_TYPES, SIGNED_URL_EXPIRATION };
