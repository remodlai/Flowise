# Supabase Storage Integration: Basic Upload Test Handoff Document

## Current State

We are in the process of migrating from legacy storage systems (local filesystem and AWS S3) to Supabase Storage for all file operations in the Remodl AI platform. As a first step, we're implementing a basic test to validate the core functionality of Supabase Storage integration.

### Database Structure

1. **Files Table**:
   - The `public.files` table is already set up with the necessary columns:
     - `id`: Primary key
     - `name`: File name
     - `content_type`: MIME type
     - `size`: File size in bytes
     - `bucket`: Supabase Storage bucket
     - `path`: Path within the bucket
     - `context_type`: Type of context (platform, application, organization)
     - `context_id`: ID of the context
     - `resource_type`: Type of resource
     - `is_public`: Whether the file is publicly accessible
     - `access_level`: Access level (private, shared, public)
     - `created_by`: User who created the file
     - `metadata`: Additional metadata as JSONB
     - `path_tokens`: Text array that mirrors Supabase Storage path_tokens for hierarchical organization
     - `description`: Text description of the file (NEW)
     - `is_shareable`: Whether the file can be shared (NEW)
     - `is_deleted`: Soft delete flag (NEW)

2. **RLS Policies**:
   - The `files` table has the following RLS policies:
     - "Platform admins can access all files" using `authorize('platform.admin')`
     - "Users can access application files" using `authorize_resource('file.read', 'application', context_id) AND is_deleted = false`
     - "Users can access organization files" using `authorize_resource('file.read', 'organization', context_id) AND is_deleted = false`
     - "Users can access their own files" using `created_by = auth.uid() AND is_deleted = false`
     - "Anyone can access public files" for public files that are not deleted
     - "Platform admins can restore deleted files" for platform admins to manage deleted files

3. **Authorization Functions**:
   - `authorize(requested_permission text)`: Checks if the user has the requested permission
   - `authorize_resource(requested_permission text, resource_type text, resource_id uuid)`: Checks if the user has the requested permission for a specific resource
   - Both functions have special handling for platform admins via the JWT claim
   - `soft_delete_file(file_id BIGINT)`: Marks a file as deleted (NEW)
   - `restore_deleted_file(file_id BIGINT)`: Restores a previously deleted file (NEW)

4. **Permissions**:
   - We've added new permissions for images and media:
     - Image permissions: `image.create`, `image.delete`, `image.read`, `image.update`, `image.share`
     - Media permissions: `media.create`, `media.delete`, `media.read`, `media.update`, `media.share`, `media.stream`
   - These are in addition to existing file permissions: `file.create`, `file.delete`, `file.read`, `file.update`, `file.share`

5. **API Design Principles**:
   - We've established consistent design principles for asset management APIs
   - See [API Design Principles](./api_design_principles.md) for details on:
     - URL structure
     - Documentation requirements
     - Stubbing future paths
     - Implementation priorities

### Object Schema and Path Tokens

The `path_tokens` field is a critical part of our file storage architecture that deserves special attention:

#### Path Tokens Explained

1. **What are Path Tokens?**
   - `path_tokens` is a text array column that directly mirrors Supabase Storage's internal `path_tokens` field
   - It represents the hierarchical structure of a file's path as an array of segments
   - Example: For a file at `logos/company/main_logo.svg`, the path_tokens would be `["logos", "company", "main_logo.svg"]`

2. **Relationship with Supabase Storage**
   - Supabase Storage internally uses path_tokens for efficient path-based operations
   - Our database schema aligns with this structure for consistency and performance
   - This field replaces the previous `virtual_path` string field, which was less efficient for hierarchical queries

3. **Benefits of Using Path Tokens**
   - More efficient filtering and querying (e.g., `WHERE path_tokens[1] = 'logos'`)
   - Better support for hierarchical navigation
   - Easier implementation of breadcrumb UI components
   - Improved folder-based access control

#### UI Considerations for Path Tokens

When displaying path_tokens in the UI, we follow these guidelines:

1. **Omitting Technical Identifiers**
   - The first token often contains technical identifiers (like org IDs or user IDs)
   - In the UI, we typically omit these technical identifiers for a cleaner presentation
   - Example: For path_tokens `["org_123", "documents", "reports"]`, we might display just "Documents > Reports"

2. **Breadcrumb Navigation**
   - Path tokens naturally map to breadcrumb components
   - Each token (except perhaps the first) becomes a clickable segment in the breadcrumb
   - This allows users to navigate up the folder hierarchy

