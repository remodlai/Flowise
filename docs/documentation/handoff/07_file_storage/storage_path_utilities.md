# Storage Path Utilities and File Operations

## Overview

This document describes the utilities and functions available for managing file paths and performing file operations in the Supabase Storage integration. It covers path tokens, virtual paths, and operations like moving and copying files.

## Path Tokens

Path tokens are arrays of string segments that represent the hierarchical structure of a file's path. They are used for efficient path-based operations and align with Supabase Storage's internal structure.

### Benefits of Path Tokens

1. **Efficient Querying**: Path tokens allow for more efficient filtering and querying operations
   ```sql
   -- Find all files in the "logos" folder
   SELECT * FROM files WHERE path_tokens[1] = 'logos';
   
   -- Find files in a nested folder structure
   SELECT * FROM files WHERE path_tokens @> ARRAY['documents', 'reports'];
   ```

2. **Hierarchical Navigation**: Path tokens make it easier to implement breadcrumb-style navigation
   ```typescript
   // Generate breadcrumb components from path tokens
   const breadcrumbs = pathTokens.map((token, index) => ({
     label: token,
     path: pathTokens.slice(0, index + 1)
   }));
   ```

3. **Path Manipulation**: Path tokens simplify operations like getting parent folders
   ```typescript
   // Get parent folder tokens (remove the last token)
   const parentTokens = pathTokens.slice(0, -1);
   ```

### Path Token Utility Functions

The following utility functions are available for working with path tokens:

```typescript
// Convert a path string to path tokens array
const pathToTokens = (path: string): string[] => {
  if (!path) return [];
  return path.split('/').filter(Boolean);
};

// Convert path tokens array to path string
const tokensToPath = (tokens: string[]): string => {
  if (!tokens || !tokens.length) return '';
  return tokens.join('/');
};

// Get parent path tokens (remove the last token)
const getParentTokens = (tokens: string[]): string[] => {
  if (!tokens || tokens.length <= 1) return [];
  return tokens.slice(0, -1);
};
```

## Virtual Paths (Deprecated)

Virtual paths are string representations of file paths using a separator (typically '/'). They have been deprecated in favor of path tokens but are still supported for backward compatibility.

## File Operations

### Moving Files

The storage service provides several functions for moving files:

#### 1. Move File Path Tokens

Moves a file to a new location by updating its path tokens in the database.

```typescript
const updatedFile = await moveFilePathTokens(
  fileId,
  ['logos', 'company', 'new_folder'],
  authContext
);
```

**Parameters:**
- `fileId`: The ID of the file to move
- `pathTokens`: The new path tokens array
- `authContext`: Authentication context

**Returns:** The updated file metadata

#### 2. Move File Virtual Path (Deprecated)

Moves a file to a new location by updating its virtual path in the database.

```typescript
const updatedFile = await moveFileVirtualPath(
  fileId,
  'logos/company/new_folder',
  authContext
);
```

**Parameters:**
- `fileId`: The ID of the file to move
- `pathTokens`: The new virtual path string
- `authContext`: Authentication context

**Returns:** The updated file metadata

#### 3. Move File Storage

Physically moves a file in Supabase Storage and updates the file metadata accordingly.

```typescript
const updatedFile = await moveFileStorage(
  fileId,
  'new/path/to/file.jpg',
  authContext,
  'destination-bucket' // Optional, defaults to same bucket
);
```

**Parameters:**
- `fileId`: The ID of the file to move
- `targetPath`: The new path within the bucket
- `authContext`: Authentication context
- `destinationBucket`: Optional destination bucket (defaults to same bucket)

**Returns:** The updated file metadata

### Copying Files

The storage service provides functions for copying files within the same bucket or across different buckets:

#### 1. Copy File Within Bucket

Copies a file within the same bucket and creates new file metadata.

```typescript
const copyResult = await copyFileWithinBucket(
  fileId,
  'new/path/to/file-copy.jpg',
  {
    name: 'file-copy.jpg',
    pathTokens: ['new', 'path', 'to', 'file-copy.jpg'],
    isPublic: true,
    metadata: { description: 'This is a copy' }
  },
  authContext
);
```

**Parameters:**
- `fileId`: The ID of the file to copy
- `targetPath`: The destination path within the bucket
- `options`: Additional options for the copy
  - `name`: The name of the new file
  - `pathTokens`: The virtual path for the new file
  - `pathTokens`: The path tokens for the new file
  - `isPublic`: Whether the new file is publicly accessible
  - `accessLevel`: The access level of the new file
  - `metadata`: Custom metadata for the new file
