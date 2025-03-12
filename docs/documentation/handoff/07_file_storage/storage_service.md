# Storage Service

This document provides information about the high-level storage service for the Supabase Storage integration in the Remodl AI platform.

## Overview

The storage service is defined in `/packages/server/src/services/storage/index.ts` and provides high-level functions for managing files in Supabase Storage. It combines core storage operations with file metadata management to provide a unified interface for file management.

## Core Functions

### Upload File

The `uploadFile` function uploads a file to Supabase Storage and creates file metadata:

```typescript
import { uploadFile, STORAGE_BUCKETS, FILE_CONTEXT_TYPES, FILE_RESOURCE_TYPES } from '../services/storage';

const result = await uploadFile(
  STORAGE_BUCKETS.USER_FILES,
  fileBuffer,
  {
    name: 'document.pdf',
    contentType: 'application/pdf',
    contextType: FILE_CONTEXT_TYPES.USER,
    contextId: 'user-123',
    resourceType: FILE_RESOURCE_TYPES.DOCUMENT,
    isPublic: false,
    metadata: {
      description: 'Important document',
      tags: ['important', 'document']
    },
    pathTokens: 'Documents/Important'
  },
  authContext
);

console.log(`File uploaded: ${result.file.id}`);
console.log(`File URL: ${result.url}`);
```

#### Options

The `UploadFileOptions` interface defines the options for uploading a file:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | The name of the file |
| `contentType` | string | The content type of the file |
| `contextType` | string | The type of context (user, organization, application, etc.) |
| `contextId` | string | The ID of the context |
| `resourceType` | string | The type of resource (document, image, etc.) |
| `resourceId` | string | (Optional) The ID of the resource |
| `isPublic` | boolean | (Optional) Whether the file is publicly accessible |
| `accessLevel` | string | (Optional) The access level of the file |
| `metadata` | object | (Optional) Custom metadata for the file |
| `pathTokens` | string | (Optional) Virtual path for organizing files in the UI |
| `upsert` | boolean | (Optional) Whether to upsert the file if it already exists |
| `cacheControl` | string | (Optional) Custom cache control header |
| `includeUuid` | boolean | (Optional) Whether to include a UUID in the filename |
| `folderName` | string | (Optional) Custom folder name to include in the path |

#### Result

The `UploadFileResult` interface defines the result of a file upload operation:

| Property | Type | Description |
|----------|------|-------------|
| `file` | FileMetadata | The file metadata |
| `url` | string | The URL of the file |

### Get File URL

The `getFileUrl` function gets a file URL (public or signed):

```typescript
import { getFileUrl, SIGNED_URL_EXPIRATION } from '../services/storage';

const url = await getFileUrl('file-123', {
  signed: true,
  expiresIn: SIGNED_URL_EXPIRATION.MEDIUM,
  download: true,
  transform: {
    width: 800,
    height: 600,
    quality: 80
  }
});

console.log(`File URL: ${url}`);
```

#### Options

The `GetFileUrlOptions` interface defines the options for getting a file URL:

| Option | Type | Description |
|--------|------|-------------|
| `signed` | boolean | (Optional) Whether to create a signed URL |
| `expiresIn` | number | (Optional) Expiration time in seconds for signed URLs |
| `download` | boolean \| string | (Optional) Download options for signed URLs |
| `transform` | object | (Optional) Transform options for images |

### Download File

The `downloadFile` function downloads a file from Supabase Storage:

```typescript
import { downloadFile } from '../services/storage';

const { data, file } = await downloadFile('file-123');

console.log(`Downloaded file: ${file.name}`);
console.log(`File size: ${data.size} bytes`);
```

#### Result

The `DownloadFileResult` interface defines the result of a file download operation:

| Property | Type | Description |
|----------|------|-------------|
| `data` | Blob | The file data |
| `file` | FileMetadata | The file metadata |

### Delete File

The `deleteFile` function deletes a file from Supabase Storage and its metadata:

```typescript
import { deleteFile } from '../services/storage';

const deleted = await deleteFile('file-123', authContext);

if (deleted) {
  console.log('File deleted');
} else {
  console.log('File not found');
}
```

### List Files

The `listFiles` function lists files based on various criteria:

```typescript
import { listFiles, FILE_CONTEXT_TYPES } from '../services/storage';

const { files, total } = await listFiles({
  limit: 10,
  offset: 0,
  sortBy: {
    column: 'created_at',
    order: 'desc'
  },
  filters: {
    context_type: FILE_CONTEXT_TYPES.USER,
    context_id: 'user-123',
    is_public: false
  }
});

console.log(`Found ${total} files`);
```

