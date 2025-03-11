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
               virtualPath: paths.join('/')
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