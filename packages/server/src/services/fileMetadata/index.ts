/**
 * File Metadata Manager
 * 
 * This service provides functions for managing file metadata in the database.
 * It handles creating, updating, retrieving, and deleting file metadata records,
 * as well as searching and listing files based on various criteria.
 */

import { supabase } from '../../utils/supabase'
import { v4 as uuidv4 } from 'uuid'
import { 
  StorageError, 
  createFileNotFoundError,
  createFileAlreadyExistsError,
  convertToStorageError
} from '../../errors'
import { 
  FILE_ACCESS_LEVELS,
  FILE_CONTEXT_TYPES,
  FILE_RESOURCE_TYPES,
  PATH_TOKEN_FUNCTIONS
} from '../../constants/storage'
import { StorageAuthContext } from '../../utils/storageOperations'

/**
 * File metadata interface
 */
export interface FileMetadata {
  id: string
  created_at: string
  name: string
  content_type: string
  size: number
  url: string
  uuid: string
  bucket: string
  path: string
  context_type: string
  context_id: string
  resource_type: string
  resource_id?: string
  is_public: boolean
  access_level: string
  created_by: string
  updated_at?: string
  metadata?: Record<string, any>
  
  /** Array of path segments for hierarchical organization */
  path_tokens?: string[]
}

/**
 * Options for creating file metadata
 */
export interface CreateFileMetadataOptions {
  name: string
  content_type: string
  size: number
  bucket: string
  path: string
  context_type: string
  context_id: string
  resource_type: string
  resource_id?: string
  is_public?: boolean
  access_level?: string
  metadata?: Record<string, any>

  /** Array of path segments for hierarchical organization */
  path_tokens?: string[]
}

/**
 * Options for updating file metadata
 */
export interface UpdateFileMetadataOptions {
  name?: string
  content_type?: string
  size?: number
  is_public?: boolean
  access_level?: string
  metadata?: Record<string, any>

  /** Array of path segments for hierarchical organization */
  path_tokens?: string[]
}

/**
 * Options for listing file metadata
 */
export interface ListFileMetadataOptions {
  limit?: number
  offset?: number
  sortBy?: {
    column: string
    order: 'asc' | 'desc'
  }
  filters?: {
    context_type?: string
    context_id?: string
    resource_type?: string
    resource_id?: string
    is_public?: boolean
    access_level?: string
    created_by?: string
 
    /** Array of path segments for hierarchical organization */
    path_tokens?: string[]
    name?: string
    content_type?: string
  }
}

/**
 * Creates a new file metadata record in the database
 * 
 * @param options - Options for creating the file metadata
 * @param authContext - Authentication context
 * @returns The created file metadata
 * @throws StorageError if creation fails
 */
export const createFileMetadata = async (
  options: CreateFileMetadataOptions,
  authContext: StorageAuthContext
): Promise<FileMetadata> => {
  try {
    // Set default values
    const fileId = uuidv4()
    const isPublic = options.is_public !== undefined ? options.is_public : false
    const accessLevel = options.access_level || FILE_ACCESS_LEVELS.PRIVATE
    
    // Check if file already exists with the same path
    const { data: existingFile } = await supabase
      .from('files')
      .select('id')
      .eq('path', options.path)
      .eq('bucket', options.bucket)
      .single()
    
    if (existingFile) {
      throw createFileAlreadyExistsError(options.name, options.path)
    }
    
    // Create file metadata
    const { data, error } = await supabase
      .from('files')
      .insert({
        id: fileId,
        name: options.name,
        content_type: options.content_type,
        size: options.size,
        url: `${options.bucket}/${options.path}`,
        uuid: fileId,
        bucket: options.bucket,
        path: options.path,
        context_type: options.context_type,
        context_id: options.context_id,
        resource_type: options.resource_type,
        resource_id: options.resource_id,
        is_public: isPublic,
        access_level: accessLevel,
        created_by: authContext.userId || 'anonymous',
        metadata: options.metadata || {},
        
        path_tokens: options.path_tokens
      })
      .select()
      .single()
    
    if (error) {
      throw convertToStorageError(error, `Failed to create file metadata for ${options.path}`)
    }
    
    return data as FileMetadata
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to create file metadata`)
  }
}

/**
 * Updates an existing file metadata record in the database
 * 
 * @param fileId - The ID of the file to update
 * @param options - Options for updating the file metadata
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
export const updateFileMetadata = async (
  fileId: string,
  options: UpdateFileMetadataOptions,
  authContext: StorageAuthContext
): Promise<FileMetadata> => {
  try {
    // Check if file exists
    const { data: existingFile } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()
    
    if (!existingFile) {
      throw createFileNotFoundError(fileId)
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    
    if (options.name !== undefined) updateData.name = options.name
    if (options.content_type !== undefined) updateData.content_type = options.content_type
    if (options.size !== undefined) updateData.size = options.size
    if (options.is_public !== undefined) updateData.is_public = options.is_public
    if (options.access_level !== undefined) updateData.access_level = options.access_level
    
    // Support both for backward compatibility
    if (options.path_tokens !== undefined) {
      updateData.path_tokens = options.path_tokens
    }
    
    if (options.path_tokens !== undefined) {
      updateData.path_tokens = options.path_tokens
     
      
    }
    
    // Handle metadata updates (merge with existing metadata)
    if (options.metadata !== undefined) {
      updateData.metadata = {
        ...(existingFile.metadata || {}),
        ...options.metadata
      }
    }
    
    // Update file metadata
    const { data, error } = await supabase
      .from('files')
      .update(updateData)
      .eq('id', fileId)
      .select()
      .single()
    
    if (error) {
      throw convertToStorageError(error, `Failed to update file metadata for ${fileId}`)
    }
    
    return data as FileMetadata
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to update file metadata for ${fileId}`)
  }
}

