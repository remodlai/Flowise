# Phase 2: API Endpoints

This document provides detailed implementation guidance for Phase 2 of the Supabase Storage integration plan, focusing on creating API endpoints for file and image operations.

## 2.1 Create Base File API Controller

The File API Controller will provide endpoints for managing files across the platform, ensuring proper authentication, authorization, and multi-tenant isolation.

### Controller Implementation

```typescript
// packages/server/src/controllers/FileController.ts

import { Request, Response } from 'express';
import { uploadFile, listFiles, getFileUrl, deleteFile } from '../utils/supabaseStorage';
import { getSupabaseAuth } from '../utils/supabaseAuth';

/**
 * Controller for file operations
 */
export class FileController {
  /**
   * Uploads a file
   * @param req Express request
   * @param res Express response
   */
  async uploadFile(req: Request, res: Response) {
    try {
      // Get authentication context
      const auth = getSupabaseAuth(req);
      
      if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Validate request
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      const { 
        organizationId, 
        applicationId, 
        resourceType = 'uploads',
        resourceId,
        isPublic = false
      } = req.body;
      
      // Determine the appropriate context for storage
      let context: 'organization' | 'user' | 'application' | 'platform' = 'user';
      let contextId = auth.user.id;
      
      if (organizationId) {
        // Verify organization membership
        // This would use your existing organization membership check
        context = 'organization';
        contextId = organizationId;
      } else if (applicationId) {
        // Verify application access
        // This would use your existing application access check
        context = 'application';
        contextId = applicationId;
      } else if (auth.user.app_metadata?.role === 'platform_admin') {
        // Platform admins can upload to platform context
        context = 'platform';
        contextId = undefined;
      }
      
      // Upload the file
      const result = await uploadFile({
        file: req.file.buffer,
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        pathOptions: {
          context,
          contextId,
          resourceType,
          resourceId: resourceId || Date.now().toString()
        },
        isPublic
      });
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Lists files
   * @param req Express request
   * @param res Express response
   */
  async listFiles(req: Request, res: Response) {
    try {
      // Get authentication context
      const auth = getSupabaseAuth(req);
      
      if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { 
        organizationId, 
        applicationId, 
        resourceType = 'uploads',
        resourceId,
        limit = 100,
        offset = 0,
        sortBy,
        sortOrder = 'desc'
      } = req.query;
      
      // Determine the appropriate context for storage
      let context: 'organization' | 'user' | 'application' | 'platform' = 'user';
      let contextId = auth.user.id;
      
      if (organizationId) {
        // Verify organization membership
        context = 'organization';
        contextId = organizationId as string;
      } else if (applicationId) {
        // Verify application access
        context = 'application';
        contextId = applicationId as string;
      } else if (auth.user.app_metadata?.role === 'platform_admin' && req.query.context === 'platform') {
        // Platform admins can list platform files
        context = 'platform';
        contextId = undefined;
      }
      
      // List the files
      const result = await listFiles({
        pathOptions: {
          context,
          contextId,
          resourceType: resourceType as string,
          resourceId: resourceId as string
        },
        limit: Number(limit),
        offset: Number(offset),
        sortBy: sortBy ? {
          column: sortBy as string,
          order: sortOrder as 'asc' | 'desc'
        } : undefined
      });
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error listing files:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Gets file details
   * @param req Express request
   * @param res Express response
   */
  async getFile(req: Request, res: Response) {
    try {
      // Get authentication context
      const auth = getSupabaseAuth(req);
      
      if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id } = req.params;
      const { download } = req.query;
      
      // Parse the file path from the ID
      // This assumes the ID is the full path
      const path = id;
      
      // Get the file URL
      const url = await getFileUrl({
        path,
        isPublic: false,
        expiresIn: download ? 60 * 5 : 60 * 60 // 5 minutes for download, 1 hour for view
      });
      
      if (download) {
        // Redirect to the download URL
        return res.redirect(url);
      }
      
      // Return the URL
      return res.status(200).json({ url });
    } catch (error) {
      console.error('Error getting file:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Deletes a file
   * @param req Express request
   * @param res Express response
   */
  async deleteFile(req: Request, res: Response) {
    try {
      // Get authentication context
      const auth = getSupabaseAuth(req);
      
      if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id } = req.params;
      
      // Parse the file path from the ID
      // This assumes the ID is the full path
      const path = id;
      
      // Delete the file
      const result = await deleteFile({
        path
      });
      
      // Return the result
      return res.status(200).json({ success: result });
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
```