3. **User-Friendly Names**
   - Technical identifiers can be replaced with user-friendly names
   - Example: Replace "org_123" with the actual organization name "Acme Corp"
   - This improves usability while maintaining the technical structure in the database

4. **Implementation Example**
   ```jsx
   // Example of rendering path_tokens as breadcrumbs
   const renderBreadcrumbs = (pathTokens) => {
     // Skip the first token if it's a technical ID
     const displayTokens = pathTokens[0].startsWith('org_') || 
                           pathTokens[0].startsWith('user_') ? 
                           pathTokens.slice(1) : pathTokens;
     
     return displayTokens.map((token, index) => (
       <Breadcrumb.Item 
         key={index}
         onClick={() => navigateToFolder(pathTokens.slice(0, index + 1))}>
         {token}
       </Breadcrumb.Item>
     ));
   }
   ```

By following these principles, we maintain a clean separation between the technical storage structure and the user-friendly presentation in the UI, while still benefiting from the efficiency of the path_tokens array for database operations.

## Test Implementation Goal

We're implementing a basic "Manage Platform Logo" feature as a test case for Supabase Storage integration. This is not a production-level feature but a focused test to verify:

1. **Authentication & Permission Check**:
   - Verify we can use our Supabase authorize function
   - Check if the user has the custom claim to upload images

2. **Upload Process**:
   - If permission check passes, open the local file chooser
   - Upload the selected image to Supabase Storage

3. **Storage & Retrieval**:
   - Store in the platform bucket with path value of "logos"
   - Show confirmation of successful upload
   - Retrieve and display the image in the same view

## Implementation Plan

### 1. Assign Permissions to Platform Admin

- Assign all image and media permissions to the Platform Admin role
- This will allow platform admins to manage images and media files

### 2. Create API Endpoints

- Create endpoints under the `/api/v1` prefix to be consistent with all other API routes:
  - `/api/v1/platform/assets/images/upload` for uploading images to the platform bucket
  - `/api/v1/platform/assets/images/:id` for retrieving images from the platform bucket
  - `/api/v1/platform/assets/images/:id` (PUT) for updating image metadata (rename, permissions, etc.)
  - `/api/v1/platform/assets/images/:id` (DELETE) for soft-deleting images (not permanently removing them)
  - `/api/v1/platform/assets/images/:id/restore` for restoring soft-deleted images
- These endpoints should:
  - Verify user authentication via JWT
  - Check permissions using the authorize function
  - Handle file upload to Supabase Storage
  - Return appropriate responses with URLs or error messages

### 3. Implement UI Components

- Add a "Manage Platform Logo" button in the platform admin view
- Create a simple view with:
  - An upload button that opens the native file chooser
  - Support for standard image formats (PNG, JPEG, WebP, SVG)
  - A preview area to display the uploaded image
  - A download button that appears on hover
  - A description field for adding metadata
  - A delete button that soft-deletes the image

### 4. Testing

- Test the upload functionality with various image types
- Verify that permissions are properly enforced
- Ensure that uploaded images can be retrieved and displayed
- Test the soft delete and restore functionality
- Verify that deleted images are not visible to regular users

## Technical Details

### Storage Path Structure

- All platform logos will be stored in the platform bucket
- Path structure: `/logos/[filename]`
- This will be reflected in the UI as a breadcrumb

### Permission Checking

- We'll use the `authorize` function to check if the user has the `image.create` permission
- For platform admins, this will automatically pass due to the special handling in the function

### File Handling

- We'll support all standard image formats: PNG, JPEG, WebP, SVG
- Any file with an "image/*" MIME type will be accepted
- We'll use the Supabase Storage API for upload and retrieval

### Soft Delete Implementation

- When a file is "deleted", we'll set the `is_deleted` flag to `true` instead of removing it
- Regular users will not see deleted files in any listings or be able to access them directly
- Platform admins will be able to see deleted files and restore them if needed
- We'll provide a UI indicator for platform admins to show which files are deleted
- The API will use the `soft_delete_file` and `restore_deleted_file` functions

### API Structure

- All API endpoints will follow the standard pattern of `/api/v1/[endpoint]`
- The client-side API calls are already configured to use this prefix
- We'll create new routes and controllers specifically for platform logo management
- Unlike existing file endpoints, our new endpoints will use Supabase Storage directly without fallbacks to legacy storage

## API Implementation

