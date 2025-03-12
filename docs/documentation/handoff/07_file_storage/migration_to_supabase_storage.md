# Migration Plan: Moving All Storage to Supabase Storage

## Overview

This document outlines the plan to migrate all file storage in the Remodl AI platform to exclusively use Supabase Storage, removing any dependencies on legacy local filesystem storage or AWS S3 storage.

## Current State

The platform currently uses a mix of storage approaches:

1. **Supabase Storage** - Modern implementation with multi-tenant support
   - Located in `/packages/server/src/utils/storageOperations.ts` and `/packages/server/src/services/storage/index.ts`
   - Properly integrated with Supabase auth and multi-tenant architecture

2. **Legacy Storage** - Older implementation using local filesystem or AWS S3
   - Located in `/packages/components/src/storageUtils.ts`
   - Used by various components and API endpoints
   - Does not properly support multi-tenant architecture

3. **Mixed Usage** - Some endpoints fall back to legacy storage when Supabase storage operations fail
   - Example: `/packages/server/src/controllers/get-upload-file/index.ts`

## Migration Steps

### Phase 1: Identify All Legacy Storage Usage

1. **Component-Level Usage**
   - Identify all imports of `storageUtils.ts` in component files
   - Map all functions that use legacy storage methods:
     - `addBase64FilesToStorage`
     - `addArrayFilesToStorage`
     - `addSingleFileToStorage`
     - `getFileFromStorage`
     - `getFileFromUpload`
     - `removeFilesFromStorage`
     - `removeSpecificFileFromStorage`
     - `getStoragePath`
     - `getStorageType`

2. **API Endpoint Usage**
   - Identify all API endpoints that use legacy storage
   - Special attention to:
     - `/packages/server/src/controllers/get-upload-file/index.ts`
     - `/packages/server/src/controllers/get-upload-path/index.ts`
     - `/packages/server/src/controllers/openai-assistants/index.ts`

3. **UI Component Usage**
   - Identify UI components that interact with file storage
   - Check for direct references to legacy storage paths or methods

### Phase 2: Create Adapter Functions

1. **Create Adapter Layer**
   - Create adapter functions in `/packages/components/src/supabaseStorageAdapter.ts`
   - Implement functions with the same signatures as legacy functions but using Supabase Storage

2. **Example Adapter Functions**:
   ```typescript
   // Legacy function
   export const addSingleFileToStorage = async (mime: string, bf: Buffer, fileName: string, ...paths: string[]) => {
       // Legacy implementation
   }

   // Adapter function
   export const addSingleFileToStorage = async (mime: string, bf: Buffer, fileName: string, ...paths: string[]) => {
       // Get auth context
       const authContext = {
           appId: process.env.DEFAULT_APP_ID || 'default',
           orgId: process.env.DEFAULT_ORG_ID || 'default',
           userId: process.env.DEFAULT_USER_ID
       }

       // Generate path similar to legacy format
       const filePath = paths.join('/') + '/' + fileName

       // Use Supabase Storage
       const result = await uploadFile(
           STORAGE_BUCKETS.APPS,
           bf,
           {
               name: fileName,
               contentType: mime,
               contextType: FILE_CONTEXT_TYPES.APPLICATION,
               contextId: authContext.appId,
               resourceType: FILE_RESOURCE_TYPES.DOCUMENT,
               pathTokens: paths.join('/')
           },
           authContext
       )

       return 'FILE-STORAGE::' + fileName
   }
   ```

### Phase 3: Replace Legacy Storage Usage

1. **Update Component Imports**
   - Replace imports from `storageUtils.ts` with imports from `supabaseStorageAdapter.ts`
   - No changes to function calls needed due to adapter pattern

2. **Update API Endpoints**
   - Modify API endpoints to use Supabase Storage directly
   - Remove fallback to legacy storage

3. **Update UI Components**
   - Update any UI components that interact directly with storage

### Phase 4: Testing and Validation

1. **Test File Operations**
   - Upload, download, list, and delete operations
   - Test with various file types and sizes

2. **Test Multi-Tenant Isolation**
   - Ensure files are properly isolated between tenants
   - Verify access control works correctly

3. **Performance Testing**
   - Compare performance with legacy storage
   - Optimize if necessary

### Phase 5: Cleanup

1. **Remove Legacy Code**
   - Once all functionality is migrated and tested, remove:
     - `/packages/components/src/storageUtils.ts`
     - Any other legacy storage-specific code

2. **Update Documentation**
   - Update all documentation to reflect Supabase Storage usage
   - Remove references to legacy storage options

3. **Update Environment Variables**
   - Remove legacy storage environment variables:
     - `STORAGE_TYPE`
     - `BLOB_STORAGE_PATH`
     - `S3_BUCKET_NAME`
     - `S3_REGION`
     - `S3_ACCESS_KEY_ID`
     - `S3_SECRET_ACCESS_KEY`

## Implementation Priority

1. **High Priority**
   - Chat message file attachments
   - Document storage for document loaders
   - OpenAI Assistant file uploads

2. **Medium Priority**
   - Profile pictures
   - Application assets

3. **Low Priority**
   - Temporary files
   - Debug/log files

## Timeline

- **Week 1**: Phase 1 (Identification) and Phase 2 (Adapter Creation)
- **Week 2**: Phase 3 (Replacement) for high-priority items
- **Week 3**: Phase 3 (Replacement) for medium and low-priority items
- **Week 4**: Phase 4 (Testing) and Phase 5 (Cleanup)

