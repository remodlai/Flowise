# File Metadata Manager

This document provides information about the file metadata manager for the Supabase Storage integration in the Remodl AI platform.

## Overview

The file metadata manager is defined in `/packages/server/src/services/fileMetadata/index.ts` and provides functions for managing file metadata in the database. It handles creating, updating, retrieving, and deleting file metadata records, as well as searching and listing files based on various criteria.

## File Metadata Structure

The `FileMetadata` interface defines the structure of a file metadata record:

```typescript
interface FileMetadata {
  id: string
  created_at: string
  name: string
  content_type: string
  size: number
  url: string
  uuid: string
  bucket: string
  path: string
  context_type: string
  context_id: string
  resource_type: string
  resource_id?: string
  is_public: boolean
  access_level: string
  created_by: string
  updated_at?: string
  metadata?: Record<string, any>
  virtual_path?: string
}
```

## Core Functions

### Create File Metadata

The `createFileMetadata` function creates a new file metadata record in the database:

```typescript
import { createFileMetadata, FILE_CONTEXT_TYPES, FILE_RESOURCE_TYPES } from '../services/fileMetadata';
import { STORAGE_BUCKETS } from '../constants/storage';

const fileMetadata = await createFileMetadata(
  {
    name: 'document.pdf',
    content_type: 'application/pdf',
    size: 1024,
    bucket: STORAGE_BUCKETS.USER_FILES,
    path: 'user/123/documents/document.pdf',
    context_type: FILE_CONTEXT_TYPES.USER,
    context_id: 'user-123',
    resource_type: FILE_RESOURCE_TYPES.DOCUMENT,
    is_public: false,
    metadata: {
      description: 'Important document',
      tags: ['important', 'document']
    },
    virtual_path: 'Documents/Important'
  },
  authContext
);

console.log(`File metadata created with ID: ${fileMetadata.id}`);
```

#### Options

The `CreateFileMetadataOptions` interface defines the options for creating file metadata:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | The name of the file |
| `content_type` | string | The MIME type of the file |
| `size` | number | The size of the file in bytes |
| `bucket` | string | The storage bucket containing the file |
| `path` | string | The path of the file within the bucket |
| `context_type` | string | The type of context (user, organization, application, etc.) |
| `context_id` | string | The ID of the context |
| `resource_type` | string | The type of resource (document, image, etc.) |
| `resource_id` | string | (Optional) The ID of the resource |
| `is_public` | boolean | (Optional) Whether the file is publicly accessible |
| `access_level` | string | (Optional) The access level of the file |
| `metadata` | object | (Optional) Custom metadata for the file |
| `virtual_path` | string | (Optional) Virtual path for organizing files in the UI |

### Update File Metadata

The `updateFileMetadata` function updates an existing file metadata record:

```typescript
import { updateFileMetadata } from '../services/fileMetadata';

const updatedFileMetadata = await updateFileMetadata(
  'file-123',
  {
    name: 'updated-document.pdf',
    is_public: true,
    metadata: {
      description: 'Updated description'
    },
    virtual_path: 'Documents/Public'
  },
  authContext
);

console.log(`File metadata updated: ${updatedFileMetadata.name}`);
```

#### Options

The `UpdateFileMetadataOptions` interface defines the options for updating file metadata:

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | (Optional) The new name of the file |
| `content_type` | string | (Optional) The new MIME type of the file |
| `size` | number | (Optional) The new size of the file in bytes |
| `is_public` | boolean | (Optional) Whether the file is publicly accessible |
| `access_level` | string | (Optional) The new access level of the file |
| `metadata` | object | (Optional) Custom metadata to merge with existing metadata |
| `virtual_path` | string | (Optional) New virtual path for organizing files in the UI |

### Get File Metadata by ID

The `getFileMetadataById` function retrieves a file metadata record by ID:

```typescript
import { getFileMetadataById } from '../services/fileMetadata';

const fileMetadata = await getFileMetadataById('file-123');

if (fileMetadata) {
  console.log(`Found file: ${fileMetadata.name}`);
} else {
  console.log('File not found');
}
```

### Get File Metadata by Path

The `getFileMetadataByPath` function retrieves a file metadata record by path and bucket:

```typescript
import { getFileMetadataByPath, STORAGE_BUCKETS } from '../services/fileMetadata';

const fileMetadata = await getFileMetadataByPath(
  STORAGE_BUCKETS.USER_FILES,
  'user/123/documents/document.pdf'
);

if (fileMetadata) {
  console.log(`Found file: ${fileMetadata.name}`);
} else {
  console.log('File not found');
}
```

### Delete File Metadata

The `deleteFileMetadata` function deletes a file metadata record:

```typescript
import { deleteFileMetadata } from '../services/fileMetadata';

const deleted = await deleteFileMetadata('file-123');

if (deleted) {
  console.log('File metadata deleted');
} else {
  console.log('File not found');
}
```

### List File Metadata

The `listFileMetadata` function lists file metadata records based on various criteria:

```typescript
import { listFileMetadata, FILE_CONTEXT_TYPES } from '../services/fileMetadata';

const files = await listFileMetadata({
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

console.log(`Found ${files.length} files`);
```

#### Options

The `ListFileMetadataOptions` interface defines the options for listing file metadata:

| Option | Type | Description |
|--------|------|-------------|
| `limit` | number | (Optional) Maximum number of records to return |
| `offset` | number | (Optional) Offset for pagination |
| `sortBy` | object | (Optional) Sort order |
| `filters` | object | (Optional) Filters to apply |

#### Filters

