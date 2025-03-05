/**
 * Supabase Storage Utilities
 * 
 * This file contains utilities for interacting with Supabase Storage.
 * It provides functions for uploading, retrieving, and managing files
 * across different storage buckets with appropriate access control.
 */

import { supabase } from './supabase'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

/**
 * Storage bucket definitions for different access levels
 * - PUBLIC: Accessible to anyone, used for public assets
 * - PROFILES: For user profile pictures with specific access control
 * - PLATFORM: Platform-level files accessible to platform admins
 * - APPS: App-specific files accessible to app owners and users
 * - ORGANIZATIONS: Organization-specific files for org members
 * - USER_FILES: User-specific files with personal access control
 */
export const STORAGE_BUCKETS = {
  PUBLIC: 'public',
  PROFILES: 'profiles',
  PLATFORM: 'platform',
  APPS: 'apps',
  ORGANIZATIONS: 'organizations',
  USER_FILES: 'user-files'
}

/**
 * Uploads a file to Supabase Storage
 * 
 * @param bucket - The storage bucket to upload to
 * @param path - The path within the bucket
 * @param file - The file buffer to upload
 * @param fileOptions - Options for the file upload
 * @param fileOptions.contentType - MIME type of the file
 * @param fileOptions.fileName - Optional custom filename (defaults to UUID)
 * @param fileOptions.isPublic - Whether to return a public URL (defaults to false)
 * @returns Object containing the file path and optional public URL
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: Buffer,
  fileOptions: {
    contentType: string;
    fileName?: string;
    isPublic?: boolean;
  }
) => {
  try {
    // Generate a unique filename if not provided
    const fileName = fileOptions.fileName || `${uuidv4()}${getFileExtension(fileOptions.contentType)}`
    const filePath = path ? `${path}/${fileName}` : fileName

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: fileOptions.contentType,
        upsert: true
      })

    if (error) {
      console.error('Error uploading file to Supabase Storage:', error)
      throw error
    }

    // Return the file path and public URL if requested
    const result: { path: string; publicUrl?: string } = { path: data.path }
    
    if (fileOptions.isPublic) {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      result.publicUrl = urlData.publicUrl
    }

    return result
  } catch (error) {
    console.error('Error in uploadFile:', error)
    throw error
  }
}

/**
 * Uploads and optionally transforms an image to Supabase Storage
 * 
 * @param bucket - The storage bucket to upload to
 * @param path - The path within the bucket
 * @param file - The image buffer to upload
 * @param fileOptions - Options for the image upload and transformation
 * @param fileOptions.contentType - MIME type of the image
 * @param fileOptions.fileName - Optional custom filename (defaults to UUID)
 * @param fileOptions.isPublic - Whether to return a public URL (defaults to false)
 * @param fileOptions.width - Optional width to resize the image to
 * @param fileOptions.height - Optional height to resize the image to
 * @param fileOptions.quality - Optional quality setting for JPEG/WebP (1-100)
 * @returns Object containing the file path and optional public URL
 */
export const uploadImage = async (
  bucket: string,
  path: string,
  file: Buffer,
  fileOptions: {
    contentType: string;
    fileName?: string;
    isPublic?: boolean;
    width?: number;
    height?: number;
    quality?: number;
  }
) => {
  try {
    // Process image transformations if any are specified
    let processedImage = sharp(file)
    let transformApplied = false

    // Apply resizing if width or height is specified
    if (fileOptions.width || fileOptions.height) {
      processedImage = processedImage.resize({
        width: fileOptions.width,
        height: fileOptions.height,
        fit: 'inside',
        withoutEnlargement: true
      })
      transformApplied = true
    }

    // Apply quality settings for supported formats
    if (fileOptions.quality && (fileOptions.contentType.includes('jpeg') || fileOptions.contentType.includes('webp'))) {
      if (fileOptions.contentType.includes('jpeg')) {
        processedImage = processedImage.jpeg({ quality: fileOptions.quality })
      } else if (fileOptions.contentType.includes('webp')) {
        processedImage = processedImage.webp({ quality: fileOptions.quality })
      }
      transformApplied = true
    }

    // Get the processed buffer if transformations were applied
    const imageBuffer = transformApplied ? await processedImage.toBuffer() : file

    // Upload the processed image using the uploadFile function
    return await uploadFile(bucket, path, imageBuffer, fileOptions)
  } catch (error) {
    console.error('Error in uploadImage:', error)
    throw error
  }
}

/**
 * Retrieves a file from Supabase Storage
 * 
 * @param bucket - The storage bucket to retrieve from
 * @param path - The path of the file within the bucket
 * @returns The file data as an ArrayBuffer or null if not found
 */
export const getFile = async (bucket: string, path: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error('Error downloading file from Supabase Storage:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getFile:', error)
    throw error
  }
}

/**
 * Generates a signed URL for temporary access to a file
 * 
 * @param bucket - The storage bucket containing the file
 * @param path - The path of the file within the bucket
 * @param expiresIn - Number of seconds until the URL expires (default: 60)
 * @returns The signed URL or null if generation fails
 */
export const getSignedUrl = async (bucket: string, path: string, expiresIn = 60) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      throw error
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error in getSignedUrl:', error)
    throw error
  }
}

/**
 * Lists files in a specific path within a bucket
 * 
 * @param bucket - The storage bucket to list files from
 * @param path - The path within the bucket to list files from
 * @returns List of files
 */
export const listFiles = async (bucket: string, path: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path)

    if (error) {
      console.error('Error listing files from Supabase Storage:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in listFiles:', error)
    throw error
  }
}

