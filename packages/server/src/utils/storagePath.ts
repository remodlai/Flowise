/**
 * Storage Path Utilities
 * 
 * This file provides utilities for generating and validating storage paths
 * for different contexts and resource types.
 */

import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { 
  FILE_CONTEXT_TYPES, 
  FILE_RESOURCE_TYPES,
  PATH_TOKEN_SEPARATOR
} from '../constants/storage'
import { StorageError, createInvalidFileError } from '../errors'

/**
 * Options for generating a storage path
 */
export interface StoragePathOptions {
  /** The context type (user, organization, application, etc.) */
  contextType: string
  /** The ID of the context (user ID, organization ID, etc.) */
  contextId: string
  /** The type of resource (profile_picture, document, image, etc.) */
  resourceType?: string
  /** The ID of the resource (if applicable) */
  resourceId?: string
  /** Whether to include a UUID in the path for uniqueness */
  includeUuid?: boolean
  /** Custom folder name to include in the path */
  folderName?: string
  /** Original filename to preserve (optional) */
  originalFilename?: string
}

/**
 * Validates a storage path to ensure it meets requirements
 * 
 * @param path - The path to validate
 * @returns True if the path is valid, false otherwise
 */
export const isValidStoragePath = (path: string): boolean => {
  // Path must not be empty
  if (!path || path.trim() === '') {
    return false
  }

  // Path must not contain invalid characters
  const invalidCharsRegex = /[<>:"|?*\x00-\x1F]/g
  if (invalidCharsRegex.test(path)) {
    return false
  }

  // Path must not start or end with a slash
  if (path.startsWith('/') || path.endsWith('/')) {
    return false
  }

  // Path must not contain consecutive slashes
  if (path.includes('//')) {
    return false
  }

  // Path must not be too long (max 1024 characters)
  if (path.length > 1024) {
    return false
  }

  return true
}

/**
 * Sanitizes a filename to ensure it's safe for storage
 * 
 * @param filename - The filename to sanitize
 * @returns The sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return ''

  // Remove invalid characters
  let sanitized = filename.replace(/[<>:"|?*\x00-\x1F]/g, '')
  
  // Replace spaces with underscores
  sanitized = sanitized.replace(/\s+/g, '_')
  
  // Ensure filename isn't too long (max 255 characters)
  if (sanitized.length > 255) {
    const extension = path.extname(sanitized)
    const basename = path.basename(sanitized, extension)
    sanitized = basename.substring(0, 245) + extension
  }
  
  return sanitized
}

/**
 * Generates a unique filename with a UUID
 * 
 * @param originalFilename - The original filename (optional)
 * @returns A unique filename
 */
export const generateUniqueFilename = (originalFilename?: string): string => {
  const uuid = uuidv4()
  
  if (!originalFilename) {
    return uuid
  }
  
  const sanitized = sanitizeFilename(originalFilename)
  if (!sanitized) {
    return uuid
  }
  
  const extension = path.extname(sanitized)
  const basename = path.basename(sanitized, extension)
  
  return `${basename}_${uuid}${extension}`
}

/**
 * Generates a storage path based on the provided options
 * 
 * @param options - Options for generating the path
 * @returns The generated storage path
 * @throws StorageError if the path is invalid
 */
export const generateStoragePath = (options: StoragePathOptions): string => {
  const {
    contextType,
    contextId,
    resourceType = FILE_RESOURCE_TYPES.OTHER,
    resourceId,
    includeUuid = true,
    folderName,
    originalFilename
  } = options

  // Validate required parameters
  if (!contextType || !contextId) {
    throw createInvalidFileError('Context type and context ID are required for generating a storage path')
  }

  // Start building the path
  const pathParts: string[] = []

  // Add context type and ID
  pathParts.push(contextType)
  pathParts.push(contextId)

  // Add resource type
  pathParts.push(resourceType)

  // Add resource ID if provided
  if (resourceId) {
    pathParts.push(resourceId)
  }

  // Add custom folder if provided
  if (folderName) {
    pathParts.push(sanitizeFilename(folderName))
  }

  // Create the directory path
  const dirPath = pathParts.join('/')

  // Generate filename
  let filename: string
  if (includeUuid) {
    filename = generateUniqueFilename(originalFilename)
  } else if (originalFilename) {
    filename = sanitizeFilename(originalFilename)
  } else {
    filename = uuidv4()
  }

  // Combine directory path and filename
  const fullPath = `${dirPath}/${filename}`

  // Validate the final path
  if (!isValidStoragePath(fullPath)) {
    throw createInvalidFileError(`Generated path "${fullPath}" is invalid`)
  }

  return fullPath
}

/**
 * Generates a storage path for a user context
 * 
 * @param userId - The ID of the user
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export const generateUserStoragePath = (
  userId: string,
  resourceType: string = FILE_RESOURCE_TYPES.OTHER,
  options: Partial<StoragePathOptions> = {}
): string => {
  return generateStoragePath({
    contextType: FILE_CONTEXT_TYPES.USER,
    contextId: userId,
    resourceType,
    ...options
  })
}

/**
 * Generates a storage path for an organization context
 * 
 * @param organizationId - The ID of the organization
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export const generateOrganizationStoragePath = (
  organizationId: string,
  resourceType: string = FILE_RESOURCE_TYPES.OTHER,
  options: Partial<StoragePathOptions> = {}
): string => {
  return generateStoragePath({
    contextType: FILE_CONTEXT_TYPES.ORGANIZATION,
    contextId: organizationId,
    resourceType,
    ...options
  })
}

/**
 * Generates a storage path for an application context
 * 
 * @param applicationId - The ID of the application
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export const generateApplicationStoragePath = (
  applicationId: string,
  resourceType: string = FILE_RESOURCE_TYPES.OTHER,
  options: Partial<StoragePathOptions> = {}
): string => {
  return generateStoragePath({
    contextType: FILE_CONTEXT_TYPES.APPLICATION,
    contextId: applicationId,
    resourceType,
    ...options
  })
}

/**
 * Generates a storage path for a chatflow context
 * 
 * @param chatflowId - The ID of the chatflow
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export const generateChatflowStoragePath = (
  chatflowId: string,
  resourceType: string = FILE_RESOURCE_TYPES.OTHER,
  options: Partial<StoragePathOptions> = {}
): string => {
  return generateStoragePath({
    contextType: FILE_CONTEXT_TYPES.CHATFLOW,
    contextId: chatflowId,
    resourceType,
    ...options
  })
}

/**
 * Generates a storage path for a document context
 * 
 * @param documentId - The ID of the document
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export const generateDocumentStoragePath = (
  documentId: string,
  resourceType: string = FILE_RESOURCE_TYPES.DOCUMENT,
  options: Partial<StoragePathOptions> = {}
): string => {
  return generateStoragePath({
    contextType: FILE_CONTEXT_TYPES.DOCUMENT,
    contextId: documentId,
    resourceType,
    ...options
  })
}

/**
 * Generates a storage path for a platform context
 * 
 * @param resourceType - The type of resource
 * @param options - Additional options
 * @returns The generated storage path
 */
export const generatePlatformStoragePath = (
  resourceType: string = FILE_RESOURCE_TYPES.OTHER,
  options: Partial<StoragePathOptions> = {}
): string => {
  return generateStoragePath({
    contextType: FILE_CONTEXT_TYPES.PLATFORM,
    contextId: 'global',
    resourceType,
    ...options
  })
}

/**
 * Generates a virtual path for organizing files in the UI
 * 
 * @param parts - The parts of the virtual path
 * @returns The generated virtual path
 */
export const generateVirtualPath = (...parts: string[]): string => {
  // Filter out empty parts
  const validParts = parts.filter(part => part && part.trim() !== '')
  
  // Join parts with the virtual path separator
  return validParts.join(PATH_TOKEN_SEPARATOR)
}

/**
 * Extracts the filename from a storage path
 * 
 * @param storagePath - The storage path
 * @returns The extracted filename
 */
export const getFilenameFromPath = (storagePath: string): string => {
  if (!storagePath) return ''
  return storagePath.split('/').pop() || ''
}

/**
 * Extracts the directory path from a storage path
 * 
 * @param storagePath - The storage path
 * @returns The extracted directory path
 */
export const getDirPathFromPath = (storagePath: string): string => {
  if (!storagePath) return ''
  const parts = storagePath.split('/')
  parts.pop() // Remove filename
  return parts.join('/')
}

/**
 * Gets the file extension from a filename
 * 
 * @param filename - The filename
 * @returns The file extension (with dot)
 */
export const getFileExtension = (filename: string): string => {
  if (!filename) return ''
  return path.extname(filename).toLowerCase()
} 