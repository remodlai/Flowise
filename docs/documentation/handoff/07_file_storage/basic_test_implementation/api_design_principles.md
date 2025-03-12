# API Design Principles for Asset Management

This document outlines the design principles and conventions for asset management APIs in the Remodl AI platform.

## URL Structure

### Context-Based Routing with Assets Category

We use a context-based routing approach with an "assets" category to organize our API endpoints:

```
/api/v1/platform/assets/images
/api/v1/platform/assets/files
/api/v1/platform/assets/media

/api/v1/applications/{appId}/assets/images
/api/v1/applications/{appId}/assets/files
/api/v1/applications/{appId}/assets/media

/api/v1/organizations/{orgId}/assets/images
/api/v1/organizations/{orgId}/assets/files
/api/v1/organizations/{orgId}/assets/media

/api/v1/users/{userId}/assets/images
/api/v1/users/{userId}/assets/files
/api/v1/users/{userId}/assets/media
```

### Standard Operations

For each asset type, we support the following standard operations:

- `GET /` - List all assets of the specified type
- `POST /upload` - Upload a new asset
- `GET /:id` - Get a specific asset by ID
- `PUT /:id` - Update asset metadata (rename, change permissions, update description, etc.)
- `DELETE /:id` - Soft delete a specific asset by ID (mark as deleted)
- `POST /:id/restore` - Restore a soft-deleted asset

The PUT method is particularly important for:
- Renaming files
- Updating file descriptions or other metadata
- Changing access permissions
- Moving files between folders (updating virtual paths)
- Updating visibility settings (public/private)

### Soft Delete Operations

We implement soft delete functionality for all assets:

- `DELETE /:id` - Marks an asset as deleted (sets `is_deleted = true`) rather than permanently removing it
- `POST /:id/restore` - Restores a previously deleted asset (sets `is_deleted = false`)
- `GET /deleted` - Lists all soft-deleted assets (admin only)

This approach provides several benefits:
1. Protection against accidental deletion
2. Ability to recover deleted files
3. Maintains historical record
4. Prevents data loss in critical systems

### Future Path Extensions

While not implemented in the initial version, we plan to support path-based navigation in the future:

```
/api/v1/platform/assets/images/:path
/api/v1/platform/assets/images/:path/upload
```

Where `:path` corresponds to the `virtual_path` stored in the database.

## Documentation Requirements

### Code Documentation

All API-related code must include:

1. **File-Level Block Comments**:
   - Overview of the file's purpose
   - Current implementation details
   - Future enhancement plans
   - References to relevant documentation

2. **Function-Level Comments**:
   - Route information (HTTP method, path)
   - Parameter descriptions
   - Response format
   - Notes about future extensions

3. **Inline Comments**:
   - Explanations for complex logic
   - References to business rules
   - Temporary workarounds or limitations

### Example Block Comment

```typescript
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
 * 
 * @see /docs/documentation/handoff/07_file_storage/basic_test_implementation/basic_upload_test_handoff.md
 */
```

### Example Function Comment

```typescript
/**
 * Upload a platform image
 * 
 * @route POST /api/v1/platform/assets/images/upload
 * @param {Request} req - Express request object with file in req.file
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with upload result
 * 
 * NOTE: In the future, this could be extended to support path-based uploads:
 * @route POST /api/v1/platform/assets/images/:path/upload
 * where :path would map to the virtual_path in the database
 */
```

### Example Soft Delete Function Comment

```typescript
/**
 * Soft delete an image
 * 
 * @route DELETE /api/v1/platform/assets/images/:id
 * @param {Request} req - Express request object with image ID in req.params.id
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Promise<Response>} JSON response with delete result
 * 
 * NOTE: This operation marks the image as deleted (is_deleted = true)
 * rather than permanently removing it from the database.
 * Only users with appropriate permissions can perform this operation.
 */
```

## Stubbing Future Paths

To ensure we account for future extensions, we should:

1. **Include Commented Route Definitions**:
   ```typescript
   // Current implementation
   router.post('/upload', upload.single('file'), assetsController.uploadImage)
   
   // Future implementation (commented out)
   // router.post('/:path/upload', upload.single('file'), assetsController.uploadImageToPath)
   ```

2. **Create Stub Functions**:
   ```typescript
   /**
   * Upload an image to a specific path (FUTURE IMPLEMENTATION)
   * 
   * @route POST /api/v1/platform/assets/images/:path/upload
   */
   // const uploadImageToPath = async (req: Request, res: Response, next: NextFunction) => {
   //   // Implementation will be added in the future
   //   throw new Error('Not implemented')
   // }
   ```

3. **Document Integration Points**:
   - Identify where future functionality will integrate with existing code
   - Add comments explaining how the integration will work
   - Include references to relevant documentation or design decisions

## Implementation Priorities

1. **Basic Functionality First**:
   - Implement core CRUD operations without path navigation
   - Ensure proper authentication and permission checking
   - Verify Supabase Storage integration works correctly
   - Implement soft delete functionality

2. **Path Navigation Later**:
   - Once basic functionality is verified, implement path-based navigation
   - Update UI to support breadcrumb navigation
   - Add folder operations (create, move, etc.)

3. **Integration with Specialized Systems**:
   - Document stores
   - Vector stores
   - RAG systems
   - Metadata generation

By following these principles, we ensure that our API design is consistent, well-documented, and prepared for future extensions. 