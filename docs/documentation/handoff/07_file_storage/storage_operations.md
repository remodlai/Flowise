# Storage Operations

This document provides information about the core storage operations for the Supabase Storage integration in the Remodl AI platform.

## Overview

The storage operations are defined in `/packages/server/src/utils/storageOperations.ts` and provide functions for interacting with Supabase Storage. These operations handle file uploads, downloads, listing, and deletion, with proper authentication handling for both direct user authentication and application API keys.

## Authentication Context

The storage operations support both direct user authentication and application API key authentication. The `StorageAuthContext` interface defines the authentication context:

```typescript
interface StorageAuthContext {
  /** User ID if authenticated */
  userId?: string
  /** Application ID */
  appId: string
  /** Organization ID */
  orgId: string
  /** API key if using API authentication */
  apiKey?: string
}
```

### Extracting Authentication Context from Request

The `getAuthContextFromRequest` function extracts the authentication context from an Express request:

```typescript
import { getAuthContextFromRequest } from '../utils/storageOperations';

// In an Express route handler
app.post('/api/files', (req, res) => {
  const authContext = getAuthContextFromRequest(req);
  
  // Use authContext in storage operations
  // ...
});
```

This function extracts:
- Application ID from body, query, or `x-application-id` header
- Organization ID from body, query, or `x-organization-id` header
- User ID from body, query, or authenticated user
- API key from `x-api-key` header

## Core Operations

### Upload File

The `uploadFile` function uploads a file to Supabase Storage:

```typescript
import { uploadFile, STORAGE_BUCKETS } from '../utils/storageOperations';

const result = await uploadFile(
  STORAGE_BUCKETS.USER_FILES,
  'user/123/images/profile.jpg',
  fileBuffer,
  {
    contentType: 'image/jpeg',
    upsert: true,
    metadata: { description: 'Profile picture' }
  },
  authContext
);

console.log(`File uploaded to: ${result.path}`);
```

#### Options

The `UploadFileOptions` interface defines the options for uploading a file:

| Option | Type | Description |
|--------|------|-------------|
| `contentType` | string | MIME type of the file |
| `upsert` | boolean | Whether to overwrite the file if it already exists |
| `cacheControl` | string | Cache control header for the file |
| `metadata` | object | Custom metadata for the file |

### Get Public URL

The `getPublicUrl` function gets a public URL for a file:

```typescript
import { getPublicUrl, STORAGE_BUCKETS } from '../utils/storageOperations';

const url = getPublicUrl(
  STORAGE_BUCKETS.PUBLIC,
  'images/logo.png'
);

console.log(`Public URL: ${url}`);
```

### Create Signed URL

The `createSignedUrl` function creates a signed URL for temporary access to a file:

```typescript
import { createSignedUrl, STORAGE_BUCKETS, SIGNED_URL_EXPIRATION } from '../utils/storageOperations';

const url = await createSignedUrl(
  STORAGE_BUCKETS.USER_FILES,
  'user/123/documents/report.pdf',
  {
    expiresIn: SIGNED_URL_EXPIRATION.MEDIUM,
    download: true,
    transform: {
      width: 800,
      height: 600,
      quality: 80
    }
  }
);

console.log(`Signed URL: ${url}`);
```

#### Options

The `SignedUrlOptions` interface defines the options for creating a signed URL:

| Option | Type | Description |
|--------|------|-------------|
| `expiresIn` | number | Expiration time in seconds |
| `download` | boolean \| string | Whether to force download and optional filename |
| `transform` | object | Image transformation options |

### Download File

The `downloadFile` function downloads a file from Supabase Storage:

```typescript
import { downloadFile, STORAGE_BUCKETS } from '../utils/storageOperations';

const fileData = await downloadFile(
  STORAGE_BUCKETS.USER_FILES,
  'user/123/documents/report.pdf'
);

// Use fileData (Blob)
```

### List Files

The `listFiles` function lists files in a bucket or folder:

```typescript
import { listFiles, STORAGE_BUCKETS } from '../utils/storageOperations';

const files = await listFiles(
  STORAGE_BUCKETS.USER_FILES,
  'user/123/documents',
  {
    limit: 10,
    offset: 0,
    sortBy: {
      column: 'created_at',
      order: 'desc'
    },
    search: 'report'
  }
);

console.log(`Found ${files.length} files`);
```

#### Options

The `ListFilesOptions` interface defines the options for listing files:

