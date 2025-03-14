# Application Logo-related Routes

## Overview

This document details the routes and functionality related to application logos in the Remodl AI platform.

## Routes

### Get Application Logo URL

```
GET /api/v1/applications/:appId/assets/logo/url
```

**Description**: Retrieves the URL of an application's logo.

**Parameters**:
- `appId` (path parameter): The ID of the application

**Response**:
```json
{
  "url": {
    "logo_url": "https://data.remodl.ai/storage/v1/object/public/apps/application_name/assets/logos/logo-file.svg"
  }
}
```

### Upload Application Logo

```
POST /api/v1/applications/:appId/assets/logo/upload
```

**Description**: Uploads a logo for an application and updates the application's logo_url field.

**Parameters**:
- `appId` (path parameter): The ID of the application
- `file` (form data): The image file to upload (PNG or SVG only)

**Authentication**: Requires a valid API key with the `image.create` permission.

**Implementation Details**:
- The file is uploaded to Supabase Storage in the `apps` bucket
- The path follows the pattern: `{snake_case_app_name}/assets/logos/{filename}`
- The application's `logo_url` field is updated with the public URL of the uploaded file
- The system attempts to save file metadata to the `files` table if a valid user ID is present
- If no valid user ID is present or if the file metadata insertion fails, the logo URL is still updated

**Current Limitations**:
- When using API keys, file metadata cannot be saved to the `files` table due to foreign key constraints on the `created_by` field
- This will be addressed in the future with the implementation of service users for API keys

**Response (Success)**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "url": "https://data.remodl.ai/storage/v1/object/public/apps/application_name/assets/logos/logo-file.svg",
  "data": {
    // File metadata if available
  }
}
```

**Response (Success with Warning)**:
```json
{
  "success": true,
  "message": "File uploaded and logo updated, but metadata could not be saved",
  "url": "https://data.remodl.ai/storage/v1/object/public/apps/application_name/assets/logos/logo-file.svg",
  "warning": "Error message explaining why metadata couldn't be saved"
}
```

## Future Enhancements

1. **Service Users for API Keys**: Implement service users to allow file metadata to be saved when using API keys
2. **Organization Logo Support**: Implement similar functionality for organization logos
3. **Image Transformations**: Add support for image transformations (resizing, cropping, etc.)
4. **Additional File Formats**: Consider supporting additional file formats with automatic conversion to web-friendly formats