The following API endpoints have been implemented for the basic upload test:

### Platform Assets API

- `/api/v1/platform/assets/images` (GET) - List all images
- `/api/v1/platform/assets/images/upload` (POST) - Upload a new image
- `/api/v1/platform/assets/images/:id` (GET) - Get a specific image
- `/api/v1/platform/assets/images/:id` (PUT) - Update image metadata (rename, permissions, etc.)
- `/api/v1/platform/assets/images/:id` (DELETE) - Soft delete an image
- `/api/v1/platform/assets/images/:id/restore` (POST) - Restore a soft-deleted image
- `/api/v1/platform/assets/images/deleted` (GET) - List deleted images (admin only)
- `/api/v1/platform/assets/images/:id/url` (GET) - Get the public URL for an image
- `/api/v1/platform/assets/images/:id/content` (GET) - Get the actual image content with appropriate headers

### Implementation Details

1. Created the assets controller in `/packages/server/src/controllers/assetsController.ts` with the following functions:
   - `listImages` - List all images with optional filtering
   - `getImage` - Get a specific image by ID
   - `uploadImage` - Upload a new image
   - `updateImage` - Update image metadata
   - `softDeleteImage` - Soft delete an image
   - `restoreImage` - Restore a soft-deleted image
   - `listDeletedImages` - List deleted images (admin only)
   - `getImageUrl` - Get the public URL for an image
   - `getImageContent` - Get the actual image content with appropriate headers

2. Created the file service in `/packages/server/src/services/file.ts` with the following functions:
   - `getFiles` - Get files based on filter options
   - `softDeleteFile` - Soft delete a file
   - `restoreFile` - Restore a soft-deleted file

3. Created authorization utilities in `/packages/server/src/utils/authorizationUtils.ts` with the following functions:
   - `hasPermission` - Check if a user has a specific permission
   - `hasResourcePermission` - Check if a user has permission for a specific resource
   - `isPlatformAdmin` - Determine if a user is a platform admin
   - `checkPermission` - Check permission considering platform admin status
   - `checkResourcePermission` - Check resource permission considering platform admin status

4. Created the assets routes in `/packages/server/src/routes/assetsRoutes.ts` and registered them in the main routes file.

5. Added proper error handling and permission checking to all endpoints.

6. Implemented soft delete functionality to prevent accidental data loss.

7. Added specialized endpoints for retrieving image URLs and content:
   - The URL endpoint returns JSON with the URL and metadata, useful for frontend integration
   - The content endpoint returns the actual image data with proper content-type headers, useful for direct embedding

### Next Steps

1. **Assign Permissions**:
   - Assign image and media permissions to the Platform Admin role ✅

2. **API Implementation**:
   - Create the upload endpoint at `/api/v1/platform/assets/images/upload` ✅
   - Create the retrieval endpoint at `/api/v1/platform/assets/images/:id` (GET) ✅
   - Create the update endpoint at `/api/v1/platform/assets/images/:id` (PUT) ✅
   - Create the soft delete endpoint at `/api/v1/platform/assets/images/:id` (DELETE) ✅
   - Create the restore endpoint at `/api/v1/platform/assets/images/:id/restore` (POST) ✅
   - Add proper error handling and validation ✅
   - Follow the [API Design Principles](./api_design_principles.md) for implementation ✅

3. **UI Implementation**:
   - Add the "Manage Platform Logo" button ✅
   - Create the upload and preview components ✅
   - Implement the download functionality ✅
   - Add description field and sharing options ✅
   - Implement soft delete and restore UI (for admins) ✅

4. **Testing**:
   - Test with various image types
   - Verify permission enforcement
   - Check error handling
   - Test soft delete and restore functionality

## Future Expansion

After this basic test is successful, we'll expand the implementation to:

1. **Path-Based Navigation**:
   - Implement URL paths that reflect storage paths
   - Add breadcrumb navigation in the UI
   - Support folder operations

2. **Full Asset Manager**:
   - More comprehensive UI for managing all types of assets
   - Folder structure and organization
   - Bulk operations
   - Advanced filtering, including options to view deleted files

3. **Multi-tenant Support**:
   - Organization-specific assets
   - Application-specific assets
   - User-specific assets

4. **Advanced Features**:
   - Image transformations (resize, crop, etc.)
   - Media streaming
   - File versioning

5. **Integration with Specialized Systems**:
   - Document stores
   - Vector stores
   - RAG systems
   - Metadata generation 