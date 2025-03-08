/**
 * Supabase Storage Service
 * 
 * This service provides high-level functions for managing files in Supabase Storage.
 * It combines core storage operations with file metadata management to provide
 * a unified interface for file management.
 */

import { 
  uploadFile as uploadStorageFile,
  getPublicUrl,
  createSignedUrl,
  downloadFile as downloadStorageFile,
  listFiles as listStorageFiles,
  deleteFiles as deleteStorageFiles,
  copyFile as copyStorageFile,
  moveFile as moveStorageFile,
  StorageAuthContext
} from '../../utils/storageOperations'

import {
  createFileMetadata,
  updateFileMetadata,
  getFileMetadataById,
  getFileMetadataByPath,
  deleteFileMetadata,
  listFileMetadata,
  searchFileMetadata,
  updateFileVirtualPath,
  getFilesByContext,
  getFilesByResource,
  getFilesByVirtualPath,
  FileMetadata,
  ListFileMetadataOptions
} from '../fileMetadata'

import {
  generateStoragePath,
  generateUserStoragePath,
  generateOrganizationStoragePath,
  generateApplicationStoragePath,
  generateChatflowStoragePath,
  generateDocumentStoragePath,
  generatePlatformStoragePath,
  getFilenameFromPath
} from '../../utils/storagePath'

import {
  STORAGE_BUCKETS,
  FILE_ACCESS_LEVELS,
  FILE_CONTEXT_TYPES,
  FILE_RESOURCE_TYPES,
  SIGNED_URL_EXPIRATION
} from '../../constants/storage'

import {
  StorageError,
  createFileNotFoundError,
  createPermissionDeniedError,
  convertToStorageError
} from '../../errors'

/**
 * Options for uploading a file
 */
export interface UploadFileOptions {
  /** The name of the file */
  name: string
  /** The content type of the file */
  contentType: string
  /** The context type (user, organization, application, etc.) */
  contextType: string
  /** The ID of the context */
  contextId: string
  /** The resource type (document, image, etc.) */
  resourceType: string
  /** The ID of the resource (optional) */
  resourceId?: string
  /** Whether the file is publicly accessible (optional) */
  isPublic?: boolean
  /** The access level of the file (optional) */
  accessLevel?: string
  /** Custom metadata for the file (optional) */
  metadata?: Record<string, any>
  /** Virtual path for organizing files in the UI (optional) */
  virtualPath?: string
  /** Whether to upsert the file if it already exists (optional) */
  upsert?: boolean
  /** Custom cache control header (optional) */
  cacheControl?: string
  /** Whether to include a UUID in the filename (optional) */
  includeUuid?: boolean
  /** Custom folder name to include in the path (optional) */
  folderName?: string
}

/**
 * Options for getting a file URL
 */
export interface GetFileUrlOptions {
  /** Whether to create a signed URL (optional) */
  signed?: boolean
  /** Expiration time in seconds for signed URLs (optional) */
  expiresIn?: number
  /** Download options for signed URLs (optional) */
  download?: boolean | string
  /** Transform options for images (optional) */
  transform?: {
    width?: number
    height?: number
    quality?: number
    format?: 'origin'
  }
}

/**
 * Options for updating a file
 */
export interface UpdateFileOptions {
  /** The new name of the file (optional) */
  name?: string
  /** The new content type of the file (optional) */
  contentType?: string
  /** Whether the file is publicly accessible (optional) */
  isPublic?: boolean
  /** The new access level of the file (optional) */
  accessLevel?: string
  /** Custom metadata to merge with existing metadata (optional) */
  metadata?: Record<string, any>
  /** New virtual path for organizing files in the UI (optional) */
  virtualPath?: string
}

/**
 * Result of a file upload operation
 */
export interface UploadFileResult {
  /** The file metadata */
  file: FileMetadata
  /** The URL of the file */
  url: string
}

/**
 * Result of a file download operation
 */
export interface DownloadFileResult {
  /** The file data */
  data: Blob
  /** The file metadata */
  file: FileMetadata
}

/**
 * Result of a file listing operation
 */
