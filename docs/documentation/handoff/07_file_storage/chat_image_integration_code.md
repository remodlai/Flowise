# Chat Image Integration Code Sample

This document provides a sample implementation of the updated `addImagesToMessages` function that uses our new high-level storage service.

## Updated Implementation

```typescript
/**
 * Adds images to messages for multi-modal LLM processing
 * 
 * This function:
 * 1. Checks if the model supports vision capabilities
 * 2. Processes image uploads from stored files or URLs
 * 3. Uploads images to Supabase Storage with proper metadata
 * 4. Falls back to base64 encoding if storage upload fails
 * 5. Returns properly formatted image content for the LLM
 * 
 * @param nodeData - Data from the node
 * @param options - Common options including uploads and chatflow info
 * @param multiModalOption - Options for multi-modal processing
 * @returns Array of image content objects ready for the LLM
 */
export const addImagesToMessages = async (
    nodeData: INodeData,
    options: ICommonObject,
    multiModalOption?: IMultiModalOption
): Promise<MessageContentImageUrl[]> => {
    const imageContent: MessageContentImageUrl[] = []
    let model = nodeData.inputs?.model

    if (llmSupportsVision(model) && multiModalOption) {
        // Image Uploaded
        if (multiModalOption.image && multiModalOption.image.allowImageUploads && options?.uploads && options?.uploads.length > 0) {
            const imageUploads = getImageUploads(options.uploads)
            
            // Create authentication context from available information
            const authContext = {
                userId: options.userId || 'anonymous',
                orgId: options.orgId,
                appId: options.chatflowid
            }
            
            for (const upload of imageUploads) {
                if (upload.type == 'stored-file') {
                    try {
                        // Get the file from storage
                        const contents = await getFileFromStorage(upload.name, options.chatflowid, options.chatId)
                        
                        if (contents) {
                            try {
                                // Try to upload to storage service first
                                const fileBuffer = Buffer.from(contents)
                                const contentType = upload.mime || 'image/jpeg'
                                
                                // Use the application-specific upload function
                                const result = await uploadApplicationFile(
                                    options.chatflowid,
                                    fileBuffer,
                                    {
                                        name: upload.name,
                                        contentType: contentType,
                                        resourceType: FILE_RESOURCE_TYPES.IMAGE,
                                        resourceId: options.chatId, // Associate with chat ID
                                        isPublic: true,
                                        metadata: {
                                            originalName: upload.name,
                                            chatId: options.chatId,
                                            nodeId: nodeData.id,
                                            width: 1000,
                                            quality: 80
                                        },
                                        pathTokens: 'uploads'
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
                            } catch (error) {
                                // Handle storage errors
                                if (error instanceof StorageError) {
                                    console.warn(`Storage error (${error.code}): ${error.message}`)
                                } else {
                                    console.warn('Failed to upload to storage, falling back to base64:', error)
                                }
                                // Continue to base64 fallback
                            }
                            
                            // Fallback to base64 encoding if storage upload fails
                            const base64 = Buffer.from(contents).toString('base64')
                            const mimeType = upload.mime || 'image/jpeg'
                            imageContent.push({
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64}`
                                }
                            })
                        }
                    } catch (error) {
                        console.error('Error processing stored file:', error)
                    }
                } else if (upload.type === 'url') {
                    // Handle URL uploads directly
                    imageContent.push({
                        type: 'image_url',
                        image_url: {
                            url: upload.data || '' // Use data property instead of url
                        }
                    })
                }
            }
        }
    }
    return imageContent
}
```

## Required Imports

```typescript
import { INodeData, ICommonObject, IFileUpload, IMultiModalOption, MessageContentImageUrl } from './Interface'
import { getFileFromStorage } from './storageUtils'
import { 
    uploadApplicationFile, 
    FILE_RESOURCE_TYPES 
} from '../../server/src/services/storage'
import { StorageError } from '../../server/src/errors'
```

## Key Changes

1. **Authentication Context**:
   - Created an authentication context object from available information
   - Used `options.userId`, `options.orgId`, and `options.chatflowid`

2. **Storage Service**:
   - Replaced direct Supabase Storage utilities with our high-level storage service
   - Used `uploadApplicationFile` for application-specific uploads
   - Added proper metadata including chat ID and node ID

3. **Error Handling**:
   - Added specific handling for `StorageError` instances
   - Improved error logging with error codes and messages

4. **Fallback Mechanism**:
   - Kept the base64 fallback for backward compatibility
   - Only used fallback if storage upload fails

## Benefits

1. **File Metadata**:
   - File metadata is now stored in the database
   - Files are associated with specific chats and nodes
   - Files can be queried and managed through the storage service

2. **Access Control**:
   - Files are now subject to RLS policies
   - Access is controlled based on user, organization, and application

3. **Helper Functions**:
   - Using context-specific functions simplifies the code
   - Common operations are handled by the storage service

4. **Backward Compatibility**:
   - Base64 fallback ensures backward compatibility
   - Existing code that expects base64 images will still work 