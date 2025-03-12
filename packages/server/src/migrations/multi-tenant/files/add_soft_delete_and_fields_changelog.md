# Add Soft Delete and Additional Fields to Files Table

## Migration Date: 2023-07-14

## Description

This migration adds soft delete functionality and additional fields to the `public.files` table to enhance file management capabilities.

## Changes

### Added Columns

1. `is_deleted` (BOOLEAN, NOT NULL, DEFAULT FALSE)
   - Flag to indicate if a file has been soft-deleted
   - Used to filter out deleted files from regular queries

2. `description` (TEXT)
   - Text field for storing file descriptions
   - Allows users to add context or notes about files

3. `is_shareable` (BOOLEAN, NOT NULL, DEFAULT FALSE)
   - Flag to indicate if a file can be shared with others
   - Controls sharing functionality in the UI

### Added Index

- `idx_files_is_deleted` on `is_deleted` column
  - Improves performance when filtering for non-deleted files

### Updated RLS Policies

All regular access policies were updated to include `is_deleted = false` condition:

1. "Anyone can access public files"
2. "Users can access application files"
3. "Users can access organization files"
4. "Users can access their own files"

The "Platform admins can access all files" policy was left unchanged to allow admins to see all files including deleted ones.

### Added RLS Policy

- "Platform admins can restore deleted files"
  - Allows platform admins to restore soft-deleted files

### Added Functions

1. `soft_delete_file(file_id BIGINT)`
   - Sets `is_deleted = TRUE` for the specified file
   - Checks permissions before allowing the operation
   - Returns boolean indicating success

2. `restore_deleted_file(file_id BIGINT)`
   - Sets `is_deleted = FALSE` for the specified file
   - Checks permissions before allowing the operation
   - Returns boolean indicating success

## TypeScript Implementation Examples

### Authorization Utility Functions

```typescript
/**
 * Authorization Utility Functions
 * 
 * Utility functions for checking permissions using Supabase RPC functions.
 */
import { getInstance } from '../index';
import logger from '../utils/logger';

/**
 * Check if a user has a specific permission
 * 
 * @param userId The user ID to check
 * @param permission The permission to check (e.g., 'image.read', 'file.create')
 * @returns Promise<boolean> True if the user has the permission, false otherwise
 */
export const hasPermission = async (userId: string, permission: string): Promise<boolean> => {
  try {
    if (!userId) {
      logger.debug('No user ID provided for permission check');
      return false;
    }

    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return false;
    }

    // Call the authorize function in Supabase
    const { data, error } = await app.Supabase.rpc('authorize', {
      requested_permission: permission
    });

    if (error) {
      logger.error(`Error checking permission ${permission}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error(`Error in hasPermission check:`, error);
    return false;
  }
};

/**
 * Check if a user is a platform admin
 * 
 * @param user The user object with JWT claims
 * @returns boolean True if the user is a platform admin, false otherwise
 */
export const isPlatformAdmin = (user: any): boolean => {
  return user?.is_platform_admin === true;
};

/**
 * Check if a user has permission, considering platform admin status
 * Platform admins always have all permissions
 * 
 * @param user The user object with JWT claims and userId
 * @param permission The permission to check
 * @returns Promise<boolean> True if the user has the permission, false otherwise
 */
export const checkPermission = async (user: any, permission: string): Promise<boolean> => {
  // No user, no permission
  if (!user || !user.userId) {
    return false;
  }
  
  // Platform admins always have all permissions
  if (isPlatformAdmin(user)) {
    logger.debug(`Platform admin user ${user.userId} granted permission: ${permission}`);
    return true;
  }
  
  // Check specific permission
  const hasAccess = await hasPermission(user.userId, permission);
  
  if (hasAccess) {
    logger.debug(`User ${user.userId} granted permission: ${permission}`);
  } else {
    logger.debug(`User ${user.userId} denied permission: ${permission}`);
  }
  
  return hasAccess;
};
```

### Controller Implementation

```typescript
/**
 * Platform Assets Controller
 * 
 * This controller handles basic operations for platform assets (images, files, media).
 * Includes soft delete functionality for safer file management.
 */