export interface ListFilesResult {
  /** The files */
  files: FileMetadata[]
  /** The total number of files */
  total: number
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
export const uploadFile = async (
  bucket: string,
  fileData: Buffer | Blob | File | ArrayBuffer,
  options: UploadFileOptions,
  authContext: StorageAuthContext
): Promise<UploadFileResult> => {
  try {
    // Generate storage path
    const filePath = generateStoragePath({
      contextType: options.contextType,
      contextId: options.contextId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      includeUuid: options.includeUuid !== undefined ? options.includeUuid : true,
      folderName: options.folderName,
      originalFilename: options.name
    })

    // Upload file to storage
    const uploadResult = await uploadStorageFile(
      bucket,
      filePath,
      fileData,
      {
        contentType: options.contentType,
        upsert: options.upsert,
        cacheControl: options.cacheControl,
        metadata: options.metadata
      },
      authContext
    )

    // Create file metadata
    const fileMetadata = await createFileMetadata(
      {
        name: options.name,
        content_type: options.contentType,
        size: fileData instanceof Buffer ? fileData.length : 
              fileData instanceof Blob ? fileData.size : 
              fileData instanceof File ? fileData.size : 
              (fileData as ArrayBuffer).byteLength,
        bucket,
        path: uploadResult.path,
        context_type: options.contextType,
        context_id: options.contextId,
        resource_type: options.resourceType,
        resource_id: options.resourceId,
        is_public: options.isPublic !== undefined ? options.isPublic : false,
        access_level: options.accessLevel || FILE_ACCESS_LEVELS.PRIVATE,
        metadata: options.metadata,
        virtual_path: options.virtualPath
      },
      authContext
    )

    // Get file URL
    const url = options.isPublic ? 
      getPublicUrl(bucket, uploadResult.path) : 
      await createSignedUrl(bucket, uploadResult.path, { expiresIn: SIGNED_URL_EXPIRATION.MEDIUM })

    return {
      file: fileMetadata,
      url
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, 'Failed to upload file')
  }
}

/**
 * Gets a file URL (public or signed)
 * 
 * @param fileId - The ID of the file
 * @param options - URL options
 * @returns The file URL
 * @throws StorageError if URL generation fails
 */
export const getFileUrl = async (
  fileId: string,
  options: GetFileUrlOptions = {}
): Promise<string> => {
  try {
    // Get file metadata
    const fileMetadata = await getFileMetadataById(fileId)
    if (!fileMetadata) {
      throw createFileNotFoundError(fileId)
    }

    // Get URL based on options
    if (fileMetadata.is_public && !options.signed) {
      return getPublicUrl(fileMetadata.bucket, fileMetadata.path)
    } else {
      return await createSignedUrl(
        fileMetadata.bucket, 
        fileMetadata.path, 
        {
          expiresIn: options.expiresIn || SIGNED_URL_EXPIRATION.MEDIUM,
          download: options.download,
          transform: options.transform
        }
      )
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to get URL for file ${fileId}`)
  }
}

/**
 * Downloads a file from Supabase Storage
 * 
 * @param fileId - The ID of the file to download
 * @returns The file data and metadata
 * @throws StorageError if download fails
 */
export const downloadFile = async (
  fileId: string
): Promise<DownloadFileResult> => {
  try {
    // Get file metadata
    const fileMetadata = await getFileMetadataById(fileId)
    if (!fileMetadata) {
      throw createFileNotFoundError(fileId)
    }

    // Download file
    const data = await downloadStorageFile(fileMetadata.bucket, fileMetadata.path)

    return {
      data,
      file: fileMetadata
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to download file ${fileId}`)
  }
}

/**
 * Deletes a file from Supabase Storage and its metadata
 * 
 * @param fileId - The ID of the file to delete
 * @param authContext - Authentication context
 * @returns True if the file was deleted
 * @throws StorageError if deletion fails
 */
export const deleteFile = async (
  fileId: string,
  authContext: StorageAuthContext
): Promise<boolean> => {
  try {
    // Get file metadata
    const fileMetadata = await getFileMetadataById(fileId)
    if (!fileMetadata) {
      return false
    }

    // Check if user has permission to delete the file
    if (fileMetadata.created_by !== authContext.userId && 
        fileMetadata.context_id !== authContext.appId && 
        fileMetadata.context_id !== authContext.orgId) {
      throw createPermissionDeniedError(fileId, authContext.userId || 'anonymous')
    }

    // Delete file from storage
    await deleteStorageFiles(fileMetadata.bucket, [fileMetadata.path])

    // Delete file metadata
    return await deleteFileMetadata(fileId)
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to delete file ${fileId}`)
  }
}

/**
 * Lists files based on various criteria
 * 
 * @param options - List options
 * @returns The files and total count
 * @throws StorageError if listing fails
 */
export const listFiles = async (
  options: ListFileMetadataOptions = {}
): Promise<ListFilesResult> => {
  try {
    // List files
    const files = await listFileMetadata(options)

    return {
      files,
      total: files.length
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, 'Failed to list files')
  }
}

/**
 * Updates a file's metadata
 * 
 * @param fileId - The ID of the file to update
 * @param options - Update options
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
export const updateFile = async (
  fileId: string,
  options: UpdateFileOptions,
  authContext: StorageAuthContext
): Promise<FileMetadata> => {
  try {
    // Get file metadata
    const fileMetadata = await getFileMetadataById(fileId)
    if (!fileMetadata) {
      throw createFileNotFoundError(fileId)
    }

    // Check if user has permission to update the file
    if (fileMetadata.created_by !== authContext.userId && 
        fileMetadata.context_id !== authContext.appId && 
        fileMetadata.context_id !== authContext.orgId) {
      throw createPermissionDeniedError(fileId, authContext.userId || 'anonymous')
    }

    // Update file metadata
    return await updateFileMetadata(
      fileId,
      {
        name: options.name,
        content_type: options.contentType,
        is_public: options.isPublic,
        access_level: options.accessLevel,
        metadata: options.metadata,
        virtual_path: options.virtualPath
      },
      authContext
    )
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to update file ${fileId}`)
  }
}

