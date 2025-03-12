# Logo Manager Component

## Overview

The Logo Manager component is a basic test implementation for Supabase Storage integration in the Remodl AI platform. It allows platform administrators to upload, view, manage, and delete platform logos. This component serves as a proof of concept for the broader file storage migration from legacy systems (local filesystem and AWS S3) to Supabase Storage.

## Component Structure

The Logo Manager is implemented as a standalone React component with the following features:

1. **Upload Section**:
   - File input with support for image formats (PNG, JPEG, WebP, SVG)
   - Description field for adding metadata
   - Size validation (max 5MB)
   - Type validation (image/* MIME types only)
   - Progress indicator during upload

2. **Logo Display Section**:
   - Grid layout of uploaded logos
   - Image preview with metadata (name, description, upload date)
   - Download button
   - Delete button (soft delete)
   - Restore button for deleted logos
   - Visual indicator for deleted logos

3. **Error Handling**:
   - Validation errors for file type and size
   - API error handling with user-friendly messages
   - Loading states for initial fetch and upload operations

## Integration with Supabase Storage

The component integrates with Supabase Storage through the following API endpoints:

1. **List Images**: `GET /api/v1/platform/assets/images`
   - Retrieves all platform logos, including deleted ones for admins
   - Filters by context type ('platform') and path ('logos/')

2. **Upload Image**: `POST /api/v1/platform/assets/images/upload`
   - Uploads a new logo to Supabase Storage
   - Stores metadata in the database
   - Sets appropriate permissions and context

3. **Delete Image**: `DELETE /api/v1/platform/assets/images/:id`
   - Soft deletes a logo (sets `is_deleted = true`)
   - Does not remove the file from storage

4. **Restore Image**: `POST /api/v1/platform/assets/images/:id/restore`
   - Restores a soft-deleted logo (sets `is_deleted = false`)

5. **Get Image Content**: `GET /api/v1/platform/assets/images/:id/content`
   - Retrieves the actual image content with appropriate headers
   - Used for displaying and downloading logos

## Implementation Details

### API Client

The component uses the following API client functions from `platform.js`:

```javascript
// List all platform images
listPlatformImages(options)

// Upload a platform image
uploadPlatformImage(formData)

// Soft delete a platform image
deletePlatformImage(id)

// Restore a soft-deleted platform image
restorePlatformImage(id)

// Get the direct content URL for a platform image
getPlatformImageContentUrl(id)
```

### File Upload Process

1. User selects an image file through the file input
2. Client-side validation checks file type and size
3. FormData is created with file and metadata:
   - `file`: The image file
   - `contextType`: 'platform'
   - `description`: User-provided description or default
   - `isPublic`: 'true'
   - `isShareable`: 'true'
   - `virtualPath`: 'logos'
4. The file is uploaded to the server via `uploadPlatformImage`
5. The server:
   - Validates the file and user permissions
   - Uploads the file to Supabase Storage
   - Creates a record in the `files` table
   - Returns the file metadata
6. The UI updates to show the new logo

### Soft Delete and Restore

The component implements soft delete functionality:

1. When a logo is deleted, it's not removed from storage but marked as deleted in the database
2. Deleted logos are visually indicated with reduced opacity and a "DELETED" overlay
3. Regular users cannot see deleted logos
4. Platform admins can see and restore deleted logos
5. Restoration simply updates the `is_deleted` flag back to `false`

## Routing and Navigation

The Logo Manager is accessible through the following route:

```
/admin/platform-logo
```

It can be accessed from the Platform Settings page via the "Manage Platform Logo" button. The component includes a back button that navigates back to the Platform Settings page.

## Permission Handling

The component relies on the backend's permission checking:

1. All API endpoints require the user to be authenticated
2. The `image.read` permission is required to view logos
3. The `image.create` permission is required to upload logos
4. The `image.delete` permission is required to delete logos
5. The `image.update` permission is required to restore logos
6. Platform admins automatically have all these permissions

## Future Enhancements

This is a basic test implementation with several planned enhancements:

1. **Multiple Logo Types**:
   - Support for different logo sizes and formats
   - Specific logos for different UI locations (header, footer, login page)

2. **Image Manipulation**:
   - Cropping and resizing capabilities
   - Automatic generation of different sizes

3. **Better Organization**:
   - Folder structure for different logo types
   - Tagging and categorization

4. **Advanced Features**:
   - Version history
   - Bulk operations
   - Preview in different contexts

## Testing

To test the Logo Manager:

1. Log in as a platform admin
2. Navigate to Platform Settings
3. Click the "Manage Platform Logo" button
4. Upload a test image
5. Verify that the image appears in the list
6. Test the download functionality
7. Test the delete functionality
8. Test the restore functionality
9. Verify that the image can be accessed via its content URL

## Conclusion

The Logo Manager component serves as a proof of concept for Supabase Storage integration. It demonstrates the core functionality of file upload, retrieval, and management with proper permission checking and soft delete capabilities. This implementation will inform the broader migration of all file storage operations to Supabase Storage. 