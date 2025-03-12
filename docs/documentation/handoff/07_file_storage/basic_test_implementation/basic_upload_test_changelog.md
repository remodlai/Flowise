# Basic Upload Test Implementation Changelog

## 2023-07-10: Initial Setup

- Created this changelog to track progress on the basic upload test implementation

## 2023-07-11: Permission Setup

- Added a new permission category for Media: `Media` with description "Media-related permissions"
- Added the following image permissions under the existing Image category:
  - `image.create`: Permission to upload images
  - `image.delete`: Permission to delete images
  - `image.read`: Permission to view images
  - `image.update`: Permission to update images
  - `image.share`: Permission to share images
- Added the following media permissions under the new Media category:
  - `media.create`: Permission to upload media files
  - `media.delete`: Permission to delete media files
  - `media.read`: Permission to access media files
  - `media.update`: Permission to update media files
  - `media.share`: Permission to share media files
  - `media.stream`: Permission to stream media files

These permissions will be used to control access to image and media operations in the platform. The distinction between images, files, and media is important because:

1. Images require special handling like resizing and Base64 encoding
2. Files are extracted and converted to text strings
3. Media may require streaming capabilities

## 2023-07-12: Role Permission Assignment

- Assigned all image and media permissions to the platform_admin role:
  - `image.create`, `image.delete`, `image.read`, `image.update`, `image.share`
  - `media.create`, `media.delete`, `media.read`, `media.update`, `media.share`, `media.stream`
- This ensures that platform admins have full access to manage images and media files

## 2023-07-13: API Design Principles

- Created API design principles document (`api_design_principles.md`) to establish consistent patterns for asset management APIs
- Defined URL structure using context-based routing with assets category:
  - `/api/v1/platform/assets/images`
  - `/api/v1/applications/{appId}/assets/images`
  - `/api/v1/organizations/{orgId}/assets/images`
  - `/api/v1/users/{userId}/assets/images`
- Defined standard operations for each asset type:
  - GET / - List all assets
  - POST /upload - Upload a new asset
  - GET /:id - Get a specific asset
  - PUT /:id - Update asset metadata (rename, permissions, etc.)
  - DELETE /:id - Delete a specific asset

## 2023-07-14: Soft Delete and Additional Fields

- Added soft delete functionality to the files table:
  - Added `is_deleted` boolean column (default: false)
  - Created index on `is_deleted` for faster filtering
  - Updated RLS policies to exclude deleted files from regular queries
  - Created functions for soft delete and restore operations:
    - `soft_delete_file(file_id)`: Marks a file as deleted
    - `restore_deleted_file(file_id)`: Restores a previously deleted file
- Added additional fields to the files table:
  - `description`: Text field for file descriptions
  - `is_shareable`: Boolean field to indicate if a file can be shared (default: false)
- Modified RLS policies to ensure deleted files are not visible to regular users
- Platform admins can still see and restore deleted files
- Added TypeScript code examples to demonstrate implementation:
  - Controller examples for soft delete and restore operations
  - Router configuration for all endpoints including restore functionality
  - Service layer implementation for file operations with soft delete support

Benefits of soft delete:
1. Protection against accidental deletion
2. Ability to recover deleted files
3. Maintains historical record
4. Prevents data loss in critical systems

Next steps:
- Create API endpoints for image upload/download following the established design principles
- Implement the "Manage Platform Logo" UI component
- Update API controllers to use soft delete functionality instead of hard delete

## 2023-07-15: Authorization Utility Functions

- Created authorization utility functions in `/packages/server/src/utils/authorizationUtils.ts`
- Implemented functions for checking permissions and platform admin status
- Updated TypeScript code examples to use the proper Supabase client and authorization utilities

## 2023-07-16: Assets Controller and File Service

- Implemented the assets controller with soft delete and restore functionality
- Created the file service for handling file operations
- Added routes for platform assets
- Registered the routes in the main routes file
- Implemented the following endpoints:
  - GET /api/v1/platform/assets/images - List all images
  - POST /api/v1/platform/assets/images/upload - Upload a new image
  - GET /api/v1/platform/assets/images/:id - Get a specific image
  - PUT /api/v1/platform/assets/images/:id - Update image metadata
  - DELETE /api/v1/platform/assets/images/:id - Soft delete an image
  - POST /api/v1/platform/assets/images/:id/restore - Restore a soft-deleted image
  - GET /api/v1/platform/assets/images/deleted - List deleted images (admin only)
- Added proper error handling and permission checking
- Ensured all endpoints follow the API design principles

## 2023-07-17: Added Dedicated Endpoints for Retrieving Image URLs and Content

- Added dedicated endpoints for retrieving image URLs and content:
  - GET /api/v1/platform/assets/images/:id/url - Get the public URL for an image
  - GET /api/v1/platform/assets/images/:id/content - Get the direct image content
- Enhanced the assets controller with the following functions:
  - `getImageUrl` - Returns the public URL for an image with metadata
  - `getImageContent` - Streams the image content directly with appropriate headers
- Updated routes configuration to include the new endpoints
- Updated documentation to reflect the new functionality
- These endpoints will be essential for platform integration, allowing:
  - Easy embedding of images in HTML/UI components
  - Direct access to image content for manipulation
  - Consistent URL retrieval for stored images
