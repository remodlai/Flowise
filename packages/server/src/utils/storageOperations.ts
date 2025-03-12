/**
 * Storage Operations
 * 
 * This file provides core operations for interacting with Supabase Storage.
 * It includes functions for uploading, downloading, listing, and deleting files,
 * with proper authentication handling for both direct user auth and API keys.
 */

import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { 
  STORAGE_BUCKETS, 
  FILE_MIME_TYPES,
  SIGNED_URL_EXPIRATION
} from '../constants/storage'
import { 
  StorageError, 
  createUploadFailedError,
  createDownloadFailedError,
  createDeleteFailedError,
  createBucketNotFoundError,
  createFileNotFoundError,
  convertToStorageError
} from '../errors'
import { isValidStoragePath, getFileExtension } from './storagePath'
import { Request } from 'express'
import { FileObject } from '@supabase/storage-js'

/**
 * Options for file upload
 */
export interface UploadFileOptions {
  /** Content type of the file */
  contentType?: string
  /** Whether to upsert the file if it already exists */
  upsert?: boolean
  /** Custom cache control header */
  cacheControl?: string
  /** Custom metadata for the file */
  metadata?: Record<string, string>
}

/**
 * Options for getting a signed URL
 */
export interface SignedUrlOptions {
  /** Expiration time in seconds */
  expiresIn?: number
  /** Download options */
  download?: boolean | string
  /** Transform options for images */
  transform?: {
    width?: number
    height?: number
    quality?: number
    format?: 'origin'
  }
}

/**
 * Options for listing files
 */
export interface ListFilesOptions {
  /** Limit the number of files returned */
  limit?: number
  /** Offset for pagination */
  offset?: number
  /** Sort order */
  sortBy?: {
    column: string
    order: 'asc' | 'desc'
  }
  /** Search query */
  search?: string
}

/**
 * Authentication context for storage operations
 */
export interface StorageAuthContext {
  /** User ID if authenticated */
  userId?: string
  /** Application ID */
  appId: string
  /** Organization ID */
  orgId: string
  /** API key if using API authentication */
  apiKey?: string
}

/**
 * Extracts authentication context from a request
 * 
 * @param req - Express request object
 * @returns Authentication context
 */
export const getAuthContextFromRequest = (req: Request): StorageAuthContext => {
  // Get application ID from body, query, or header
  const appId = req.body?.appId || req.query?.appId || req.headers['x-application-id']
  
  // Get organization ID from body, query, or header
  const orgId = req.body?.orgId || req.query?.orgId || req.headers['x-organization-id']
  
  // Get user ID from body, query, authenticated user, or generate anonymous ID
  const userId = req.body?.userId || req.query?.userId || req.user?.id
  
  // Get API key from header
  const apiKey = req.headers['x-api-key'] as string

  return {
    userId,
    appId,
    orgId,
    apiKey
  }
}

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
export const uploadFile = async (
  bucket: string,
  filePath: string,
  fileData: Buffer | Blob | File | ArrayBuffer,
  options: UploadFileOptions = {},
  authContext?: StorageAuthContext
): Promise<{ path: string }> => {
  try {
    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
      throw createBucketNotFoundError(bucket)
    }

    // Validate path
    if (!isValidStoragePath(filePath)) {
      throw createUploadFailedError(`Invalid file path: ${filePath}`)
    }

    // Set default content type based on file extension if not provided
    if (!options.contentType) {
      const extension = getFileExtension(filePath)
      options.contentType = FILE_MIME_TYPES[extension as keyof typeof FILE_MIME_TYPES] || 'application/octet-stream'
    }

    // Set default options
    const uploadOptions = {
      cacheControl: options.cacheControl || '3600',
      upsert: options.upsert !== undefined ? options.upsert : false,
      contentType: options.contentType,
      ...(options.metadata ? { metadata: options.metadata } : {})
    }

    // Add auth context to metadata if provided
    if (authContext) {
      uploadOptions.metadata = {
        ...uploadOptions.metadata,
        appId: authContext.appId,
        orgId: authContext.orgId,
        ...(authContext.userId ? { userId: authContext.userId } : {})
      }
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, uploadOptions)

    if (error) {
      throw createUploadFailedError(error.message, { 
        bucket, 
        path: filePath, 
        supabaseError: error 
      })
    }

    if (!data) {
      throw createUploadFailedError('Upload returned no data', { bucket, path: filePath })
    }

    return {
      path: data.path
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to upload file to ${bucket}/${filePath}`)
  }
}

/**
 * Gets a public URL for a file
 * 
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @returns The public URL of the file
 * @throws StorageError if the bucket is not public or the file doesn't exist
 */
export const getPublicUrl = (
  bucket: string,
  filePath: string
): string => {
  try {
    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
      throw createBucketNotFoundError(bucket)
    }

    // Get public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    throw convertToStorageError(error, `Failed to get public URL for ${bucket}/${filePath}`)
  }
}

/**
 * Creates a signed URL for temporary access to a file
 * 
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @param options - Signed URL options
 * @returns The signed URL
 * @throws StorageError if URL creation fails
 */
export const createSignedUrl = async (
  bucket: string,
  filePath: string,
  options: SignedUrlOptions = {}
): Promise<string> => {
  try {
    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
      throw createBucketNotFoundError(bucket)
    }

    // Set default expiration
    const expiresIn = options.expiresIn || SIGNED_URL_EXPIRATION.MEDIUM

    // Create signed URL with compatible transform options
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn, {
        download: options.download,
        transform: options.transform ? {
          width: options.transform.width,
          height: options.transform.height,
          quality: options.transform.quality,
          format: options.transform.format
        } : undefined
      })

    if (error) {
      throw convertToStorageError(error, `Failed to create signed URL for ${bucket}/${filePath}`)
    }

    if (!data || !data.signedUrl) {
      throw createFileNotFoundError(filePath, { bucket })
    }

    return data.signedUrl
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to create signed URL for ${bucket}/${filePath}`)
  }
}