#### Result

The `ListFilesResult` interface defines the result of a file listing operation:

| Property | Type | Description |
|----------|------|-------------|
| `files` | FileMetadata[] | The files |
| `total` | number | The total number of files |

### Update File

The `updateFile` function updates a file's metadata:

```typescript
import { updateFile } from '../services/storage';

const updatedFile = await updateFile(
  'file-123',
  {
    name: 'updated-document.pdf',
    isPublic: true,
    metadata: {
      description: 'Updated description'
    },
    pathTokens: 'Documents/Public'
  },
  authContext
);

console.log(`File updated: ${updatedFile.name}`);
```

#### Options

The `UpdateFileOptions` interface defines the options for updating a file:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | (Optional) The new name of the file |
| `contentType` | string | (Optional) The new content type of the file |
| `isPublic` | boolean | (Optional) Whether the file is publicly accessible |
| `accessLevel` | string | (Optional) The new access level of the file |
| `metadata` | object | (Optional) Custom metadata to merge with existing metadata |
| `pathTokens` | string | (Optional) New virtual path for organizing files in the UI |

### Search Files

The `searchFiles` function searches for files based on a search term:

```typescript
import { searchFiles } from '../services/storage';

const { files, total } = await searchFiles('report', {
  limit: 10,
  filters: {
    context_type: 'user',
    context_id: 'user-123'
  }
});

console.log(`Found ${total} files matching 'report'`);
```

### Move File Virtual Path

The `moveFileVirtualPath` function moves a file to a new virtual path:

```typescript
import { moveFileVirtualPath } from '../services/storage';

const updatedFile = await moveFileVirtualPath(
  'file-123',
  'Documents/Important/2025',
  authContext
);

console.log(`File moved to: ${updatedFile.virtual_path}`);
```

### Copy File

The `copyFile` function copies a file to a new location:

```typescript
import { copyFile, FILE_CONTEXT_TYPES, FILE_RESOURCE_TYPES } from '../services/storage';

const result = await copyFile(
  'file-123',
  {
    name: 'copy-document.pdf',
    contentType: 'application/pdf',
    contextType: FILE_CONTEXT_TYPES.ORGANIZATION,
    contextId: 'org-456',
    resourceType: FILE_RESOURCE_TYPES.DOCUMENT,
    isPublic: true,
    pathTokens: 'Documents/Shared'
  },
  authContext
);

console.log(`File copied: ${result.file.id}`);
console.log(`File URL: ${result.url}`);
```

## Context-Specific Functions

### Upload User File

The `uploadUserFile` function uploads a file for a specific user:

```typescript
import { uploadUserFile, FILE_RESOURCE_TYPES } from '../services/storage';

const result = await uploadUserFile(
  'user-123',
  fileBuffer,
  {
    name: 'document.pdf',
    contentType: 'application/pdf',
    resourceType: FILE_RESOURCE_TYPES.DOCUMENT,
    isPublic: false,
    pathTokens: 'Documents/Important'
  },
  authContext
);

console.log(`User file uploaded: ${result.file.id}`);
```

### Upload Organization File

The `uploadOrganizationFile` function uploads a file for a specific organization:

```typescript
import { uploadOrganizationFile, FILE_RESOURCE_TYPES } from '../services/storage';

const result = await uploadOrganizationFile(
  'org-123',
  fileBuffer,
  {
    name: 'document.pdf',
    contentType: 'application/pdf',
    resourceType: FILE_RESOURCE_TYPES.DOCUMENT,
    isPublic: false,
    pathTokens: 'Documents/Important'
  },
  authContext
);

console.log(`Organization file uploaded: ${result.file.id}`);
```

### Upload Application File

The `uploadApplicationFile` function uploads a file for a specific application:

```typescript
import { uploadApplicationFile, FILE_RESOURCE_TYPES } from '../services/storage';

const result = await uploadApplicationFile(
  'app-123',
  fileBuffer,
  {
    name: 'document.pdf',
    contentType: 'application/pdf',
    resourceType: FILE_RESOURCE_TYPES.DOCUMENT,
    isPublic: false,
    pathTokens: 'Documents/Important'
  },
  authContext
);

console.log(`Application file uploaded: ${result.file.id}`);
```

### Upload Profile Picture

The `uploadProfilePicture` function uploads a profile picture for a specific user:

