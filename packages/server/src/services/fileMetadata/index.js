"use strict";
/**
 * File Metadata Manager
 *
 * This service provides functions for managing file metadata in the database.
 * It handles creating, updating, retrieving, and deleting file metadata records,
 * as well as searching and listing files based on various criteria.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilesByVirtualPath = exports.getFilesByResource = exports.getFilesByContext = exports.updateFileVirtualPath = exports.searchFileMetadata = exports.listFileMetadata = exports.deleteFileMetadata = exports.getFileMetadataByPath = exports.getFileMetadataById = exports.updateFileMetadata = exports.createFileMetadata = void 0;
const supabase_1 = require("../../utils/supabase");
const uuid_1 = require("uuid");
const errors_1 = require("../../errors");
const storage_1 = require("../../constants/storage");
/**
 * Creates a new file metadata record in the database
 *
 * @param options - Options for creating the file metadata
 * @param authContext - Authentication context
 * @returns The created file metadata
 * @throws StorageError if creation fails
 */
const createFileMetadata = async (options, authContext) => {
    try {
        // Set default values
        const fileId = (0, uuid_1.v4)();
        const isPublic = options.is_public !== undefined ? options.is_public : false;
        const accessLevel = options.access_level || storage_1.FILE_ACCESS_LEVELS.PRIVATE;
        // Check if file already exists with the same path
        const { data: existingFile } = await supabase_1.supabase
            .from('files')
            .select('id')
            .eq('path', options.path)
            .eq('bucket', options.bucket)
            .single();
        if (existingFile) {
            throw (0, errors_1.createFileAlreadyExistsError)(options.name, options.path);
        }
        // Create file metadata
        const { data, error } = await supabase_1.supabase
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
            virtual_path: options.virtual_path
        })
            .select()
            .single();
        if (error) {
            throw (0, errors_1.convertToStorageError)(error, `Failed to create file metadata for ${options.path}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to create file metadata`);
    }
};
exports.createFileMetadata = createFileMetadata;
/**
 * Updates an existing file metadata record in the database
 *
 * @param fileId - The ID of the file to update
 * @param options - Options for updating the file metadata
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
const updateFileMetadata = async (fileId, options, authContext) => {
    try {
        // Check if file exists
        const { data: existingFile } = await supabase_1.supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();
        if (!existingFile) {
            throw (0, errors_1.createFileNotFoundError)(fileId);
        }
        // Prepare update data
        const updateData = {
            updated_at: new Date().toISOString()
        };
        if (options.name !== undefined)
            updateData.name = options.name;
        if (options.content_type !== undefined)
            updateData.content_type = options.content_type;
        if (options.size !== undefined)
            updateData.size = options.size;
        if (options.is_public !== undefined)
            updateData.is_public = options.is_public;
        if (options.access_level !== undefined)
            updateData.access_level = options.access_level;
        if (options.virtual_path !== undefined)
            updateData.virtual_path = options.virtual_path;
        // Handle metadata updates (merge with existing metadata)
        if (options.metadata !== undefined) {
            updateData.metadata = {
                ...(existingFile.metadata || {}),
                ...options.metadata
            };
        }
        // Update file metadata
        const { data, error } = await supabase_1.supabase
            .from('files')
            .update(updateData)
            .eq('id', fileId)
            .select()
            .single();
        if (error) {
            throw (0, errors_1.convertToStorageError)(error, `Failed to update file metadata for ${fileId}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to update file metadata for ${fileId}`);
    }
};
exports.updateFileMetadata = updateFileMetadata;
/**
 * Gets a file metadata record by ID
 *
 * @param fileId - The ID of the file to get
 * @returns The file metadata or null if not found
 * @throws StorageError if retrieval fails
 */