/**
 * Downloads a file from Supabase Storage
 * 
 * @param bucket - The storage bucket containing the file
 * @param filePath - The path of the file within the bucket
 * @returns The file data as a Blob
 * @throws StorageError if download fails
 */
export const downloadFile = async (
  bucket: string,
  filePath: string
): Promise<Blob> => {
  try {
    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
      throw createBucketNotFoundError(bucket)
    }

    // Download file
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)

    if (error) {
      throw createDownloadFailedError(filePath, error.message, { 
        bucket, 
        supabaseError: error 
      })
    }

    if (!data) {
      throw createFileNotFoundError(filePath, { bucket })
    }

    return data
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to download file from ${bucket}/${filePath}`)
  }
}

/**
 * Lists files in a bucket or folder
 * 
 * @param bucket - The storage bucket to list files from
 * @param folderPath - The folder path within the bucket (optional)
 * @param options - List options
 * @returns Array of file objects
 * @throws StorageError if listing fails
 */
export const listFiles = async (
  bucket: string,
  folderPath?: string,
  options: ListFilesOptions = {}
): Promise<FileObject[]> => {
  try {
    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
      throw createBucketNotFoundError(bucket)
    }

    // Set up options
    const listOptions: any = {}
    if (options.limit) listOptions.limit = options.limit
    if (options.offset) listOptions.offset = options.offset
    if (options.sortBy) listOptions.sortBy = options.sortBy
    if (options.search) listOptions.search = options.search

    // List files
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath || '', listOptions)

    if (error) {
      throw convertToStorageError(error, `Failed to list files in ${bucket}/${folderPath || ''}`)
    }

    return data || []
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to list files in ${bucket}/${folderPath || ''}`)
  }
}

/**
 * Deletes files from Supabase Storage
 * 
 * @param bucket - The storage bucket containing the files
 * @param filePaths - Array of file paths to delete
 * @returns Array of file paths that were successfully deleted
 * @throws StorageError if deletion fails
 */
