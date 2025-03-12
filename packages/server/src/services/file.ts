/**
 * File Service
 * 
 * This service handles operations related to files stored in Supabase Storage
 * and their metadata in the files table.
 */
import { getInstance } from '../index';
import logger from '../utils/logger';
import { checkPermission } from '../utils/authorizationUtils';

interface GetFilesOptions {
  resourceType?: string;
  contextType?: string;
  contextId?: string;
  includeDeleted?: boolean;
}

/**
 * File service for handling file operations
 */
export const fileService = {
  /**
   * Get files based on filter options
   * 
   * @param {GetFilesOptions} options - Filter options for files
   * @param {any} user - User object with permissions
   * @returns {Promise<any[]>} Array of file objects
   */
  async getFiles(options: GetFilesOptions, user: any): Promise<any[]> {
    try {
      const { resourceType, contextType, contextId, includeDeleted } = options;
      
      // Get the Supabase client from the App instance
      const app = getInstance();
      if (!app || !app.Supabase) {
        logger.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
      }
      
      // Start building the query
      let query = app.Supabase
        .from('files')
        .select('*');
      
      // Apply filters
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }
      
      if (contextType) {
        query = query.eq('context_type', contextType);
      }
      
      if (contextId) {
        query = query.eq('context_id', contextId);
      }
      
      // Handle deleted files
      if (!includeDeleted) {
        query = query.eq('is_deleted', false);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        logger.error('Error getting files:', error);
        throw new Error(`Failed to get files: ${error.message}`);
      }
      
      return data || [];
    } catch (error: any) {
      logger.error('Unexpected error in getFiles:', error);
      throw new Error(`Failed to get files: ${error.message}`);
    }
  },
  
  /**
   * Soft delete a file
   * 
   * @param {number} fileId - ID of the file to delete
   * @param {any} user - User object with permissions
   * @returns {Promise<boolean>} True if successful
   */
  async softDeleteFile(fileId: number, user: any): Promise<boolean> {
    try {
      // Check if user has permission to delete files
      const hasPermission = await checkPermission(user, 'file.delete');
      if (!hasPermission) {
        throw new Error('Forbidden - Missing required permission: file.delete');
      }
      
      // Get the Supabase client from the App instance
      const app = getInstance();
      if (!app || !app.Supabase) {
        logger.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
      }
      
      // Call the soft_delete_file function in Supabase
      const { data, error } = await app.Supabase.rpc('soft_delete_file', {
        file_id: fileId
      });
      
      if (error) {
        logger.error('Error soft deleting file:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
      
      return !!data;
    } catch (error: any) {
      logger.error('Unexpected error in softDeleteFile:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  },
  
  /**
   * Restore a soft-deleted file
   * 
   * @param {number} fileId - ID of the file to restore
   * @param {any} user - User object with permissions
   * @returns {Promise<boolean>} True if successful
   */
  async restoreFile(fileId: number, user: any): Promise<boolean> {
    try {
      // Check if user has permission to update files
      const hasPermission = await checkPermission(user, 'file.update');
      if (!hasPermission) {
        throw new Error('Forbidden - Missing required permission: file.update');
      }
      
      // Get the Supabase client from the App instance
      const app = getInstance();
      if (!app || !app.Supabase) {
        logger.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
      }
      
      // Call the restore_deleted_file function in Supabase
      const { data, error } = await app.Supabase.rpc('restore_deleted_file', {
        file_id: fileId
      });
      
      if (error) {
        logger.error('Error restoring file:', error);
        throw new Error(`Failed to restore file: ${error.message}`);
      }
      
      return !!data;
    } catch (error: any) {
      logger.error('Unexpected error in restoreFile:', error);
      throw new Error(`Failed to restore file: ${error.message}`);
    }
  }
}; 