/**
 * Searches for files based on a search term
 * 
 * @param searchTerm - The search term
 * @param options - Search options
 * @returns The matching files and total count
 * @throws StorageError if search fails
 */
export const searchFiles = async (
  searchTerm: string,
  options: ListFileMetadataOptions = {}
): Promise<ListFilesResult> => {
  try {
    // Search files
    const files = await searchFileMetadata(searchTerm, options)

    return {
      files,
      total: files.length
    }
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to search files for "${searchTerm}"`)
  }
}

/**
 * Moves a file to a new virtual path
 * 
 * @param fileId - The ID of the file to move
 * @param virtualPath - The new virtual path
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if move fails
 */
export const moveFileVirtualPath = async (
  fileId: string,
  virtualPath: string,
  authContext: StorageAuthContext
): Promise<FileMetadata> => {
  try {
    // Get file metadata
    const fileMetadata = await getFileMetadataById(fileId)
    if (!fileMetadata) {
      throw createFileNotFoundError(fileId)
    }

    // Check if user has permission to move the file
    if (fileMetadata.created_by !== authContext.userId && 
        fileMetadata.context_id !== authContext.appId && 
        fileMetadata.context_id !== authContext.orgId) {
      throw createPermissionDeniedError(fileId, authContext.userId || 'anonymous')
    }

    // Update file virtual path
    return await updateFileVirtualPath(fileId, virtualPath, authContext)
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to move file ${fileId} to ${virtualPath}`)
  }
}

/**
 * Copies a file to a new location
 * 
 * @param fileId - The ID of the file to copy
 * @param destinationOptions - Options for the destination file
 * @param authContext - Authentication context
 * @returns The new file metadata and URL
 * @throws StorageError if copy fails
 */