import { Request, Response, NextFunction } from 'express';
import { getInstance } from '../../index';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/authorizationUtils';

/**
 * Soft delete an image
 * 
 * @route DELETE /api/v1/platform/assets/images/:id
 * @param {Request} req - Express request object with image ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with delete result
 */
export const softDeleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete images
    const hasPermission = await checkPermission(req.user, 'image.delete');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.delete'
      });
    }
    
    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error - Supabase client not initialized' 
      });
    }
    
    // Call the soft_delete_file function in Supabase
    const { data, error } = await app.Supabase.rpc('soft_delete_file', {
      file_id: parseInt(id)
    });
    
    if (error) {
      logger.error('Error soft deleting file:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to delete file',
        error: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'File not found or you do not have permission to delete it'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'File marked as deleted successfully'
    });
  } catch (error) {
    logger.error('Unexpected error in softDeleteImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Restore a soft-deleted image
 * 
 * @route POST /api/v1/platform/assets/images/:id/restore
 * @param {Request} req - Express request object with image ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with restore result
 */
export const restoreImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update images
    const hasPermission = await checkPermission(req.user, 'image.update');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.update'
      });
    }
    
    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error - Supabase client not initialized' 
      });
    }
    
    // Call the restore_deleted_file function in Supabase
    const { data, error } = await app.Supabase.rpc('restore_deleted_file', {
      file_id: parseInt(id)
    });
    
    if (error) {
      logger.error('Error restoring file:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to restore file',
        error: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'File not found or you do not have permission to restore it'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'File restored successfully'
    });
  } catch (error) {
    logger.error('Unexpected error in restoreImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * List all images, excluding deleted ones for regular users
 * Platform admins can see all images including deleted ones with a filter parameter
 * 
 * @route GET /api/v1/platform/assets/images
 * @param {Request} req - Express request object with optional query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with list of images
 */
export const listImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { includeDeleted } = req.query;
    
    // Check if user has permission to read images
    const hasPermission = await checkPermission(req.user, 'image.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.read'
      });
    }
    
    const isPlatformAdmin = req.user?.is_platform_admin === true;
    
    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error - Supabase client not initialized' 
      });
    }
    
    // Base query - RLS will automatically filter based on permissions
    let query = app.Supabase
      .from('files')
      .select('*')
      .eq('resource_type', 'image');
    
    // Only platform admins can see deleted files, and only if they explicitly request them
    if (isPlatformAdmin && includeDeleted === 'true') {
      // No additional filter - show all files including deleted ones
    } else {
      // For regular users or when platform admins don't request deleted files
      query = query.eq('is_deleted', false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error listing images:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to list images',
        error: error.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data,
      count: data?.length || 0
    });
  } catch (error) {
    logger.error('Unexpected error in listImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
```

### Router Implementation

```typescript
/**
 * Platform Assets Routes
 * 
 * Routes for managing platform assets with soft delete functionality.
 */
import express from 'express';
import * as assetsController from '../../controllers/assetsController';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// List all images (with filter for deleted ones for admins)
router.get('/', assetsController.listImages);

// Upload a new image
router.post('/upload', upload.single('file'), assetsController.uploadImage);

// Get a specific image
router.get('/:id', assetsController.getImage);

// Update image metadata
router.put('/:id', assetsController.updateImage);

// Soft delete an image
router.delete('/:id', assetsController.softDeleteImage);

// Restore a soft-deleted image
router.post('/:id/restore', assetsController.restoreImage);

// List deleted images (admin only)
router.get('/deleted', assetsController.listDeletedImages);

export default router;
```

### Service Layer Implementation

```typescript
/**
 * File Service
 * 
 * Service for handling file operations with soft delete support.
 */
import { getInstance } from '../../index';
import logger from '../../utils/logger';
import { checkPermission } from '../../utils/authorizationUtils';

/**
 * Soft delete a file by ID
 * 
 * @param {number} fileId - The ID of the file to delete
 * @param {any} user - The user object with JWT claims and userId
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const softDeleteFile = async (fileId: number, user: any): Promise<boolean> => {
  try {
    // Check if user has permission to delete files
    const hasPermission = await checkPermission(user, 'file.delete');
    if (!hasPermission) {
      logger.debug(`User ${user?.userId} denied permission: file.delete`);
      return false;
    }
    
    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return false;
    }
    
    const { data, error } = await app.Supabase.rpc('soft_delete_file', {
      file_id: fileId
    });
    
    if (error) {
      logger.error('Error in softDeleteFile service:', error);
      return false;
    }
    
    return !!data; // Convert to boolean
  } catch (error) {
    logger.error('Unexpected error in softDeleteFile service:', error);
    return false;
  }
};

/**
 * Restore a soft-deleted file by ID
 * 
 * @param {number} fileId - The ID of the file to restore
 * @param {any} user - The user object with JWT claims and userId
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const restoreFile = async (fileId: number, user: any): Promise<boolean> => {
  try {
    // Check if user has permission to update files
    const hasPermission = await checkPermission(user, 'file.update');
    if (!hasPermission) {
      logger.debug(`User ${user?.userId} denied permission: file.update`);
      return false;
    }
    
    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return false;
    }
    
    const { data, error } = await app.Supabase.rpc('restore_deleted_file', {
      file_id: fileId
    });
    
    if (error) {
      logger.error('Error in restoreFile service:', error);
      return false;
    }
    
    return !!data; // Convert to boolean
  } catch (error) {
    logger.error('Unexpected error in restoreFile service:', error);
    return false;
  }
};

/**
 * Get files with optional filters including deleted status
 * 
 * @param {Object} options - Query options
 * @param {string} options.resourceType - Type of resource (image, file, media)
 * @param {boolean} options.includeDeleted - Whether to include deleted files
 * @param {string} options.contextType - Context type (platform, application, organization)
 * @param {string} options.contextId - Context ID
 * @param {any} user - The user object with JWT claims and userId
 * @returns {Promise<Array>} Array of files matching the criteria
 */
export const getFiles = async (
  options: {
    resourceType?: string;
    includeDeleted?: boolean;
    contextType?: string;
    contextId?: string;
  },
  user: any
): Promise<any[]> => {
  try {
    // Check if user has permission to read files
    const permissionType = options.resourceType === 'image' ? 'image.read' : 'file.read';
    const hasPermission = await checkPermission(user, permissionType);
    if (!hasPermission) {
      logger.debug(`User ${user?.userId} denied permission: ${permissionType}`);
      return [];
    }
    
    // Get the Supabase client from the App instance
    const app = getInstance();
    if (!app || !app.Supabase) {
      logger.error('Supabase client not initialized');
      return [];
    }
    
    let query = app.Supabase.from('files').select('*');
    
    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }
    
    // Only platform admins can see deleted files, and only if they explicitly request them
    const isPlatformAdmin = user?.is_platform_admin === true;
    if (isPlatformAdmin && options.includeDeleted) {
      // No additional filter - show all files including deleted ones
    } else {
      // For regular users or when platform admins don't request deleted files
      query = query.eq('is_deleted', false);
    }
    
    if (options.contextType) {
      query = query.eq('context_type', options.contextType);
    }
    
    if (options.contextId) {
      query = query.eq('context_id', options.contextId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error('Error in getFiles service:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('Unexpected error in getFiles service:', error);
    return [];
  }
};
```

## Benefits

1. Protection against accidental deletion
2. Ability to recover deleted files
3. Maintains historical record
4. Prevents data loss in critical systems
5. Enhanced metadata with description field
6. Better control over file sharing

## Related Documentation

- [Basic Upload Test Handoff Document](/docs/documentation/handoff/07_file_storage/basic_test_implementation/basic_upload_test_handoff.md)
- [API Design Principles](/docs/documentation/handoff/07_file_storage/basic_test_implementation/api_design_principles.md)
- [Basic Upload Test Changelog](/docs/documentation/handoff/07_file_storage/basic_test_implementation/basic_upload_test_changelog.md) 