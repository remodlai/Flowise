# Chat Image Integration with Storage Service

This document outlines the plan for updating the chat image handling functionality to use our new high-level storage service instead of the direct Supabase Storage utilities.

## Current Implementation

The current implementation in `packages/components/src/multiModalUtils.ts` uses the lower-level Supabase Storage utilities directly:

```typescript
import { uploadImage, generateStoragePath, STORAGE_BUCKETS } from '../../server/src/utils/supabaseStorage'

export const addImagesToMessages = async (
    nodeData: INodeData,
    options: ICommonObject,
    multiModalOption?: IMultiModalOption
): Promise<MessageContentImageUrl[]> => {
    // ...
    try {
        // Try to upload to Supabase Storage first
        const fileBuffer = Buffer.from(contents)
        const contentType = upload.mime || 'image/jpeg'
        
        // Generate storage path based on chatflow ID
        const { bucket, path } = generateStoragePath({
            level: 'app',
            id: options.chatflowid,
            subPath: 'uploads'
        })
        
        // Upload the image with transformation (limit width to 1000px)
        const result = await uploadImage(bucket, path, fileBuffer, {
            contentType,
            isPublic: true,
            width: 1000, // Limit width to 1000px
            quality: 80 // Use 80% quality for JPEG/WebP
        })
        
        if (result.publicUrl) {
            // Use the public URL from Supabase Storage
            imageContent.push({
                type: 'image_url',
                image_url: {
                    url: result.publicUrl
                }
            })
            continue // Skip base64 encoding
        }
    } catch (error) {
        console.warn('Failed to upload to Supabase Storage, falling back to base64:', error)
        // Continue to base64 fallback
    }
    // ...
}
```

This implementation:
1. Uses direct Supabase Storage utilities
2. Doesn't store file metadata in the database
3. Doesn't use RLS policies for access control
4. Doesn't leverage our helper functions

## Proposed Changes

We'll update the implementation to use our new high-level storage service:

### 1. Update Imports

Replace the direct Supabase Storage imports with our new storage service:

```typescript
import { 
    uploadFile, 
    uploadApplicationFile, 
    STORAGE_BUCKETS, 
    FILE_RESOURCE_TYPES 
} from '../../server/src/services/storage'
```

### 2. Create Authentication Context

Create an authentication context object from the available information:

```typescript
const authContext = {
    userId: options.userId || 'anonymous',
    orgId: options.orgId,
    appId: options.chatflowid
}
```

### 3. Update Image Upload Process

Replace the direct Supabase Storage upload with our high-level storage service:

```typescript
// Use the application-specific upload function
const result = await uploadApplicationFile(
    options.chatflowid,
    fileBuffer,
    {
        name: upload.name,
        contentType: upload.mime || 'image/jpeg',
        resourceType: FILE_RESOURCE_TYPES.IMAGE,
        isPublic: true,
        metadata: {
            chatId: options.chatId,
            originalName: upload.name,
            width: 1000,
            quality: 80
        },
        virtualPath: 'uploads'
    },
    authContext
)

if (result.url) {
    // Use the URL from the storage service
    imageContent.push({
        type: 'image_url',
        image_url: {
            url: result.url
        }
    })
    continue // Skip base64 encoding
}
```

### 4. Add Fallback Mechanism

Keep the existing base64 fallback for backward compatibility:

```typescript
// Fallback to base64 encoding if storage upload fails
const base64 = Buffer.from(contents).toString('base64')
const mimeType = upload.mime || 'image/jpeg'
imageContent.push({
    type: 'image_url',
    image_url: {
        url: `data:${mimeType};base64,${base64}`
    }
})
```

### 5. Add Error Handling

Improve error handling to use our `StorageError` class:

```typescript
try {
    // Upload code...
} catch (error) {
    if (error instanceof StorageError) {
        console.warn(`Storage error (${error.code}): ${error.message}`)
    } else {
        console.warn('Failed to upload to storage, falling back to base64:', error)
    }
    // Continue to base64 fallback
}
```

## Implementation Steps

1. **Create a new branch** for the changes
2. **Update the imports** in `multiModalUtils.ts`
3. **Add the StorageError import** for error handling
4. **Create the authentication context** object
5. **Replace the direct Supabase Storage upload** with our high-level storage service
6. **Test the changes** with various chat scenarios
7. **Update documentation** for chat image handling

## Testing Plan

1. **Unit Tests**
   - Create unit tests for the updated `addImagesToMessages` function
   - Mock the storage service to test different scenarios
   - Test error handling and fallback mechanism

2. **Integration Tests**
   - Test image uploads in chat messages
   - Verify that images are properly stored in Supabase Storage
   - Verify that file metadata is properly stored in the database
   - Test access control with different users

3. **Manual Testing**
   - Test image uploads in the UI
   - Verify that images are displayed correctly in chat messages
   - Test with different image types and sizes
   - Test with different authentication contexts

## Backward Compatibility

To ensure backward compatibility:

1. Keep the base64 fallback mechanism
2. Handle missing authentication context gracefully
3. Use default values for required parameters
4. Log warnings for deprecated usage patterns

## Documentation Updates

1. Update the documentation for `multiModalUtils.ts`
2. Add examples of using the new storage service for chat images
3. Document the authentication context requirements
4. Document the fallback mechanism

## Future Improvements

1. Add support for image transformations (resize, crop, etc.)
2. Add support for other file types (PDF, audio, etc.)
3. Add support for file sharing between users
4. Add support for file versioning 