const getFileMetadataById = async (fileId) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('files')
            .select('*')
            .eq('id', fileId)
            .single();
        if (error) {
            // If the error is a 404, return null
            if (error.code === 'PGRST116') {
                return null;
            }
            throw (0, errors_1.convertToStorageError)(error, `Failed to get file metadata for ${fileId}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to get file metadata for ${fileId}`);
    }
};
exports.getFileMetadataById = getFileMetadataById;
/**
 * Gets a file metadata record by path and bucket
 *
 * @param bucket - The bucket containing the file
 * @param path - The path of the file within the bucket
 * @returns The file metadata or null if not found
 * @throws StorageError if retrieval fails
 */
const getFileMetadataByPath = async (bucket, path) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('files')
            .select('*')
            .eq('bucket', bucket)
            .eq('path', path)
            .single();
        if (error) {
            // If the error is a 404, return null
            if (error.code === 'PGRST116') {
                return null;
            }
            throw (0, errors_1.convertToStorageError)(error, `Failed to get file metadata for ${bucket}/${path}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to get file metadata for ${bucket}/${path}`);
    }
};
exports.getFileMetadataByPath = getFileMetadataByPath;
/**
 * Deletes a file metadata record from the database
 *
 * @param fileId - The ID of the file to delete
 * @returns True if the file was deleted, false if it didn't exist
 * @throws StorageError if deletion fails
 */