export const deleteFiles = async (
  bucket: string,
  filePaths: string[]
): Promise<{ path: string }[]> => {
  try {
    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket)) {
      throw createBucketNotFoundError(bucket)
    }

    // Delete files
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(filePaths)

    if (error) {
      throw createDeleteFailedError(filePaths.join(', '), error.message, { 
        bucket, 
        supabaseError: error 
      })
    }

    // Convert string[] to { path: string }[] if needed
    if (data && Array.isArray(data)) {
      return data.map(path => ({ path: typeof path === 'string' ? path : path.name }))
    }

    return []
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to delete files from ${bucket}`)
  }
}

/**
 * Copies a file within Supabase Storage using the native Supabase Storage copy method
 * 
 * @param sourceBucket - The source bucket
 * @param sourceFilePath - The source file path
 * @param destinationBucket - The destination bucket
 * @param destinationFilePath - The destination file path
 * @returns Object containing the destination path
 * @throws StorageError if copy fails
 */
export const copyFile = async (
  sourceBucket: string,
  sourceFilePath: string,
  destinationBucket: string,
  destinationFilePath: string
): Promise<{ path: string }> => {
  try {
    // Validate buckets
    if (!Object.values(STORAGE_BUCKETS).includes(sourceBucket)) {
      throw createBucketNotFoundError(sourceBucket)
    }
    if (!Object.values(STORAGE_BUCKETS).includes(destinationBucket)) {
      throw createBucketNotFoundError(destinationBucket)
    }

    // Use the native Supabase Storage copy method
    const { data, error } = await supabase.storage
      .from(sourceBucket)
      .copy(sourceFilePath, destinationFilePath, {
        ...(sourceBucket !== destinationBucket ? { destinationBucket } : {})
      });

    if (error) {
      throw convertToStorageError(
        error, 
        `Failed to copy file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`
      )
    }

    if (!data) {
      throw convertToStorageError(
        new Error('Copy operation returned no data'), 
        `Failed to copy file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`
      )
    }
    
    return { path: destinationFilePath }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(
      error, 
      `Failed to copy file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`
    )
  }
}

/**
 * Moves a file within Supabase Storage using the native Supabase Storage move method
 * 
 * @param sourceBucket - The source bucket
 * @param sourceFilePaths - The source file path
 * @param destinationBucket - The destination bucket
 * @returns Object containing the destination path
 * @throws StorageError if move fails
 * @description Moves an array of files between buckets, using the native Supabase Storage move between buckets method
 */
export const moveFilesBetweenBuckets = async (
  sourceBucket: string,
  sourceFilePaths: string[],
  destinationBucket: string,
): Promise<{ destinationBucket: string, newFilePaths: string[] }> => {
  try {
    // Validate buckets
    if (!Object.values(STORAGE_BUCKETS).includes(sourceBucket)) {
      throw createBucketNotFoundError(sourceBucket)
    }
    if (!Object.values(STORAGE_BUCKETS).includes(destinationBucket)) {
      throw createBucketNotFoundError(destinationBucket)
    }

    // Use the native Supabase Storage move method
    const { data, error } = await supabase.storage
        .from(sourceBucket)
        .move(sourceFilePaths, {destinationBucket}); 
    
    let filePathResult = data? data : [];

    
    return filePathResult;

    
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw convertToStorageError(error, `Failed to move files between buckets`);
  }
} 





/**
 * Moves a file within Supabase Storage using the native Supabase Storage move method
 * 
 * @param sourceBucket - The source bucket
 * @param sourceFilePath - The source file path
 * @param destinationBucket - The destination bucket
 * @param destinationFilePath - The destination file path
 * @returns Object containing the destination path
 * @throws StorageError if move fails
 */
export const moveFile = async (
  sourceBucket: string,
  sourceFilePath: string,
  destinationBucket: string,
  destinationFilePath: string
): Promise<{ paths: string[] }> => {
  try {
    // Validate buckets
    if (!Object.values(STORAGE_BUCKETS).includes(sourceBucket)) {
      throw createBucketNotFoundError(sourceBucket)
    }
    if (!Object.values(STORAGE_BUCKETS).includes(destinationBucket)) {
      throw createBucketNotFoundError(destinationBucket)
    }

    // Use the native Supabase Storage move method
    const { data, error } = await supabase.storage
      .from(sourceBucket)
      .move(sourceFilePath, destinationFilePath, {
        ...(sourceBucket !== destinationBucket ? { destinationBucket } : {})
      });

    if (error) {
      throw convertToStorageError(
        error, 
        `Failed to move file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`
      )
    }

    if (!data) {
      throw convertToStorageError(
        new Error('Move operation returned no data'), 
        `Failed to move file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`
      )
    }
    
    return { paths: [destinationFilePath] }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(
      error, 
      `Failed to move file from ${sourceBucket}/${sourceFilePath} to ${destinationBucket}/${destinationFilePath}`
    )
  }
} 