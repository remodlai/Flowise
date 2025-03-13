/**
 * Platform Assets Controller
 * 
 * This controller handles basic operations for platform assets (images, files, media).
 * 
 * CURRENT IMPLEMENTATION:
 * - Simple endpoints for CRUD operations
 * - No URL path navigation that mirrors storage paths
 * - Basic permission checking via authorize function
 * - Soft delete functionality (is_deleted flag)
 * 
 * FUTURE ENHANCEMENTS:
 * - Update URL paths to reflect storage paths for better browser navigation
 * - Implement breadcrumb-style navigation in the UI
 * - Add support for folder operations (create, move, etc.)
 * - Advanced filtering options for deleted assets
 */
import { Request, Response, NextFunction } from 'express';
import { getInstance } from '../index';
import logger from '../utils/logger';
import { checkPermission } from '../utils/authorizationUtils';
import { fileService } from '../services/file';
import { STORAGE_BUCKETS } from '../utils/supabaseStorage';

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
    const withPaths = req.query.withPaths === 'true';
    
    // Check if user has permission to read images
    const hasPermission = await checkPermission(req.user, 'image.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.read'
      });
    }
    // Get files from the service
    const files = await fileService.getFiles({
      resourceType: 'image',
      includeDeleted: includeDeleted ? true : false,
      withPaths: withPaths,
      contextType: req.query.contextType as string,
      contextId: req.query.contextId as string
    }, req.user);
    
    return res.status(200).json({
      success: true,
      data: files,
      count: files.length
    });
  } catch (error: any) {
    logger.error('Unexpected error in listImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get a specific image by ID
 * 
 * @route GET /api/v1/platform/assets/images/:id
 * @param {Request} req - Express request object with image ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with image data
 */
export const getImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to read images
    const hasPermission = await checkPermission(req.user, 'image.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.read'
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
    
    // Get the file from the database
    const { data, error } = await app.Supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Error getting image:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to get image',
        error: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // If the file is deleted and the user is not a platform admin, return 404
    if (data.is_deleted && !req.user?.is_platform_admin) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    if (data && data.path_tokens) {
      try {
        const path = data.path_tokens.join('/') + '/' + data.name;
        const { data: urlData } = app.Supabase
          .storage
          .from(data.bucket)
          .getPublicUrl(path);
        data.url = urlData?.publicUrl;
        return res.status(200).json({
          success: true,
          data
        });
      } catch (error: any) {
        logger.error('Error getting image URL:', error);
      }
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error('Unexpected error in getImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Upload a new image
 * 
 * @route POST /api/v1/platform/assets/images/upload
 * @param {Request} req - Express request object with file in req.file
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with upload result
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user has permission to create images
    const hasPermission = await checkPermission(req.user, 'image.create');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.create'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
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
    
    // Get file details
    const { originalname, mimetype, size, buffer } = req.file;
    const contextType = req.body.contextType || 'platform';
    const contextId = req.body.contextId;
    const description = req.body.description || '';
    const isPublic = req.body.isPublic === 'true';
    const isShareable = req.body.isShareable === 'true';
    const pathTokens = req.body.pathTokens || [];
    /*
    pathTokens is an array of strings that are the path tokens for the file. 
    example: ['ui', 'images', 'logos']
    This will be used to generate the path for the file in the storage bucket.
    The path will be ui/images/logos/1715549200_logo.png
    The pathTokens will be ['ui', 'images', 'logos']


    */
    
    
    // Validate file type
    if (!mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'File must be an image'
      });
    }
    
    // Generate a unique path for the file
    let normalizedName = originalname.replace(/\s+/g, '_');
    const path =  pathTokens.join('/') + '/' + `${normalizedName}`;
    const bucket = req.body.bucket || STORAGE_BUCKETS.PLATFORM;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await app.Supabase
      .storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: mimetype,
        upsert: false
      });
    
    if (uploadError) {
      logger.error('Error uploading file to storage:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload file to storage',
        error: uploadError.message
      });
    }
    
    // Get the public URL
    //REMODL TODO: We need to check this.  It may not be correct.  referto 
    const { data: urlData } = app.Supabase
      .storage
      .from(bucket)
      .getPublicUrl(path);
    
    const url = urlData?.publicUrl;
    logger.info(`[server][uploadImage] url: ${url}`);
    console.log(`[server][uploadImage] url: ${url}`);
    
    // Save file metadata to database
    const { data: fileData, error: fileError } = await app.Supabase
      .from('files')
      .insert({
        name: normalizedName,
        content_type: mimetype,
        size,
        url,
        bucket,
        path_tokens: pathTokens,
        context_type: contextType,
        context_id: contextId,
        resource_type: 'image',
        is_public: isPublic,
        access_level: isPublic ? 'public' : 'private',
        created_by: req.user?.userId,
        description,
        is_shareable: isShareable,
        is_deleted: false
      })
      .select()
      .single();
    
    if (fileError) {
      logger.error('Error saving file metadata:', fileError);
      
      // Try to delete the uploaded file if metadata save fails
      await app.Supabase.storage.from(bucket).remove([path]);
      
      return res.status(400).json({
        success: false,
        message: 'Failed to save file metadata',
        error: fileError.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      url: url,
      data: fileData
    });
  } catch (error: any) {
    logger.error('Unexpected error in uploadImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update image metadata
 * 
 * @route PUT /api/v1/platform/assets/images/:id
 * @param {Request} req - Express request object with image ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with update result
 */
export const updateImage = async (req: Request, res: Response, next: NextFunction) => {
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
    
    // Get updatable fields from request body
    const { name, description, isPublic, isShareable, pathTokens } = req.body;
    
    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) {
      updateData.is_public = isPublic === true || isPublic === 'true';
      updateData.access_level = updateData.is_public ? 'public' : 'private';
    }
    if (isShareable !== undefined) updateData.is_shareable = isShareable === true || isShareable === 'true';
    if (pathTokens !== undefined) updateData.path_tokens = pathTokens;
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the file metadata
    const { data, error } = await app.Supabase
      .from('files')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating image metadata:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update image metadata',
        error: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Image not found or you do not have permission to update it'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Image metadata updated successfully',
      data
    });
  } catch (error: any) {
    logger.error('Unexpected error in updateImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

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
  } catch (error: any) {
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
  } catch (error: any) {
    logger.error('Unexpected error in restoreImage:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * List deleted images (admin only)
 * 
 * @route GET /api/v1/platform/assets/images/deleted
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with list of deleted images
 */
export const listDeletedImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only platform admins can access this endpoint
    if (!req.user?.is_platform_admin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Platform admin access required'
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
    
    // Get deleted files
    const { data, error } = await app.Supabase
      .from('files')
      .select('*')
      .eq('resource_type', 'image')
      .eq('is_deleted', true);
    
    if (error) {
      logger.error('Error listing deleted images:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to list deleted images',
        error: error.message
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    logger.error('Unexpected error in listDeletedImages:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get the public URL for an image
 * 
 * @route GET /api/v1/platform/assets/images/:id/url
 * @param {Request} req - Express request object with image ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with the public URL
 */
export const getImageUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to read images
    const hasPermission = await checkPermission(req.user, 'image.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.read'
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
    
    // Get the file from the database
    const { data, error } = await app.Supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Error getting image:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to get image',
        error: error.message
      });
    }
    
    // If the file is deleted and the user is not a platform admin, return 404
    if (data.is_deleted && !req.user?.is_platform_admin) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Get a fresh public URL (in case the storage configuration has changed)
    const { data: urlData } = app.Supabase
      .storage
      .from(data.bucket)
      .getPublicUrl(data.path_tokens.join('/') + '/' + data.name);
    
    const url = urlData?.publicUrl;
    logger.info(`[server][getImageUrl] url: ${url}`);
    console.log(`[server][getImageUrl] url: ${url}`);
    return res.status(200).json({
      success: true,
      url,
      contentType: data.content_type,
      name: data.name,
      size: data.size
    });
  } catch (error: any) {
    logger.error('Unexpected error in getImageUrl:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get the direct image content (for embedding in HTML, etc.)
 * 
 * @route GET /api/v1/platform/assets/images/:id/content
 * @param {Request} req - Express request object with image ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} The image content with appropriate content-type
 */
export const getImageContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to read images
    const hasPermission = await checkPermission(req.user, 'image.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: image.read'
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
    
    // Get the file from the database
    const { data, error } = await app.Supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Error getting image:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to get image',
        error: error.message
      });
    }
    
    // If the file is deleted and the user is not a platform admin, return 404
    if (data.is_deleted && !req.user?.is_platform_admin) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    try {
      let sbFileData = null
      let downloadError = null;
      // Download the file content from Supabase Storage
      if (data.bucket && data.path_tokens && data.name) {
      try {
        const { data: fileData } = app.Supabase
        .storage
        .from(data.bucket)
        .getPublicUrl(data.path_tokens.join('/') + '/' + data.name);
        sbFileData = fileData;
      } catch (error: any) {
        downloadError = error;
      }
    }
      
      if (downloadError || !sbFileData) {
        logger.error('Error downloading file from storage:', downloadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to download file from storage',
          error: downloadError?.message || 'No file data returned'
        });
      }
      
      // Convert Blob to Buffer if needed
      const buffer = await fetch(sbFileData.publicUrl).then(response => response.arrayBuffer()).then(arrayBuffer => Buffer.from(arrayBuffer));
      
      // Set appropriate headers
      res.setHeader('Content-Type', data.content_type);
      res.setHeader('Content-Disposition', `inline; filename="${data.name}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Send the file content
      return res.send(buffer);
    } catch (downloadErr: any) {
      logger.error('Error processing file download:', downloadErr);
      return res.status(500).json({
        success: false,
        message: 'Error processing file download',
        error: downloadErr.message
      });
    }
  } catch (error: any) {
    logger.error('Unexpected error in getImageContent:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Upload a new file (all-files)
 * 
 * @route POST /api/v1/platform/assets/files/upload
 * @param {Request} req - Express request object with file in req.file
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with upload result
 */
export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user has permission to create files
    const hasPermission = await checkPermission(req.user, 'file.create');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.create'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
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
    
    // Get file details
    const { originalname, mimetype, size, buffer } = req.file;
    const contextType = req.body.contextType || 'platform';
    const contextId = req.body.contextId;
    const description = req.body.description || '';
    const isPublic = req.body.isPublic === 'true';
    const isShareable = req.body.isShareable === 'true';
    const pathTokens = req.body.pathTokens || [];
    const resourceType = req.body.resourceType || 'document'; // Default to document if not specified
    
    // Generate a unique path for the file
    let normalizedName = originalname.replace(/\s+/g, '_');
    const path = pathTokens.join('/') + '/' + `${normalizedName}`;
    const bucket = req.body.bucket || STORAGE_BUCKETS.PLATFORM;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await app.Supabase
      .storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: mimetype,
        upsert: false
      });
    
    if (uploadError) {
      logger.error('Error uploading file to storage:', uploadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload file to storage',
        error: uploadError.message
      });
    }
    
    // Get the public URL
    const { data: urlData } = app.Supabase
      .storage
      .from(bucket)
      .getPublicUrl(path);
    
    const url = urlData?.publicUrl;
    logger.info(`[server][uploadFile] url: ${url}`);
    
    // Save file metadata to database
    const { data: fileData, error: fileError } = await app.Supabase
      .from('files')
      .insert({
        name: normalizedName,
        content_type: mimetype,
        size,
        url,
        bucket,
        path_tokens: pathTokens,
        context_type: contextType,
        context_id: contextId,
        resource_type: resourceType,
        is_public: isPublic,
        access_level: isPublic ? 'public' : 'private',
        created_by: req.user?.userId,
        description,
        is_shareable: isShareable,
        is_deleted: false
      })
      .select()
      .single();
    
    if (fileError) {
      logger.error('Error saving file metadata:', fileError);
      
      // Try to delete the uploaded file if metadata save fails
      await app.Supabase.storage.from(bucket).remove([path]);
      
      return res.status(400).json({
        success: false,
        message: 'Failed to save file metadata',
        error: fileError.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      url: url,
      data: fileData
    });
  } catch (error: any) {
    logger.error('Unexpected error in uploadFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * List all files (all-filess), excluding deleted ones for regular users
 * Platform admins can see all files including deleted ones with a filter parameter
 * 
 * @route GET /api/v1/platform/assets/files
 * @param {Request} req - Express request object with optional query parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with list of files
 */
export const listFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { includeDeleted } = req.query;
    const withPaths = req.query.withPaths === 'true';
    const resourceType = req.query.resourceType as string || 'document';
    
    // Check if user has permission to read files
    const hasPermission = await checkPermission(req.user, 'file.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.read'
      });
    }
    
    // Get files from the service
    const files = await fileService.getFiles({
      resourceType,
      includeDeleted: includeDeleted ? true : false,
      withPaths,
      contextType: req.query.contextType as string,
      contextId: req.query.contextId as string
    }, req.user);
    
    return res.status(200).json({
      success: true,
      data: files,
      count: files.length
    });
  } catch (error: any) {
    logger.error('Unexpected error in listFiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get a specific file by ID
 * 
 * @route GET /api/v1/platform/assets/files/:id
 * @param {Request} req - Express request object with file ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with file data
 */
export const getFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to read files
    const hasPermission = await checkPermission(req.user, 'file.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.read'
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
    
    // Get the file from the database
    const { data, error } = await app.Supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Error getting file:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to get file',
        error: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // If the file is deleted and the user is not a platform admin, return 404
    if (data.is_deleted && !req.user?.is_platform_admin) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Generate URL if path_tokens exist
    if (data && data.path_tokens) {
      try {
        const path = data.path_tokens.join('/') + '/' + data.name;
        const { data: urlData } = app.Supabase
          .storage
          .from(data.bucket)
          .getPublicUrl(path);
        data.url = urlData?.publicUrl;
      } catch (error: any) {
        logger.error('Error getting file URL:', error);
      }
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error('Unexpected error in getFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update file metadata
 * 
 * @route PUT /api/v1/platform/assets/files/:id
 * @param {Request} req - Express request object with file ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with update result
 */
export const updateFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update files
    const hasPermission = await checkPermission(req.user, 'file.update');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.update'
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
    
    // Get updatable fields from request body
    const { name, description, isPublic, isShareable, pathTokens, resourceType } = req.body;
    
    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) {
      updateData.is_public = isPublic === true || isPublic === 'true';
      updateData.access_level = updateData.is_public ? 'public' : 'private';
    }
    if (isShareable !== undefined) updateData.is_shareable = isShareable === true || isShareable === 'true';
    if (pathTokens !== undefined) updateData.path_tokens = pathTokens;
    if (resourceType !== undefined) updateData.resource_type = resourceType;
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the file metadata
    const { data, error } = await app.Supabase
      .from('files')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating file metadata:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to update file metadata',
        error: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'File not found or you do not have permission to update it'
      });
    }
    
    // Generate URL if path_tokens exist
    if (data && data.path_tokens) {
      try {
        const path = data.path_tokens.join('/') + '/' + data.name;
        const { data: urlData } = app.Supabase
          .storage
          .from(data.bucket)
          .getPublicUrl(path);
        data.url = urlData?.publicUrl;
      } catch (error: any) {
        logger.error('Error getting file URL:', error);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'File metadata updated successfully',
      data
    });
  } catch (error: any) {
    logger.error('Unexpected error in updateFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Soft delete a file
 * 
 * @route DELETE /api/v1/platform/assets/files/:id
 * @param {Request} req - Express request object with file ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with delete result
 */
export const softDeleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to delete files
    const hasPermission = await checkPermission(req.user, 'file.delete');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.delete'
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
    
    // Get the file from the database
    const { data: fileData, error: fileError } = await app.Supabase
      .from('files')
      .select('resource_type')
      .eq('id', id)
      .single();
    
    if (fileError) {
      logger.error('Error getting file:', fileError);
      return res.status(400).json({
        success: false,
        message: 'Failed to get file',
        error: fileError.message
      });
    }
    
    if (!fileData) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    

    
    // Soft delete the file
    const success = await fileService.softDeleteFile(parseInt(id), req.user);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error: any) {
    logger.error('Unexpected error in softDeleteFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Restore a soft-deleted file
 * 
 * @route POST /api/v1/platform/assets/files/:id/restore
 * @param {Request} req - Express request object with file ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with restore result
 */
export const restoreFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to update files
    const hasPermission = await checkPermission(req.user, 'file.update');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.update'
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
    
    // Restore the file
    const success = await fileService.restoreFile(parseInt(id), req.user);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to restore file'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'File restored successfully'
    });
  } catch (error: any) {
    logger.error('Unexpected error in restoreFile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get the public URL for a file (all-files)
 * 
 * @route GET /api/v1/platform/assets/files/:id/url
 * @param {Request} req - Express request object with file ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with the public URL
 */
export const getFileUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to read files
    const hasPermission = await checkPermission(req.user, 'file.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.read'
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
    
    // Get the file from the database
    const { data, error } = await app.Supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Error getting file:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to get file',
        error: error.message
      });
    }
    
    // If the file is deleted and the user is not a platform admin, return 404
    if (data.is_deleted && !req.user?.is_platform_admin) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    
   
    // Generate the public URL
    const { data: urlData } = app.Supabase
      .storage
      .from(data.bucket)
      .getPublicUrl(data.path_tokens.join('/') + '/' + data.name);
    
    const url = urlData?.publicUrl;
    
    return res.status(200).json({
      success: true,
      url,
      data
    });
  } catch (error: any) {
    logger.error('Unexpected error in getFileUrl:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get the direct file content (all-files)
 * 
 * @route GET /api/v1/platform/assets/files/:id/content
 * @param {Request} req - Express request object with file ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} File content with appropriate headers
 */
export const getFileContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission to read files
    const hasPermission = await checkPermission(req.user, 'file.read');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Missing required permission: file.read'
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
    
    // Get the file from the database
    const { data, error } = await app.Supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      logger.error('Error getting file:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to get file',
        error: error.message
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // If the file is deleted and the user is not a platform admin, return 404
    if (data.is_deleted && !req.user?.is_platform_admin) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
  
    
    // Construct the file path
    const filePath = data.path_tokens.join('/') + '/' + data.name;
    
    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await app.Supabase
      .storage
      .from(data.bucket)
      .download(filePath);
    
    if (downloadError) {
      logger.error('Error downloading file:', downloadError);
      return res.status(400).json({
        success: false,
        message: 'Failed to download file',
        error: downloadError.message
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', data.content_type);
    res.setHeader('Content-Disposition', `inline; filename="${data.name}"`);
    
    // Stream the file content
    const buffer = await fileData.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    logger.error('Unexpected error in getFileContent:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 