## Risks and Mitigation

1. **Risk**: Data loss during migration
   - **Mitigation**: Implement dual-write strategy during transition

2. **Risk**: Performance issues with Supabase Storage
   - **Mitigation**: Implement caching and optimize file access patterns

3. **Risk**: Breaking changes to APIs
   - **Mitigation**: Use adapter pattern to maintain backward compatibility

4. **Risk**: Multi-tenant isolation failures
   - **Mitigation**: Comprehensive testing of access controls and isolation 

## Column Renaming: From virtual_path to path_tokens

As part of our ongoing improvements to the storage architecture, we've made the following change:

### Change Details

1. **Column Rename**:
   - Renamed the `` column to `path_tokens` in the `files` table
   - Changed the data type from `text` to `text[]` (array of strings)

2. **Motivation**:
   - Better alignment with Supabase Storage's internal structure
   - More efficient querying for hierarchical data
   - Improved performance for path-based operations
   - Clearer separation between storage paths and UI presentation

3. **Benefits**:
   - Efficient filtering: `WHERE path_tokens[1] = 'logos'`
   - Finding files in nested folders: `WHERE path_tokens @> ARRAY['documents', 'important']`
   - Counting depth: `WHERE array_length(path_tokens, 1) = 3`
   - Easier breadcrumb navigation implementation
   - Better support for omitting technical identifiers in the UI

4. **Implementation**:
   - Updated database schema with migration script
   - Modified all API endpoints to use the new column
   - Updated UI components to handle array-based paths
   - Added utility functions for path token manipulation

5. **UI Considerations**:
   - Skip technical identifiers (like org IDs) in the UI
   - Replace technical names with user-friendly ones
   - Use breadcrumb components to visualize the hierarchy
   - Implement folder navigation based on path token arrays

This change represents a significant improvement in our storage architecture, making it more aligned with Supabase's internal structure while providing better performance and flexibility for our application.

## Native Supabase Storage Operations

As part of our migration to Supabase Storage, we've implemented native Supabase Storage operations for copying and moving files. These operations leverage Supabase's built-in functionality rather than implementing our own solutions, which improves performance and reliability.

### Copy and Move Operations

Supabase Storage provides native methods for copying and moving files both within the same bucket and across different buckets. We've integrated these methods into our storage service to provide a seamless experience for file management.

#### Benefits of Native Operations

1. **Performance**: Native operations are more efficient than manual download-upload approaches
2. **Reliability**: Supabase handles edge cases and error conditions properly
3. **Atomicity**: Operations are more atomic, reducing the risk of partial failures
4. **Bandwidth**: Reduces bandwidth usage since files don't need to be downloaded and re-uploaded

#### Implementation Details

We've updated our storage utilities to use the native Supabase Storage methods:

```typescript
// Copy a file using native Supabase Storage method
const { data, error } = await supabase.storage
  .from(sourceBucket)
  .copy(sourceFilePath, destinationFilePath, {
    ...(sourceBucket !== destinationBucket ? { destinationBucket } : {})
  });

// Move a file using native Supabase Storage method
const { data, error } = await supabase.storage
  .from(sourceBucket)
  .move(sourceFilePath, destinationFilePath, {
    ...(sourceBucket !== destinationBucket ? { destinationBucket } : {})
  });
```

#### File Metadata Updates

When files are copied or moved, we ensure that the file metadata in the database is updated accordingly:

1. **For Copies**:
   - A new file metadata record is created with a new ID
   - The metadata includes a reference to the original file
   - All relevant fields (path, bucket, etc.) are updated for the new file

2. **For Moves**:
   - The existing file metadata record is updated with the new path and bucket
   - The URL field is updated to reflect the new location
   - The updated_at timestamp is set to the current time

### Available Functions

We've implemented several high-level functions for copying and moving files:

1. **moveFilePathTokens**: Moves a file by updating its path tokens in the database
2. **moveFileStorage**: Physically moves a file in Supabase Storage and updates the metadata
3. **copyFileWithinBucket**: Copies a file within the same bucket
4. **copyFileAcrossBuckets**: Copies a file to a different bucket

These functions handle permissions, error checking, and metadata updates automatically, making them safe and easy to use.

### Usage Examples

```typescript
// Move a file to a new location in the same bucket
const updatedFile = await moveFileStorage(
  fileId,
  'new/path/to/file.jpg',
  authContext
);

// Move a file to a different bucket
const updatedFile = await moveFileStorage(
  fileId,
  'path/to/file.jpg',
  authContext,
  'destination-bucket'
);

// Copy a file within the same bucket
const { file, url } = await copyFileWithinBucket(
  fileId,
  'new/path/to/file-copy.jpg',
  {
    name: 'file-copy.jpg',
    pathTokens: ['new', 'path', 'to', 'file-copy.jpg'],
    isPublic: true
  },
  authContext
);

// Copy a file to a different bucket
const { file, url } = await copyFileAcrossBuckets(
  fileId,
  'destination-bucket',
  'path/to/file-copy.jpg',
  {
    name: 'file-copy.jpg',
    pathTokens: ['path', 'to', 'file-copy.jpg'],
    contextType: 'organization',
    contextId: 'org-123'
  },
  authContext
);
```

For more detailed information about these functions, see the [Storage Path Utilities and File Operations](./storage_path_utilities.md) documentation. 