const deleteFileMetadata = async (fileId) => {
    try {
        // Check if file exists
        const { data: existingFile } = await supabase_1.supabase
            .from('files')
            .select('id')
            .eq('id', fileId)
            .single();
        if (!existingFile) {
            return false;
        }
        // Delete file metadata
        const { error } = await supabase_1.supabase
            .from('files')
            .delete()
            .eq('id', fileId);
        if (error) {
            throw (0, errors_1.convertToStorageError)(error, `Failed to delete file metadata for ${fileId}`);
        }
        return true;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to delete file metadata for ${fileId}`);
    }
};
exports.deleteFileMetadata = deleteFileMetadata;
/**
 * Lists file metadata records based on various criteria
 *
 * @param options - Options for listing file metadata
 * @returns Array of file metadata records
 * @throws StorageError if listing fails
 */
const listFileMetadata = async (options = {}) => {
    try {
        // Start building the query
        let query = supabase_1.supabase
            .from('files')
            .select('*');
        // Apply filters
        if (options.filters) {
            const { filters } = options;
            if (filters.context_type)
                query = query.eq('context_type', filters.context_type);
            if (filters.context_id)
                query = query.eq('context_id', filters.context_id);
            if (filters.resource_type)
                query = query.eq('resource_type', filters.resource_type);
            if (filters.resource_id)
                query = query.eq('resource_id', filters.resource_id);
            if (filters.is_public !== undefined)
                query = query.eq('is_public', filters.is_public);
            if (filters.access_level)
                query = query.eq('access_level', filters.access_level);
            if (filters.created_by)
                query = query.eq('created_by', filters.created_by);
            if (filters.virtual_path)
                query = query.eq('virtual_path', filters.virtual_path);
            if (filters.name)
                query = query.ilike('name', `%${filters.name}%`);
            if (filters.content_type)
                query = query.eq('content_type', filters.content_type);
        }
        // Apply sorting
        if (options.sortBy) {
            query = query.order(options.sortBy.column, { ascending: options.sortBy.order === 'asc' });
        }
        else {
            // Default sort by created_at desc
            query = query.order('created_at', { ascending: false });
        }
        // Apply pagination
        const paginatedQuery = options.limit ? query.limit(options.limit) : query;
        const finalQuery = options.offset ? paginatedQuery.range(options.offset, options.offset + (options.limit || 10) - 1) : paginatedQuery;
        // Execute query
        const { data, error } = await finalQuery;
        if (error) {
            throw (0, errors_1.convertToStorageError)(error, 'Failed to list file metadata');
        }
        return data;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, 'Failed to list file metadata');
    }
};
exports.listFileMetadata = listFileMetadata;
/**
 * Searches for file metadata records based on a search term
 *
 * @param searchTerm - The search term to look for in file names and metadata
 * @param options - Additional options for the search
 * @returns Array of file metadata records matching the search
 * @throws StorageError if search fails
 */
const searchFileMetadata = async (searchTerm, options = {}) => {
    try {
        // Start building the query
        let query = supabase_1.supabase
            .from('files')
            .select('*')
            .or(`name.ilike.%${searchTerm}%,metadata->>'description'.ilike.%${searchTerm}%`);
        // Apply filters
        if (options.filters) {
            const { filters } = options;
            if (filters.context_type)
                query = query.eq('context_type', filters.context_type);
            if (filters.context_id)
                query = query.eq('context_id', filters.context_id);
            if (filters.resource_type)
                query = query.eq('resource_type', filters.resource_type);
            if (filters.resource_id)
                query = query.eq('resource_id', filters.resource_id);
            if (filters.is_public !== undefined)
                query = query.eq('is_public', filters.is_public);
            if (filters.access_level)
                query = query.eq('access_level', filters.access_level);
            if (filters.created_by)
                query = query.eq('created_by', filters.created_by);
            if (filters.virtual_path)
                query = query.eq('virtual_path', filters.virtual_path);
            if (filters.content_type)
                query = query.eq('content_type', filters.content_type);
        }
        // Apply sorting
        if (options.sortBy) {
            query = query.order(options.sortBy.column, { ascending: options.sortBy.order === 'asc' });
        }
        else {
            // Default sort by created_at desc
            query = query.order('created_at', { ascending: false });
        }
        // Apply pagination
        const paginatedQuery = options.limit ? query.limit(options.limit) : query;
        const finalQuery = options.offset ? paginatedQuery.range(options.offset, options.offset + (options.limit || 10) - 1) : paginatedQuery;
        // Execute query
        const { data, error } = await finalQuery;
        if (error) {
            throw (0, errors_1.convertToStorageError)(error, `Failed to search file metadata for "${searchTerm}"`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errors_1.StorageError) {
            throw error;
        }
        throw (0, errors_1.convertToStorageError)(error, `Failed to search file metadata for "${searchTerm}"`);
    }
};
exports.searchFileMetadata = searchFileMetadata;
/**
 * Updates the virtual path of a file
 *
 * @param fileId - The ID of the file to update
 * @param virtualPath - The new virtual path
 * @param authContext - Authentication context
 * @returns The updated file metadata
 * @throws StorageError if update fails
 */
const updateFileVirtualPath = async (fileId, virtualPath, authContext) => {
    return (0, exports.updateFileMetadata)(fileId, { virtual_path: virtualPath }, authContext);
};
exports.updateFileVirtualPath = updateFileVirtualPath;
/**
 * Gets files by context (e.g., all files for a specific user, organization, or application)
 *
 * @param contextType - The type of context (user, organization, application, etc.)
 * @param contextId - The ID of the context
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the context
 * @throws StorageError if retrieval fails
 */
const getFilesByContext = async (contextType, contextId, options = {}) => {
    return (0, exports.listFileMetadata)({
        ...options,
        filters: {
            ...options.filters,
            context_type: contextType,
            context_id: contextId
        }
    });
};
exports.getFilesByContext = getFilesByContext;
/**
 * Gets files by resource (e.g., all files for a specific resource type and ID)
 *
 * @param resourceType - The type of resource
 * @param resourceId - The ID of the resource
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the resource
 * @throws StorageError if retrieval fails
 */
const getFilesByResource = async (resourceType, resourceId, options = {}) => {
    return (0, exports.listFileMetadata)({
        ...options,
        filters: {
            ...options.filters,
            resource_type: resourceType,
            resource_id: resourceId
        }
    });
};
exports.getFilesByResource = getFilesByResource;
/**
 * Gets files by virtual path
 *
 * @param virtualPath - The virtual path to get files for
 * @param options - Additional options for listing
 * @returns Array of file metadata records for the virtual path
 * @throws StorageError if retrieval fails
 */
const getFilesByVirtualPath = async (virtualPath, options = {}) => {
    return (0, exports.listFileMetadata)({
        ...options,
        filters: {
            ...options.filters,
            virtual_path: virtualPath
        }
    });
};
exports.getFilesByVirtualPath = getFilesByVirtualPath;
//# sourceMappingURL=index.js.map