/**
 * Gets a file metadata record by ID
 * 
 * @param fileId - The ID of the file to get
 * @returns The file metadata or null if not found
 * @throws StorageError if retrieval fails
 */
export const getFileMetadataById = async (
  fileId: string
): Promise<FileMetadata | null> => {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()
    
    if (error) {
      // If the error is a 404, return null
      if (error.code === 'PGRST116') {
        return null
      }
      throw convertToStorageError(error, `Failed to get file metadata for ${fileId}`)
    }
    
    return data as FileMetadata
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to get file metadata for ${fileId}`)
  }
}

/**
 * Gets a file metadata record by path and bucket
 * 
 * @param bucket - The bucket containing the file
 * @param path - The path of the file within the bucket
 * @returns The file metadata or null if not found
 * @throws StorageError if retrieval fails
 */
export const getFileMetadataByPath = async (
  bucket: string,
  path: string
): Promise<FileMetadata | null> => {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('bucket', bucket)
      .eq('path', path)
      .single()
    
    if (error) {
      // If the error is a 404, return null
      if (error.code === 'PGRST116') {
        return null
      }
      throw convertToStorageError(error, `Failed to get file metadata for ${bucket}/${path}`)
    }
    
    return data as FileMetadata
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to get file metadata for ${bucket}/${path}`)
  }
}

/**
 * Deletes a file metadata record from the database
 * 
 * @param fileId - The ID of the file to delete
 * @returns True if the file was deleted, false if it didn't exist
 * @throws StorageError if deletion fails
 */