```typescript
import { uploadProfilePicture } from '../services/storage';

const result = await uploadProfilePicture(
  'user-123',
  imageBuffer,
  {
    name: 'profile.jpg',
    contentType: 'image/jpeg',
    isPublic: true
  },
  authContext
);

console.log(`Profile picture uploaded: ${result.file.id}`);
console.log(`Profile picture URL: ${result.url}`);
```

### Get User Files

The `getUserFiles` function gets files for a specific user:

```typescript
import { getUserFiles } from '../services/storage';

const { files, total } = await getUserFiles('user-123', {
  limit: 10,
  sortBy: {
    column: 'created_at',
    order: 'desc'
  }
});

console.log(`Found ${total} files for user-123`);
```

### Get Organization Files

The `getOrganizationFiles` function gets files for a specific organization:

```typescript
import { getOrganizationFiles } from '../services/storage';

const { files, total } = await getOrganizationFiles('org-123', {
  limit: 10,
  sortBy: {
    column: 'created_at',
    order: 'desc'
  }
});

console.log(`Found ${total} files for org-123`);
```

### Get Application Files

The `getApplicationFiles` function gets files for a specific application:

```typescript
import { getApplicationFiles } from '../services/storage';

const { files, total } = await getApplicationFiles('app-123', {
  limit: 10,
  sortBy: {
    column: 'created_at',
    order: 'desc'
  }
});

console.log(`Found ${total} files for app-123`);
```

## Constants

The storage service exports several constants for convenience:

```typescript
import { 
  STORAGE_BUCKETS,
  FILE_ACCESS_LEVELS,
  FILE_CONTEXT_TYPES,
  FILE_RESOURCE_TYPES,
  SIGNED_URL_EXPIRATION
} from '../services/storage';
```

## Error Handling

All storage service functions use the `StorageError` class for error handling. Each function catches errors and converts them to appropriate `StorageError` instances with meaningful error messages and details.

```typescript
import { uploadFile, STORAGE_BUCKETS } from '../services/storage';
import { StorageError, StorageErrorCode } from '../errors';

try {
  await uploadFile(/* ... */);
} catch (error) {
  if (error instanceof StorageError) {
    if (error.code === StorageErrorCode.UPLOAD_FAILED) {
      console.error('Failed to upload file:', error.message);
    }
  }
  throw error;
}
```

## Permission Checks

The storage service includes permission checks for operations that modify files:

- `deleteFile`: Checks if the user is the file owner or has access through the application or organization
- `updateFile`: Checks if the user is the file owner or has access through the application or organization
- `moveFileVirtualPath`: Checks if the user is the file owner or has access through the application or organization

## Integration with Express Routes

Here's an example of how to integrate the storage service with Express routes:

```typescript
import express from 'express';
import multer from 'multer';
import { 
  uploadUserFile, 
  FILE_RESOURCE_TYPES,
  getAuthContextFromRequest 
} from '../services/storage';

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
    
    // Upload file
    const result = await uploadUserFile(
      authContext.userId || 'anonymous',
      req.file.buffer,
      {
        name: req.file.originalname,
        contentType: req.file.mimetype,
        resourceType: FILE_RESOURCE_TYPES.DOCUMENT,
        isPublic: req.body.isPublic === 'true',
        metadata: {
          description: req.body.description,
          tags: req.body.tags ? req.body.tags.split(',') : []
        },
        pathTokens: req.body.pathTokens
      },
      authContext
    );
    
    // Return result
    res.json({
      success: true,
      file: result.file,
      url: result.url
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

## Best Practices

1. **Use context-specific functions**: Use the context-specific functions (`uploadUserFile`, `uploadOrganizationFile`, etc.) whenever possible to simplify your code.

2. **Include authentication context**: Pass the authentication context to storage service functions to ensure proper access control.

3. **Handle errors properly**: Catch and handle `StorageError` instances appropriately, providing meaningful error messages to users.

4. **Use virtual paths for organization**: Use virtual paths to organize files in a hierarchical structure for better user experience.

5. **Set appropriate access levels**: Use the appropriate access level for each file based on its purpose and intended audience.

6. **Use metadata for additional information**: Use metadata to store additional information about files, such as descriptions, tags, and other attributes.

7. **Clean up files when no longer needed**: Delete files that are no longer needed to avoid storage bloat.

8. **Use pagination for large result sets**: Use the `limit` and `offset` options when listing or searching files to avoid loading too many records at once.

9. **Use search for finding files**: Use the `searchFiles` function to find files based on their names or metadata.

10. **Use signed URLs for private files**: Use signed URLs with appropriate expiration times for private files that need temporary access. 