The `filters` object supports the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `context_type` | string | Filter by context type |
| `context_id` | string | Filter by context ID |
| `resource_type` | string | Filter by resource type |
| `resource_id` | string | Filter by resource ID |
| `is_public` | boolean | Filter by public status |
| `access_level` | string | Filter by access level |
| `created_by` | string | Filter by creator |
| `virtual_path` | string | Filter by virtual path |
| `name` | string | Filter by name (partial match) |
| `content_type` | string | Filter by content type |

### Search File Metadata

The `searchFileMetadata` function searches for file metadata records based on a search term:

```typescript
import { searchFileMetadata } from '../services/fileMetadata';

const files = await searchFileMetadata('report', {
  limit: 10,
  filters: {
    context_type: 'user',
    context_id: 'user-123'
  }
});

console.log(`Found ${files.length} files matching 'report'`);
```

### Update File Virtual Path

The `updateFileVirtualPath` function updates the virtual path of a file:

```typescript
import { updateFileVirtualPath } from '../services/fileMetadata';

const updatedFileMetadata = await updateFileVirtualPath(
  'file-123',
  'Documents/Important/2025',
  authContext
);

console.log(`File virtual path updated: ${updatedFileMetadata.virtual_path}`);
```

### Get Files by Context

The `getFilesByContext` function gets files for a specific context:

```typescript
import { getFilesByContext, FILE_CONTEXT_TYPES } from '../services/fileMetadata';

const files = await getFilesByContext(
  FILE_CONTEXT_TYPES.USER,
  'user-123',
  {
    limit: 10,
    sortBy: {
      column: 'created_at',
      order: 'desc'
    }
  }
);

console.log(`Found ${files.length} files for user-123`);
```

### Get Files by Resource

The `getFilesByResource` function gets files for a specific resource:

```typescript
import { getFilesByResource, FILE_RESOURCE_TYPES } from '../services/fileMetadata';

const files = await getFilesByResource(
  FILE_RESOURCE_TYPES.DOCUMENT,
  'document-123',
  {
    limit: 10,
    sortBy: {
      column: 'created_at',
      order: 'desc'
    }
  }
);

console.log(`Found ${files.length} files for document-123`);
```

### Get Files by Virtual Path

The `getFilesByVirtualPath` function gets files for a specific virtual path:

```typescript
import { getFilesByVirtualPath } from '../services/fileMetadata';

const files = await getFilesByVirtualPath(
  'Documents/Important',
  {
    limit: 10,
    sortBy: {
      column: 'name',
      order: 'asc'
    }
  }
);

console.log(`Found ${files.length} files in Documents/Important`);
```

## Integration with Storage Operations

The file metadata manager works closely with the storage operations to provide a complete file management solution. Here's an example of how to use them together:

```typescript
import { uploadFile, STORAGE_BUCKETS } from '../utils/storageOperations';
import { createFileMetadata, FILE_CONTEXT_TYPES, FILE_RESOURCE_TYPES } from '../services/fileMetadata';
import { generateUserStoragePath } from '../utils/storagePath';

// Upload a file
const filePath = generateUserStoragePath(
  'user-123',
  FILE_RESOURCE_TYPES.DOCUMENT,
  { originalFilename: 'document.pdf' }
);

const uploadResult = await uploadFile(
  STORAGE_BUCKETS.USER_FILES,
  filePath,
  fileBuffer,
  {
    contentType: 'application/pdf',
    metadata: {
      originalName: 'document.pdf'
    }
  },
  authContext
);

// Create file metadata
const fileMetadata = await createFileMetadata(
  {
    name: 'document.pdf',
    content_type: 'application/pdf',
    size: fileBuffer.length,
    bucket: STORAGE_BUCKETS.USER_FILES,
    path: uploadResult.path,
    context_type: FILE_CONTEXT_TYPES.USER,
    context_id: 'user-123',
    resource_type: FILE_RESOURCE_TYPES.DOCUMENT,
    is_public: false,
    metadata: {
      description: 'Important document',
      tags: ['important', 'document']
    },
    virtual_path: 'Documents/Important'
  },
  authContext
);

console.log(`File uploaded and metadata created: ${fileMetadata.id}`);
```

## Error Handling

All file metadata functions use the `StorageError` class for error handling. Each function catches errors and converts them to appropriate `StorageError` instances with meaningful error messages and details.

```typescript
import { createFileMetadata } from '../services/fileMetadata';
import { StorageError, StorageErrorCode } from '../errors';

try {
  await createFileMetadata(/* ... */);
} catch (error) {
  if (error instanceof StorageError) {
    if (error.code === StorageErrorCode.FILE_ALREADY_EXISTS) {
      console.error('File already exists:', error.message);
    }
  }
  throw error;
}
```

## Best Practices

1. **Always include authentication context**: Pass the authentication context to file metadata functions whenever possible to ensure proper access control.

2. **Use consistent context and resource types**: Use the constants from `FILE_CONTEXT_TYPES` and `FILE_RESOURCE_TYPES` to ensure consistency.

3. **Include meaningful metadata**: Use the metadata field to store additional information about files, such as descriptions, tags, and other attributes.

4. **Use virtual paths for organization**: Use virtual paths to organize files in a hierarchical structure for better user experience.

5. **Handle errors properly**: Catch and handle `StorageError` instances appropriately, providing meaningful error messages to users.

6. **Clean up metadata when deleting files**: When deleting files from storage, also delete the corresponding metadata records.

7. **Use pagination for large result sets**: Use the `limit` and `offset` options when listing or searching files to avoid loading too many records at once.

8. **Use filters to narrow down results**: Use the filters option to narrow down results when listing or searching files.

9. **Update metadata when updating files**: When updating files in storage, also update the corresponding metadata records.

10. **Use transactions for related operations**: When performing related operations (e.g., uploading a file and creating metadata), use transactions to ensure consistency. 