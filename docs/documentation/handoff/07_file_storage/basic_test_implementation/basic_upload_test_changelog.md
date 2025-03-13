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

## 2023-07-18: Implemented Logo Manager UI Component

- Created a new Logo Manager UI component for managing platform logos:
  - Added a "Manage Platform Logo" button to the Platform Settings page
  - Created a dedicated page for logo management at `/admin/platform/settings/logo`
  - Implemented file upload functionality with validation
  - Added logo display with metadata
  - Implemented download, delete, and restore functionality
  - Added visual indicators for deleted logos
- Enhanced the platform API client with functions for image operations:
  - `listPlatformImages` - List all platform images
  - `getPlatformImage` - Get a specific image by ID
  - `uploadPlatformImage` - Upload a new image
  - `updatePlatformImage` - Update image metadata
  - `deletePlatformImage` - Soft delete an image
  - `restorePlatformImage` - Restore a soft-deleted image
  - `getPlatformImageUrl` - Get the public URL for an image
  - `getPlatformImageContentUrl` - Get the direct content URL for an image
- Updated routes configuration to include the logo management page
- Created comprehensive documentation for the Logo Manager component
- This implementation serves as a proof of concept for Supabase Storage integration, demonstrating:
  - Proper permission checking
  - Soft delete functionality
  - File upload and retrieval
  - Metadata management
  - UI integration with the storage service

## 2023-07-19: Fixed Logo Manager Navigation Issue

- Fixed an issue with the Logo Manager navigation:
  - Changed the route from a standalone route (`/admin/platform-logo`) to a nested route (`/admin/platform/settings/logo`)
  - Updated the navigation in the PlatformSettingsTab component
  - Ensured the Logo Manager is rendered within the Platform Admin layout
  - This fix maintains the platform navigation sidebar when viewing the Logo Manager
  - Updated documentation to reflect the correct routing approach
- This change improves the user experience by:
  - Maintaining consistent navigation throughout the platform admin section
  - Allowing users to easily navigate between different platform settings
  - Preserving the visual hierarchy and context of the platform admin interface

## 2025-03-12: Path Tokens Refactoring

- Identified and fixed inconsistencies in path tokens handling:
  - Standardized the use of camelCase `pathTokens` in API interfaces and TypeScript interfaces
  - Ensured consistent conversion to snake_case `path_tokens` when interacting with the database
  - Fixed duplicate code in `updateFileMetadata` function that was handling path tokens twice
  - Reviewed all controllers to ensure they properly handle the conversion between camelCase and snake_case
  - Updated documentation to clarify the correct approach for path tokens handling
- This refactoring improves code consistency and maintainability by:
  - Following JavaScript/TypeScript conventions (camelCase) for API interfaces
  - Following SQL conventions (snake_case) for database operations
  - Establishing clear boundaries where the conversion between formats happens
  - Reducing potential bugs from inconsistent handling of path tokens
  - Making the codebase more maintainable for future developers

## 2025-03-12: Comprehensive Testing of Assets Controller Endpoints

- Successfully tested all image-related routes in the assetsController:
  - GET `/api/v1/platform/assets/images` - Verified listing of all images works correctly
  - POST `/api/v1/platform/assets/images/upload` - Confirmed image upload with proper path tokens
  - GET `/api/v1/platform/assets/images/:id` - Verified retrieval of specific image metadata
  - PUT `/api/v1/platform/assets/images/:id` - Confirmed updating image metadata (description, isShareable)
  - DELETE `/api/v1/platform/assets/images/:id` - Verified soft delete functionality
  - POST `/api/v1/platform/assets/images/:id/restore` - Confirmed restoration of soft-deleted images
  - GET `/api/v1/platform/assets/images/:id/url` - Verified URL generation from path tokens
  - GET `/api/v1/platform/assets/images/:id/content` - Confirmed direct image content retrieval
- Fixed several issues during testing:
  - Resolved path token handling in URL generation
  - Fixed file path construction for content retrieval
  - Ensured proper authentication and permission checking
  - Verified soft delete and restore functionality with database checks
- Confirmed the integration between Supabase Storage and our database:
  - Files are properly stored in Supabase Storage
  - Metadata is correctly saved in the files table
  - Path tokens are properly used for hierarchical organization
  - Soft delete only affects database records, not storage objects
- This testing validates our approach to file management using:
  - Supabase Storage for the actual file storage
  - PostgreSQL for metadata and access control
  - Path tokens for hierarchical organization
  - Soft delete for data protection

## 2025-03-12: Enhanced URL Generation with Path Tokens

- Updated the file service to always include properly constructed URLs with paths:
  - Modified `getFiles` function to automatically generate URLs using path_tokens
  - Set `withPaths` parameter to default to true for all requests
  - Ensured URLs are constructed by joining path_tokens and appending the filename
  - Tested with the list images endpoint to verify correct URL generation
- This enhancement provides several benefits:
  - Eliminates the need for clients to manually construct file URLs
  - Ensures consistent URL patterns across the application
  - Properly handles path hierarchy reflected in path_tokens
  - Simplifies client-side code by providing ready-to-use URLs
  - Maintains backward compatibility through the optional withPaths parameter
- The implementation joins path_tokens with forward slashes and appends the filename to create the complete path
- URLs are generated using Supabase Storage's getPublicUrl helper function with the constructed path

## 2025-03-12: Added Non-Image File Handling to Assets Controller

- Extended the assets controller with parallel functions for handling non-image files:
  - `listFiles`: List all non-image files with filtering options
  - `uploadFile`: Upload a new non-image file
  - `getFile`: Get a specific non-image file by ID
  - `updateFile`: Update non-image file metadata
  - `softDeleteFile`: Soft delete a non-image file
  - `restoreFile`: Restore a soft-deleted non-image file
  - `getFileUrl`: Get the public URL for a non-image file
  - `getFileContent`: Get the direct content of a non-image file
- Added corresponding routes in the assets router:
  - GET `/api/v1/platform/assets/files`
  - POST `/api/v1/platform/assets/files/upload`
  - GET `/api/v1/platform/assets/files/:id`
  - PUT `/api/v1/platform/assets/files/:id`
  - DELETE `/api/v1/platform/assets/files/:id`
  - POST `/api/v1/platform/assets/files/:id/restore`
  - GET `/api/v1/platform/assets/files/:id/url`
  - GET `/api/v1/platform/assets/files/:id/content`
- Added validation to ensure image files are handled by image endpoints and non-image files by file endpoints
- Implemented resource type handling to categorize different types of files (document, audio, video, etc.)
- Ensured all file operations work with path tokens for hierarchical organization
- Maintained consistent permission checking across all endpoints
- This implementation completes the file handling capabilities of the assets controller, providing a comprehensive API for managing both image and non-image files in the platform