- `authContext`: Authentication context

**Returns:** The new file metadata and URL

#### 2. Copy File Across Buckets

Copies a file to a different bucket and creates new file metadata.

```typescript
const copyResult = await copyFileAcrossBuckets(
  fileId,
  'destination-bucket',
  'path/to/file-copy.jpg',
  {
    name: 'file-copy.jpg',
    pathTokens: ['path', 'to', 'file-copy.jpg'],
    isPublic: true,
    contextType: 'organization',
    contextId: 'org-123',
    metadata: { description: 'This is a copy in another bucket' }
  },
  authContext
);
```

**Parameters:**
- `fileId`: The ID of the file to copy
- `destinationBucket`: The destination bucket
- `targetPath`: The destination path within the bucket
- `options`: Additional options for the copy
  - `name`: The name of the new file
  - `pathTokens`: The virtual path for the new file
  - `pathTokens`: The path tokens for the new file
  - `isPublic`: Whether the new file is publicly accessible
  - `accessLevel`: The access level of the new file
  - `metadata`: Custom metadata for the new file
  - `contextType`: The context type for the new file
  - `contextId`: The context ID for the new file
  - `resourceType`: The resource type for the new file
  - `resourceId`: The resource ID for the new file
- `authContext`: Authentication context

**Returns:** The new file metadata and URL

## Implementation Details

### File Metadata Updates

When files are moved or copied, the file metadata is updated to reflect the changes:

1. **Moving Files**:
   - The `path` field is updated to the new path
   - The `bucket` field is updated if the destination bucket is different
   - The `url` field is updated to reflect the new location
   - The `updated_at` field is set to the current timestamp

2. **Copying Files**:
   - A new file metadata record is created with a new ID
   - The `metadata` field includes a reference to the original file ID
   - For cross-bucket copies, the original bucket is also recorded

### Permissions

All file operations check if the user has permission to perform the operation:

```typescript
// Check if user has permission to move/copy the file
if (fileMetadata.created_by !== authContext.userId && 
    fileMetadata.context_id !== authContext.appId && 
    fileMetadata.context_id !== authContext.orgId) {
  throw createPermissionDeniedError(fileId, authContext.userId || 'anonymous')
}
```

### Error Handling

All file operations include proper error handling:

1. **StorageError**: If a specific storage error occurs, it is thrown directly
2. **Other Errors**: Other errors are converted to StorageError with a descriptive message

## Best Practices

1. **Use Path Tokens**: Prefer using path tokens over virtual paths for better performance and compatibility with Supabase Storage

2. **Update Metadata**: Always update the file metadata after moving or copying files to maintain consistency

3. **Check Permissions**: Always check if the user has permission to perform the operation

4. **Handle Errors**: Implement proper error handling to provide meaningful feedback to users

5. **Use Native Functions**: Use the native Supabase Storage functions for moving and copying files when possible

## Examples

### Example 1: Moving a Logo to a New Folder

```typescript
// Move a logo to a new folder
try {
  const updatedFile = await moveFilePathTokens(
    logoFileId,
    ['logos', 'brand', 'primary'],
    authContext
  );
  console.log(`Logo moved successfully to ${updatedFile.path}`);
} catch (error) {
  console.error('Failed to move logo:', error.message);
}
```

### Example 2: Creating a Copy of a Template

```typescript
// Create a copy of a template in the same bucket
try {
  const { file, url } = await copyFileWithinBucket(
    templateFileId,
    'templates/custom/template-copy.docx',
    {
      name: 'My Custom Template',
      pathTokens: ['templates', 'custom', 'template-copy.docx'],
      metadata: { 
        description: 'Custom version of the standard template',
        version: '1.0',
        customized: true
      }
    },
    authContext
  );
  console.log(`Template copied successfully to ${file.path}`);
  console.log(`Access URL: ${url}`);
} catch (error) {
  console.error('Failed to copy template:', error.message);
}
```

### Example 3: Moving a File to Another Bucket

```typescript
// Move a file from a temporary bucket to a permanent bucket
try {
  const updatedFile = await moveFileStorage(
    tempFileId,
    'documents/final/report.pdf',
    authContext,
    'permanent-storage'
  );
  console.log(`File moved successfully to ${updatedFile.bucket}/${updatedFile.path}`);
} catch (error) {
  console.error('Failed to move file to permanent storage:', error.message);
}
```

