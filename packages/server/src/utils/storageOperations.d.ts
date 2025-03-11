/**
 * Storage Operations
 *
 * This file provides core operations for interacting with Supabase Storage.
 * It includes functions for uploading, downloading, listing, and deleting files,
 * with proper authentication handling for both direct user auth and API keys.
 */
import { Request } from 'express';
import { FileObject } from '@supabase/storage-js';
/**
 * Options for file upload
 */
export interface UploadFileOptions {
    /** Content type of the file */
    contentType?: string;
    /** Whether to upsert the file if it already exists */
    upsert?: boolean;
    /** Custom cache control header */
    cacheControl?: string;
    /** Custom metadata for the file */
    metadata?: Record<string, string>;
}
/**
 * Options for getting a signed URL
 */
export interface SignedUrlOptions {
    /** Expiration time in seconds */
    expiresIn?: number;
    /** Download options */
    download?: boolean | string;
    /** Transform options for images */
    transform?: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'origin';
    };
}
/**
 * Options for listing files
 */
export interface ListFilesOptions {
    /** Limit the number of files returned */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** Sort order */
    sortBy?: {
        column: string;
        order: 'asc' | 'desc';
    };
    /** Search query */
    search?: string;
}
/**
 * Authentication context for storage operations
 */
export interface StorageAuthContext {
    /** User ID if authenticated */
    userId?: string;
    /** Application ID */
    appId: string;
    /** Organization ID */
    orgId: string;
    /** API key if using API authentication */
    apiKey?: string;
}
/**
 * Extracts authentication context from a request
 *
 * @param req - Express request object
 * @returns Authentication context
 */
export declare const getAuthContextFromRequest: (req: Request) => StorageAuthContext;
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
export declare const uploadFile: (bucket: string, filePath: string, fileData: Buffer | Blob | File | ArrayBuffer, options?: UploadFileOptions, authContext?: StorageAuthContext) => Promise<{
    path: string;
}>;
/**
 * Gets a public URL for a file
 *
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @returns The public URL of the file
 * @throws StorageError if the bucket is not public or the file doesn't exist
 */
export declare const getPublicUrl: (bucket: string, filePath: string) => string;
/**
 * Creates a signed URL for temporary access to a file
 *
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @param options - Signed URL options
 * @returns The signed URL
 * @throws StorageError if URL creation fails
 */
export declare const createSignedUrl: (bucket: string, filePath: string, options?: SignedUrlOptions) => Promise<string>;
/**
 * Downloads a file from Supabase Storage
 *
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @returns The file data as a Blob
 * @throws StorageError if download fails
 */
export declare const downloadFile: (bucket: string, filePath: string) => Promise<Blob>;
/**
 * Lists files in a bucket or folder
 *
 * @param bucket - The storage bucket to list files from
 * @param folderPath - The folder path within the bucket (optional)
 * @param options - List options
 * @returns Array of file objects
 * @throws StorageError if listing fails
 */
export declare const listFiles: (bucket: string, folderPath?: string, options?: ListFilesOptions) => Promise<FileObject[]>;
/**
 * Deletes files from Supabase Storage
 *
 * @param bucket - The storage bucket containing the files
 * @param filePaths - Array of file paths to delete
 * @returns Array of file paths that were successfully deleted
 * @throws StorageError if deletion fails
 */
export declare const deleteFiles: (bucket: string, filePaths: string[]) => Promise<{
    path: string;
}[]>;
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
export declare const copyFile: (sourceBucket: string, sourceFilePath: string, destinationBucket: string, destinationFilePath: string) => Promise<{
    path: string;
}>;
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
export declare const moveFile: (sourceBucket: string, sourceFilePath: string, destinationBucket: string, destinationFilePath: string) => Promise<{
    path: string;
}>;