| Option | Type | Description |
|--------|------|-------------|
| `limit` | number | Maximum number of files to return |
| `offset` | number | Offset for pagination |
| `sortBy` | object | Sort order |
| `search` | string | Search query |

### Delete Files

The `deleteFiles` function deletes files from Supabase Storage:

```typescript
import { deleteFiles, STORAGE_BUCKETS } from '../utils/storageOperations';

const deletedFiles = await deleteFiles(
  STORAGE_BUCKETS.USER_FILES,
  [
    'user/123/documents/report1.pdf',
    'user/123/documents/report2.pdf'
  ]
);

console.log(`Deleted ${deletedFiles.length} files`);
```

### Copy File

The `copyFile` function copies a file within Supabase Storage:

```typescript
import { copyFile, STORAGE_BUCKETS } from '../utils/storageOperations';

const result = await copyFile(
  STORAGE_BUCKETS.USER_FILES,
  'user/123/documents/report.pdf',
  STORAGE_BUCKETS.ORGANIZATION,
  'organization/456/documents/report.pdf'
);

console.log(`File copied to: ${result.path}`);
```

### Move File

The `moveFile` function moves a file within Supabase Storage:

```typescript
import { moveFile, STORAGE_BUCKETS } from '../utils/storageOperations';

const result = await moveFile(
  STORAGE_BUCKETS.USER_FILES,
  'user/123/documents/report.pdf',
  STORAGE_BUCKETS.ORGANIZATION,
  'organization/456/documents/report.pdf'
);

console.log(`File moved to: ${result.path}`);
```

## Error Handling

All storage operations use the `StorageError` class for error handling. Each function catches errors and converts them to appropriate `StorageError` instances with meaningful error messages and details.

```typescript
import { uploadFile, STORAGE_BUCKETS } from '../utils/storageOperations';
import { StorageError, StorageErrorCode } from '../errors';

try {
  await uploadFile(STORAGE_BUCKETS.USER_FILES, 'user/123/images/profile.jpg', fileBuffer);
} catch (error) {
  if (error instanceof StorageError) {
    if (error.code === StorageErrorCode.UPLOAD_FAILED) {
      console.error('Failed to upload file:', error.message);
    }
  }
  throw error;
}
```

## Integration with Express Routes

Here's an example of how to integrate storage operations with Express routes:

```typescript
import express from 'express';
import multer from 'multer';
import { 
  uploadFile, 
  getAuthContextFromRequest, 
  STORAGE_BUCKETS 
} from '../utils/storageOperations';
import { generateUserStoragePath, FILE_RESOURCE_TYPES } from '../utils/storagePath';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload a file
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    // Get authentication context
    const authContext = getAuthContextFromRequest(req);
    
    // Validate required fields
    if (!authContext.appId || !authContext.orgId) {
      return res.status(400).json({ error: 'Application ID and Organization ID are required' });
    }
    
    // Generate storage path
    const filePath = generateUserStoragePath(
      authContext.userId || 'anonymous',
      FILE_RESOURCE_TYPES.DOCUMENT,
      { originalFilename: req.file.originalname }
    );
    
    // Upload file
    const result = await uploadFile(
      STORAGE_BUCKETS.USER_FILES,
      filePath,
      req.file.buffer,
      {
        contentType: req.file.mimetype,
        upsert: true,
        metadata: {
          originalName: req.file.originalname,
          size: req.file.size.toString()
        }
      },
      authContext
    );
    
    // Return result
    res.json({
      success: true,
      path: result.path
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

## Best Practices

1. **Always include authentication context**: Pass the authentication context to storage operations whenever possible to ensure proper access control.

2. **Use appropriate buckets**: Use the appropriate bucket for each type of file based on its purpose and access requirements.

3. **Generate consistent paths**: Use the path generation utilities to generate consistent and organized storage paths.

4. **Handle errors properly**: Catch and handle `StorageError` instances appropriately, providing meaningful error messages to users.

5. **Validate inputs**: Validate all inputs before passing them to storage operations, especially user-provided inputs.

6. **Use signed URLs for private files**: Use signed URLs with appropriate expiration times for private files that need temporary access.

7. **Clean up unused files**: Delete files that are no longer needed to avoid storage bloat.

8. **Set appropriate cache control**: Set appropriate cache control headers for files based on their usage patterns.

9. **Use metadata for additional information**: Use metadata to store additional information about files, such as original filenames, sizes, and descriptions.

10. **Batch operations when possible**: Use batch operations like `deleteFiles` for multiple files to reduce API calls. 