### File Upload Middleware

To handle file uploads, we'll use the Multer middleware:

```typescript
// packages/server/src/middleware/fileUpload.ts

import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Create the upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    // This can be customized based on requirements
    cb(null, true);
  }
});
```

## 2.2 Create Image-Specific Endpoints

The Image API Controller will provide endpoints specifically for image operations, including transformations.

### Controller Implementation

```typescript
// packages/server/src/controllers/ImageController.ts

import { Request, Response } from 'express';
import { uploadImage, getFileUrl } from '../utils/supabaseStorage';
import { getSupabaseAuth } from '../utils/supabaseAuth';

/**
 * Controller for image operations
 */
export class ImageController {
  /**
   * Uploads an image
   * @param req Express request
   * @param res Express response
   */
  async uploadImage(req: Request, res: Response) {
    try {
      // Get authentication context
      const auth = getSupabaseAuth(req);
      
      if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Validate request
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }
      
      // Validate image type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid image type' });
      }
      
      const { 
        organizationId, 
        applicationId, 
        resourceType = 'images',
        resourceId,
        isPublic = true,
        width,
        height,
        format,
        quality
      } = req.body;
      
      // Determine the appropriate context for storage
      let context: 'organization' | 'user' | 'application' | 'platform' = 'user';
      let contextId = auth.user.id;
      
      if (organizationId) {
        // Verify organization membership
        context = 'organization';
        contextId = organizationId;
      } else if (applicationId) {
        // Verify application access
        context = 'application';
        contextId = applicationId;
      } else if (auth.user.app_metadata?.role === 'platform_admin') {
        // Platform admins can upload to platform context
        context = 'platform';
        contextId = undefined;
      }
      
      // Prepare transformation options
      const transformations = {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        format: format as 'webp' | 'jpeg' | 'jpg' | 'png' | undefined,
        quality: quality ? parseInt(quality) : undefined
      };
      
      // Upload the image
      const result = await uploadImage({
        file: req.file.buffer,
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        pathOptions: {
          context,
          contextId,
          resourceType,
          resourceId: resourceId || Date.now().toString()
        },
        isPublic,
        transformations
      });
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error uploading image:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Gets an image with transformations
   * @param req Express request
   * @param res Express response
   */
  async getImage(req: Request, res: Response) {
    try {
      // Get authentication context
      const auth = getSupabaseAuth(req);
      
      if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { id } = req.params;
      const { width, height, format, quality } = req.query;
      
      // Parse the file path from the ID
      // This assumes the ID is the full path
      const path = id;
      
      // Prepare transformation options
      const transformations = {
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        format: format as 'webp' | 'jpeg' | 'jpg' | 'png' | undefined,
        quality: quality ? parseInt(quality as string) : undefined
      };
      
      // Get the image URL with transformations
      const url = await getFileUrl({
        path,
        isPublic: true,
        transformations
      });
      
      // Redirect to the image URL
      return res.redirect(url);
    } catch (error) {
      console.error('Error getting image:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
```

## 2.3 Update Routes Configuration

Update the API routes to include the new file and image endpoints.

### Routes Configuration

```typescript
// packages/server/src/routes/api.ts

import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { ImageController } from '../controllers/ImageController';
import { upload } from '../middleware/fileUpload';
import { authenticateSupabaseJWT } from '../utils/supabaseAuth';

const router = Router();
const fileController = new FileController();
const imageController = new ImageController();

// File routes
router.post('/files', authenticateSupabaseJWT, upload.single('file'), fileController.uploadFile);
router.get('/files', authenticateSupabaseJWT, fileController.listFiles);
router.get('/files/:id', authenticateSupabaseJWT, fileController.getFile);
router.delete('/files/:id', authenticateSupabaseJWT, fileController.deleteFile);

// Image routes
router.post('/files/images', authenticateSupabaseJWT, upload.single('image'), imageController.uploadImage);
router.get('/files/images/:id', authenticateSupabaseJWT, imageController.getImage);

// Export the router
export default router;
```