export const deleteFileMetadata = async (
  fileId: string
): Promise<boolean> => {
  try {
    // Check if file exists
    const { data: existingFile } = await supabase
      .from('files')
      .select('id')
      .eq('id', fileId)
      .single()
    
    if (!existingFile) {
      return false
    }
    
    // Delete file metadata
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
    
    if (error) {
      throw convertToStorageError(error, `Failed to delete file metadata for ${fileId}`)
    }
    
    return true
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to delete file metadata for ${fileId}`)
  }
}

/**
 * Lists file metadata records based on various criteria
 * 
 * @param options - Options for listing
 * @returns Array of file metadata records
 * @throws StorageError if retrieval fails
 */
export const listFileMetadata = async (
  options: ListFileMetadataOptions = {}
): Promise<FileMetadata[]> => {
  try {
    const {
      limit = 10,
      offset = 0,
      sortBy = { column: 'created_at', order: 'desc' },
      filters = {}
    } = options
    
    let query = supabase
      .from('files')
      .select('*')
      .order(sortBy.column, { ascending: sortBy.order === 'asc' })
      .limit(limit)
      .offset(offset)
    
    // Apply filters
    if (filters.context_type) query = query.eq('context_type', filters.context_type)
    if (filters.context_id) query = query.eq('context_id', filters.context_id)
    if (filters.resource_type) query = query.eq('resource_type', filters.resource_type)
    if (filters.resource_id) query = query.eq('resource_id', filters.resource_id)
    if (filters.is_public !== undefined) query = query.eq('is_public', filters.is_public)
    if (filters.access_level) query = query.eq('access_level', filters.access_level)
    if (filters.created_by) query = query.eq('created_by', filters.created_by)
    
    // Support both for backward compatibility
  
    if (filters.path_tokens) {
      // If path_tokens is an array, use the contains operator
      if (Array.isArray(filters.path_tokens)) {
        query = query.contains('path_tokens', filters.path_tokens)
      } else {
        // If it's a string, convert it to an array and use contains
        query = query.contains('path_tokens', PATH_TOKEN_FUNCTIONS.pathToTokens(filters.path_tokens as string))
      }
    }
    
    if (filters.name) query = query.ilike('name', `%${filters.name}%`)
    if (filters.content_type) query = query.eq('content_type', filters.content_type)
    
    const { data, error } = await query
    
    if (error) {
      throw convertToStorageError(error, 'Failed to list file metadata')
    }
    
    return data as FileMetadata[]
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, 'Failed to list file metadata')
  }
}

/**
 * Searches for file metadata records based on a search term
 * 
 * @param searchTerm - The search term to look for in file names and metadata
 * @param options - Additional options for the search
 * @returns Array of file metadata records matching the search
 * @throws StorageError if search fails
 */
export const searchFileMetadata = async (
  searchTerm: string,
  options: ListFileMetadataOptions = {}
): Promise<FileMetadata[]> => {
  try {
    // Start building the query
    let query = supabase
      .from('files')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,metadata->>'description'.ilike.%${searchTerm}%`)
    
    // Apply filters
    if (options.filters) {
      const { filters } = options
      if (filters.context_type) query = query.eq('context_type', filters.context_type)
      if (filters.context_id) query = query.eq('context_id', filters.context_id)
      if (filters.resource_type) query = query.eq('resource_type', filters.resource_type)
      if (filters.resource_id) query = query.eq('resource_id', filters.resource_id)
      if (filters.is_public !== undefined) query = query.eq('is_public', filters.is_public)
      if (filters.access_level) query = query.eq('access_level', filters.access_level)
      if (filters.created_by) query = query.eq('created_by', filters.created_by)
      if (filters.path_tokens) query = query.contains('path_tokens', filters.path_tokens)
      if (filters.content_type) query = query.eq('content_type', filters.content_type)
    }
    
    // Apply sorting
    if (options.sortBy) {
      query = query.order(options.sortBy.column, { ascending: options.sortBy.order === 'asc' })
    } else {
      // Default sort by created_at desc
      query = query.order('created_at', { ascending: false })
    }
    
    // Apply pagination
    const paginatedQuery = options.limit ? query.limit(options.limit) : query
    const finalQuery = options.offset ? paginatedQuery.range(options.offset, options.offset + (options.limit || 10) - 1) : paginatedQuery
    
    // Execute query
    const { data, error } = await finalQuery
    
    if (error) {
      throw convertToStorageError(error, `Failed to search file metadata for "${searchTerm}"`)
    }
    
    return data as FileMetadata[]
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }
    throw convertToStorageError(error, `Failed to search file metadata for "${searchTerm}"`)
  }
}

/**
 * Updates a file's path tokens
 * 
 * @param fileId - The ID of the file to update
 * @param pathTokens - The new path tokens
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
export const updateFilePathTokens = async (
  fileId: string,
  pathTokens: string[],
  authContext: StorageAuthContext
): Promise<FileMetadata> => {
  return updateFileMetadata(
    fileId,
    { path_tokens: pathTokens },
    authContext
  )
}



/**
 * Gets files by context (e.g., all files for a specific user, organization, or application)
 * 
 * @param contextType - The type of context (user, organization, application, etc.)
 * @param contextId - The ID of the context
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the context
 * @throws StorageError if retrieval fails
 */
export const getFilesByContext = async (
  contextType: string,
  contextId: string,
  options: ListFileMetadataOptions = {}
): Promise<FileMetadata[]> => {
  return listFileMetadata({
    ...options,
    filters: {
      ...options.filters,
      context_type: contextType,
      context_id: contextId
    }
  })
}

/**
 * Gets files by resource (e.g., all files for a specific resource type and ID)
 * 
 * @param resourceType - The type of resource
 * @param resourceId - The ID of the resource
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the resource
 * @throws StorageError if retrieval fails
 */
export const getFilesByResource = async (
  resourceType: string,
  resourceId: string,
  options: ListFileMetadataOptions = {}
): Promise<FileMetadata[]> => {
  return listFileMetadata({
    ...options,
    filters: {
      ...options.filters,
      resource_type: resourceType,
      resource_id: resourceId
    }
  })
}

/**
 * Gets files by path tokens
 * 
 * @param pathTokens - The path tokens to get files for
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the path tokens
 * @throws StorageError if retrieval fails
 */
export const getFilesByPathTokens = async (
  pathTokens: string[],
  options: ListFileMetadataOptions = {}
): Promise<FileMetadata[]> => {
  return listFileMetadata({
    ...options,
    filters: {
      ...options.filters,
      path_tokens: pathTokens
    }
  })
}

