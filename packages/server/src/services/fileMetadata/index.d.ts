/**
 * File Metadata Manager
 *
 * This service provides functions for managing file metadata in the database.
 * It handles creating, updating, retrieving, and deleting file metadata records,
 * as well as searching and listing files based on various criteria.
 */
import { StorageAuthContext } from '../../utils/storageOperations';
/**
 * File metadata interface
 */
export interface FileMetadata {
    id: string;
    created_at: string;
    name: string;
    content_type: string;
    size: number;
    url: string;
    uuid: string;
    bucket: string;
    path: string;
    context_type: string;
    context_id: string;
    resource_type: string;
    resource_id?: string;
    is_public: boolean;
    access_level: string;
    created_by: string;
    updated_at?: string;
    metadata?: Record<string, any>;
    virtual_path?: string;
}
/**
 * Options for creating file metadata
 */
export interface CreateFileMetadataOptions {
    name: string;
    content_type: string;
    size: number;
    bucket: string;
    path: string;
    context_type: string;
    context_id: string;
    resource_type: string;
    resource_id?: string;
    is_public?: boolean;
    access_level?: string;
    metadata?: Record<string, any>;
    virtual_path?: string;
}
/**
 * Options for updating file metadata
 */
export interface UpdateFileMetadataOptions {
    name?: string;
    content_type?: string;
    size?: number;
    is_public?: boolean;
    access_level?: string;
    metadata?: Record<string, any>;
    virtual_path?: string;
}
/**
 * Options for listing file metadata
 */
export interface ListFileMetadataOptions {
    limit?: number;
    offset?: number;
    sortBy?: {
        column: string;
        order: 'asc' | 'desc';
    };
    filters?: {
        context_type?: string;
        context_id?: string;
        resource_type?: string;
        resource_id?: string;
        is_public?: boolean;
        access_level?: string;
        created_by?: string;
        virtual_path?: string;
        name?: string;
        content_type?: string;
    };
}
/**
 * Creates a new file metadata record in the database
 *
 * @param options - Options for creating the file metadata
 * @param authContext - Authentication context
 * @returns The created file metadata
 * @throws StorageError if creation fails
 */
export declare const createFileMetadata: (options: CreateFileMetadataOptions, authContext: StorageAuthContext) => Promise<FileMetadata>;
/**
 * Updates an existing file metadata record in the database
 *
 * @param fileId - The ID of the file to update
 * @param options - Options for updating the file metadata
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
export declare const updateFileMetadata: (fileId: string, options: UpdateFileMetadataOptions, authContext: StorageAuthContext) => Promise<FileMetadata>;
/**
 * Gets a file metadata record by ID
 *
 * @param fileId - The ID of the file to get
 * @returns The file metadata or null if not found
 * @throws StorageError if retrieval fails
 */
export declare const getFileMetadataById: (fileId: string) => Promise<FileMetadata | null>;
/**
 * Gets a file metadata record by path and bucket
 *
 * @param bucket - The bucket containing the file
 * @param path - The path of the file within the bucket
 * @returns The file metadata or null if not found
 * @throws StorageError if retrieval fails
 */
export declare const getFileMetadataByPath: (bucket: string, path: string) => Promise<FileMetadata | null>;
/**
 * Deletes a file metadata record from the database
 *
 * @param fileId - The ID of the file to delete
 * @returns True if the file was deleted, false if it didn't exist
 * @throws StorageError if deletion fails
 */
export declare const deleteFileMetadata: (fileId: string) => Promise<boolean>;
/**
 * Lists file metadata records based on various criteria
 *
 * @param options - Options for listing file metadata
 * @returns Array of file metadata records
 * @throws StorageError if listing fails
 */
export declare const listFileMetadata: (options?: ListFileMetadataOptions) => Promise<FileMetadata[]>;
/**
 * Searches for file metadata records based on a search term
 *
 * @param searchTerm - The search term to look for in file names and metadata
 * @param options - Additional options for the search
 * @returns Array of file metadata records matching the search
 * @throws StorageError if search fails
 */
export declare const searchFileMetadata: (searchTerm: string, options?: ListFileMetadataOptions) => Promise<FileMetadata[]>;
/**
 * Updates the virtual path of a file
 *
 * @param fileId - The ID of the file to update
 * @param virtualPath - The new virtual path
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
export declare const updateFileVirtualPath: (fileId: string, virtualPath: string, authContext: StorageAuthContext) => Promise<FileMetadata>;
/**
 * Gets files by context (e.g., all files for a specific user, organization, or application)
 *
 * @param contextType - The type of context (user, organization, application, etc.)
 * @param contextId - The ID of the context
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the context
 * @throws StorageError if retrieval fails
 */
export declare const getFilesByContext: (contextType: string, contextId: string, options?: ListFileMetadataOptions) => Promise<FileMetadata[]>;
/**
 * Gets files by resource (e.g., all files for a specific resource type and ID)
 *
 * @param resourceType - The type of resource
 * @param resourceId - The ID of the resource
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the resource
 * @throws StorageError if retrieval fails
 */
export declare const getFilesByResource: (resourceType: string, resourceId: string, options?: ListFileMetadataOptions) => Promise<FileMetadata[]>;
/**
 * Gets files by virtual path
 *
 * @param virtualPath - The virtual path to get files for
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the virtual path
 * @throws StorageError if retrieval fails
 */
export declare const getFilesByVirtualPath: (virtualPath: string, options?: ListFileMetadataOptions) => Promise<FileMetadata[]>;