## API Routes for File Operations

The following API routes are available for moving and copying files:

### Move Operations

#### 1. Move File in Storage

Physically moves a file in Supabase Storage and updates the file metadata.

```
POST /api/storage/move
```

**Request Body:**
```json
{
  "fileId": "123",
  "targetPath": "new/path/to/file.jpg",
  "destinationBucket": "destination-bucket", // Optional
  "updatePathTokens": true // Optional, defaults to true
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "123",
    "name": "file.jpg",
    "path": "new/path/to/file.jpg",
    "bucket": "destination-bucket",
    // Other file metadata
  }
}
```

#### 2. Move File Path Tokens

Updates a file's path tokens in the database without moving the actual file.

```
POST /api/storage/move-path-tokens
```

**Request Body:**
```json
{
  "fileId": "123",
  "pathTokens": ["new", "path", "to", "file.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "123",
    "name": "file.jpg",
    "path_tokens": ["new", "path", "to", "file.jpg"],
    // Other file metadata
  }
}
```

#### 3. Move File Virtual Path (Deprecated)

Updates a file's virtual path in the database.

```
PATCH /api/storage/file/:fileId/move
```

**Request Body:**
```json
{
  "pathTokens": "new/path/to/file.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "123",
    "name": "file.jpg",
    "path_tokens": "new/path/to/file.jpg",
    // Other file metadata
  }
}
```

### Copy Operations

#### 1. Copy File Within Bucket

Copies a file within the same bucket.

```
POST /api/storage/copy-within-bucket
```

**Request Body:**
```json
{
  "fileId": "123",
  "targetPath": "new/path/to/file-copy.jpg",
  "name": "file-copy.jpg", // Optional
  "pathTokens": ["new", "path", "to", "file-copy.jpg"], // Optional
  "pathTokens": "new/path/to/file-copy.jpg", // Optional
  "isPublic": true, // Optional
  "accessLevel": "public", // Optional
  "metadata": { "description": "This is a copy" } // Optional
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "456",
    "name": "file-copy.jpg",
    "path": "new/path/to/file-copy.jpg",
    // Other file metadata
  },
  "url": "https://example.com/storage/bucket/new/path/to/file-copy.jpg"
}
```

#### 2. Copy File Across Buckets

Copies a file to a different bucket.

```
POST /api/storage/copy-across-buckets
```

**Request Body:**
```json
{
  "fileId": "123",
  "destinationBucket": "destination-bucket",
  "targetPath": "path/to/file-copy.jpg",
  "name": "file-copy.jpg", // Optional
  "pathTokens": ["path", "to", "file-copy.jpg"], // Optional
  "pathTokens": "path/to/file-copy.jpg", // Optional
  "isPublic": true, // Optional
  "accessLevel": "public", // Optional
  "metadata": { "description": "This is a copy" }, // Optional
  "contextType": "organization", // Optional
  "contextId": "org-123", // Optional
  "resourceType": "image", // Optional
  "resourceId": "img-123" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "789",
    "name": "file-copy.jpg",
    "path": "path/to/file-copy.jpg",
    "bucket": "destination-bucket",
    // Other file metadata
  },
  "url": "https://example.com/storage/destination-bucket/path/to/file-copy.jpg"
}
```

#### 3. Copy File (Deprecated)

Copies a file using the legacy API.

```
POST /api/storage/file/:fileId/copy
```

**Request Body:**
```json
{
  "name": "file-copy.jpg", // Optional
  "contentType": "image/jpeg", // Optional
  "contextType": "organization", // Optional
  "contextId": "org-123", // Optional
  "resourceType": "image", // Optional
  "resourceId": "img-123", // Optional
  "isPublic": true, // Optional
  "accessLevel": "public", // Optional
  "metadata": { "description": "This is a copy" }, // Optional
  "pathTokens": "path/to/file-copy.jpg", // Optional
  "targetPath": "path/to/file-copy.jpg" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "456",
    "name": "file-copy.jpg",
    // Other file metadata
  },
  "url": "https://example.com/storage/bucket/path/to/file-copy.jpg"
}
```

### Authorization

All file operations require appropriate permissions:

- Move operations require the `file.update` permission
- Copy operations require the `file.create` permission

The authorization is handled by the `authorize` middleware, which checks if the user has the required permission based on their JWT token or API key. 