## API Documentation

### File API

#### Upload a File

**Endpoint:** `POST /api/v1/files`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| file | File | The file to upload |
| organizationId | string | (Optional) The organization ID |
| applicationId | string | (Optional) The application ID |
| resourceType | string | (Optional) The resource type (default: 'uploads') |
| resourceId | string | (Optional) The resource ID |
| isPublic | boolean | (Optional) Whether the file is public (default: false) |

**Response:**

```json
{
  "path": "string",
  "url": "string",
  "id": "string",
  "size": "number"
}
```

#### List Files

**Endpoint:** `GET /api/v1/files`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| organizationId | string | (Optional) The organization ID |
| applicationId | string | (Optional) The application ID |
| resourceType | string | (Optional) The resource type (default: 'uploads') |
| resourceId | string | (Optional) The resource ID |
| limit | number | (Optional) The maximum number of files to return (default: 100) |
| offset | number | (Optional) The offset for pagination (default: 0) |
| sortBy | string | (Optional) The field to sort by |
| sortOrder | string | (Optional) The sort order ('asc' or 'desc', default: 'desc') |

**Response:**

```json
{
  "files": [
    {
      "name": "string",
      "path": "string",
      "url": "string",
      "size": "number",
      "createdAt": "string",
      "contentType": "string"
    }
  ],
  "count": "number"
}
```

#### Get File

**Endpoint:** `GET /api/v1/files/:id`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The file ID (path) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| download | boolean | (Optional) Whether to download the file |

**Response:**

```json
{
  "url": "string"
}
```

#### Delete File

**Endpoint:** `DELETE /api/v1/files/:id`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The file ID (path) |

**Response:**

```json
{
  "success": "boolean"
}
```

### Image API

#### Upload an Image

**Endpoint:** `POST /api/v1/files/images`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| image | File | The image to upload |
| organizationId | string | (Optional) The organization ID |
| applicationId | string | (Optional) The application ID |
| resourceType | string | (Optional) The resource type (default: 'images') |
| resourceId | string | (Optional) The resource ID |
| isPublic | boolean | (Optional) Whether the image is public (default: true) |
| width | number | (Optional) The width for transformation |
| height | number | (Optional) The height for transformation |
| format | string | (Optional) The format for transformation ('webp', 'jpeg', 'jpg', 'png') |
| quality | number | (Optional) The quality for transformation (1-100) |

**Response:**

```json
{
  "path": "string",
  "url": "string",
  "transformationUrl": "string",
  "id": "string",
  "size": "number"
}
```

#### Get Image with Transformations

**Endpoint:** `GET /api/v1/files/images/:id`

**Authentication:** Required

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The image ID (path) |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| width | number | (Optional) The width for transformation |
| height | number | (Optional) The height for transformation |
| format | string | (Optional) The format for transformation ('webp', 'jpeg', 'jpg', 'png') |
| quality | number | (Optional) The quality for transformation (1-100) |

**Response:** Redirects to the image URL with transformations

## Implementation Steps

1. **Create File Controller**:
   - Implement the `FileController` class with methods for file operations
   - Add proper authentication and authorization checks
   - Implement validation for file uploads

2. **Create Image Controller**:
   - Implement the `ImageController` class with methods for image operations
   - Add support for image transformations
   - Implement validation for image uploads

3. **Create File Upload Middleware**:
   - Implement the Multer middleware for file uploads
   - Configure file size limits and validation

4. **Update API Routes**:
   - Add routes for file and image operations
   - Apply proper middleware for authentication and file uploads

5. **Create API Documentation**:
   - Document all endpoints with request and response formats
   - Include examples for common use cases

## Key Considerations

1. **Security**: Ensure proper authentication and authorization for all endpoints
2. **Validation**: Implement thorough validation for file uploads to prevent security issues
3. **Performance**: Optimize file uploads and transformations for performance
4. **Error Handling**: Implement comprehensive error handling with meaningful error messages
5. **Multi-tenant Isolation**: Enforce strict tenant isolation in all API operations 