/**
 * Deletes a file from Supabase Storage
 * 
 * @param bucket - The storage bucket containing the file
 * @param path - The path of the file to delete
 * @returns Boolean indicating success or failure
 */
export const deleteFile = async (bucket: string, path: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Error deleting file from Supabase Storage:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in deleteFile:', error)
    throw error
  }
}

/**
 * Moves a file from one location to another within Supabase Storage
 * 
 * @param bucket - The storage bucket containing the file
 * @param fromPath - The current path of the file
 * @param toPath - The destination path for the file
 * @returns Boolean indicating success or failure
 */
export const moveFile = async (bucket: string, fromPath: string, toPath: string) => {
  try {
    // First, download the file
    const fileData = await getFile(bucket, fromPath)
    
    if (!fileData) {
      throw new Error(`File not found at ${fromPath}`)
    }
    
    // Get the file metadata to preserve content type
    const { data: metadata } = supabase.storage
      .from(bucket)
      .getPublicUrl(fromPath)
      
    // Determine content type based on file extension
    const ext = path.extname(fromPath).toLowerCase()
    
    // Use a comprehensive mapping of extensions to MIME types
    // This is the reverse of our getFileExtension function
    const extToMime: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    }
    
    // Try to get content type from metadata, then from extension mapping, or fall back to octet-stream
    let contentType = 'application/octet-stream'
    
    // If we have metadata with a public URL, try to get content type from headers
    if (metadata?.publicUrl) {
      try {
        // Try to get content type from Supabase metadata
        const response = await fetch(metadata.publicUrl, { method: 'HEAD' })
        const headerContentType = response.headers.get('content-type')
        if (headerContentType) {
          contentType = headerContentType
        }
      } catch (headError) {
        console.warn('Could not retrieve content type from HEAD request:', headError)
      }
    }
    
    // If we couldn't get content type from metadata, try extension mapping
    if (contentType === 'application/octet-stream' && extToMime[ext]) {
      contentType = extToMime[ext]
    }
    
    // Convert Blob to Buffer if needed
    const fileBuffer = fileData instanceof Blob 
      ? Buffer.from(await fileData.arrayBuffer()) 
      : fileData
    
    // Upload to the new location
    await uploadFile(bucket, path.dirname(toPath), fileBuffer, {
      contentType,
      fileName: path.basename(toPath)
    })
    
    // Delete the original file
    await deleteFile(bucket, fromPath)
    
    return true
  } catch (error) {
    console.error('Error in moveFile:', error)
    throw error
  }
}

/**
 * Determines the appropriate file extension based on MIME type
 * 
 * @param mimeType - The MIME type of the file
 * @returns The file extension including the dot (e.g., '.jpg')
 */
const getFileExtension = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/json': '.json',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'video/mp4': '.mp4',
    'video/webm': '.webm'
  }

  return mimeToExt[mimeType] || '.bin'
}

/**
 * Generates a storage path and bucket based on the context
 * 
 * @param options - Options for generating the storage path
 * @param options.level - The level of the storage path (platform, app, organization, user)
 * @param options.id - The ID of the entity (application ID, organization ID, user ID)
 * @param options.subPath - Optional sub-path within the entity's storage
 * @returns Object containing the bucket and path
 */
export const generateStoragePath = (options: {
  level: 'platform' | 'app' | 'organization' | 'user';
  id: string;
  subPath?: string;
  application_id?: string;
}): { bucket: string; path: string } => {
  let bucket: string
  let path: string

  switch (options.level) {
    case 'platform':
      bucket = STORAGE_BUCKETS.PLATFORM
      path = options.subPath ? options.subPath : ''
      break
    case 'app':
      bucket = STORAGE_BUCKETS.APPS
      path = `app/${options.id}${options.subPath ? '/' + options.subPath : ''}`
      break
    case 'organization':
      bucket = STORAGE_BUCKETS.ORGANIZATIONS
      path = `org/${options.id}${options.subPath ? '/' + options.subPath : ''}`
      break
    case 'user':
      bucket = STORAGE_BUCKETS.USER_FILES
      path = `user/${options.id}${options.subPath ? '/' + options.subPath : ''}`
      break
    default:
      throw new Error(`Invalid storage level: ${options.level}`)
  }

  return { bucket, path }
}

/**
 * Generates a storage path for application-specific files
 * 
 * @param applicationId - The ID of the application
 * @param subPath - Optional sub-path within the application's storage
 * @returns Object containing the bucket and path
 */
export const generateApplicationStoragePath = (
  applicationId: string,
  subPath?: string
): { bucket: string; path: string } => {
  return generateStoragePath({
    level: 'app',
    id: applicationId,
    subPath
  })
}

/**
 * Generates a storage path for organization-specific files
 * 
 * @param organizationId - The ID of the organization
 * @param applicationId - Optional application ID for context
 * @param subPath - Optional sub-path within the organization's storage
 * @returns Object containing the bucket and path
 */
export const generateOrganizationStoragePath = (
  organizationId: string,
  applicationId?: string,
  subPath?: string
): { bucket: string; path: string } => {
  return generateStoragePath({
    level: 'organization',
    id: organizationId,
    subPath,
    application_id: applicationId
  })
}

/**
 * Generates a storage path for user-specific files
 * 
 * @param userId - The ID of the user
 * @param applicationId - Optional application ID for context
 * @param subPath - Optional sub-path within the user's storage
 * @returns Object containing the bucket and path
 */
export const generateUserStoragePath = (
  userId: string,
  applicationId?: string,
  subPath?: string
): { bucket: string; path: string } => {
  return generateStoragePath({
    level: 'user',
    id: userId,
    subPath,
    application_id: applicationId
  })
} 