export const copyFile = async (
  fileId: string,
  destinationOptions: UploadFileOptions,
  authContext: StorageAuthContext
): Promise<UploadFileResult> => {
  try {
    // Get file metadata
    const fileMetadata = await getFileMetadataById(fileId)
    if (!fileMetadata) {
      throw createFileNotFoundError(fileId)
    }

    // Download file
    const { data } = await downloadFile(fileId)

    // Upload to new location
    return await uploadFile(
      destinationOptions.resourceType === FILE_RESOURCE_TYPES.PROFILE_PICTURE ? 
        STORAGE_BUCKETS.PROFILES : 
        fileMetadata.bucket,
      data,
      {
        ...destinationOptions,
        contentType: destinationOptions.contentType || fileMetadata.content_type,
        metadata: {
          ...fileMetadata.metadata,
          ...destinationOptions.metadata,
          originalFileId: fileId
        }
      },
      authContext
    )
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to copy file ${fileId}`)
  }
}

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
export const uploadUserFile = async (
  userId: string,
  fileData: Buffer | Blob | File | ArrayBuffer,
  options: Omit<UploadFileOptions, 'contextType' | 'contextId'>,
  authContext: StorageAuthContext
): Promise<UploadFileResult> => {
  return uploadFile(
    STORAGE_BUCKETS.USER_FILES,
    fileData,
    {
      ...options,
      contextType: FILE_CONTEXT_TYPES.USER,
      contextId: userId
    },
    authContext
  )
}

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
export const uploadOrganizationFile = async (
  organizationId: string,
  fileData: Buffer | Blob | File | ArrayBuffer,
  options: Omit<UploadFileOptions, 'contextType' | 'contextId'>,
  authContext: StorageAuthContext
): Promise<UploadFileResult> => {
  return uploadFile(
    STORAGE_BUCKETS.ORGANIZATIONS,
    fileData,
    {
      ...options,
      contextType: FILE_CONTEXT_TYPES.ORGANIZATION,
      contextId: organizationId
    },
    authContext
  )
}

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
export const uploadApplicationFile = async (
  applicationId: string,
  fileData: Buffer | Blob | File | ArrayBuffer,
  options: Omit<UploadFileOptions, 'contextType' | 'contextId'>,
  authContext: StorageAuthContext
): Promise<UploadFileResult> => {
  return uploadFile(
    STORAGE_BUCKETS.APPS,
    fileData,
    {
      ...options,
      contextType: FILE_CONTEXT_TYPES.APPLICATION,
      contextId: applicationId
    },
    authContext
  )
}

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
export const uploadProfilePicture = async (
  userId: string,
  fileData: Buffer | Blob | File | ArrayBuffer,
  options: Omit<UploadFileOptions, 'contextType' | 'contextId' | 'resourceType'>,
  authContext: StorageAuthContext
): Promise<UploadFileResult> => {
  return uploadFile(
    STORAGE_BUCKETS.PROFILES,
    fileData,
    {
      ...options,
      contextType: FILE_CONTEXT_TYPES.USER,
      contextId: userId,
      resourceType: FILE_RESOURCE_TYPES.PROFILE_PICTURE,
      isPublic: options.isPublic !== undefined ? options.isPublic : true
    },
    authContext
  )
}

/**
 * Gets user files
 * 
 * @param userId - The ID of the user
 * @param options - List options
 * @returns The user files and total count
 * @throws StorageError if listing fails
 */
export const getUserFiles = async (
  userId: string,
  options: Omit<ListFileMetadataOptions, 'filters'> & { 
    filters?: Omit<ListFileMetadataOptions['filters'], 'context_type' | 'context_id'> 
  } = {}
): Promise<ListFilesResult> => {
  const files = await getFilesByContext(
    FILE_CONTEXT_TYPES.USER,
    userId,
    {
      ...options,
      filters: {
        ...options.filters,
        context_type: FILE_CONTEXT_TYPES.USER,
        context_id: userId
      }
    }
  )

  return {
    files,
    total: files.length
  }
}

/**
 * Gets organization files
 * 
 * @param organizationId - The ID of the organization
 * @param options - List options
 * @returns The organization files and total count
 * @throws StorageError if listing fails
 */
export const getOrganizationFiles = async (
  organizationId: string,
  options: Omit<ListFileMetadataOptions, 'filters'> & { 
    filters?: Omit<ListFileMetadataOptions['filters'], 'context_type' | 'context_id'> 
  } = {}
): Promise<ListFilesResult> => {
  const files = await getFilesByContext(
    FILE_CONTEXT_TYPES.ORGANIZATION,
    organizationId,
    {
      ...options,
      filters: {
        ...options.filters,
        context_type: FILE_CONTEXT_TYPES.ORGANIZATION,
        context_id: organizationId
      }
    }
  )

  return {
    files,
    total: files.length
  }
}

/**
 * Gets application files
 * 
 * @param applicationId - The ID of the application
 * @param options - List options
 * @returns The application files and total count
 * @throws StorageError if listing fails
 */
export const getApplicationFiles = async (
  applicationId: string,
  options: Omit<ListFileMetadataOptions, 'filters'> & { 
    filters?: Omit<ListFileMetadataOptions['filters'], 'context_type' | 'context_id'> 
  } = {}
): Promise<ListFilesResult> => {
  const files = await getFilesByContext(
    FILE_CONTEXT_TYPES.APPLICATION,
    applicationId,
    {
      ...options,
      filters: {
        ...options.filters,
        context_type: FILE_CONTEXT_TYPES.APPLICATION,
        context_id: applicationId
      }
    }
  )

  return {
    files,
    total: files.length
  }
}

// Export constants for convenience
export {
  STORAGE_BUCKETS,
  FILE_ACCESS_LEVELS,
  FILE_CONTEXT_TYPES,
  FILE_RESOURCE_TYPES,
  SIGNED_URL_EXPIRATION
} 