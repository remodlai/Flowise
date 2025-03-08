# UI Integration with Supabase Storage

This document outlines the integration of the UI components with the Supabase Storage service.

## Overview

The UI integration involves updating the frontend components to use the new storage service for file uploads and displays. The key components that have been updated include:

1. ChatMessage.jsx - The main component for displaying chat messages and handling file uploads
2. multiModalUtils.ts - The utility for handling multi-modal content in messages

## ChatMessage.jsx Integration

### getFileUrl Helper Function

A new helper function has been added to determine whether to use the new endpoint or the legacy endpoint based on the file data:

```javascript
const getFileUrl = (fileData, fileName, chatflowId, chatId, baseUrl) => {
    // If fileData is a UUID, use the new endpoint
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileData)) {
        return `${baseUrl}/api/storage/file/${fileData}/download`
    } else {
        // Fall back to the legacy endpoint for backward compatibility
        return `${baseUrl}/api/v1/get-upload-file?chatflowId=${chatflowId}&chatId=${chatId}&fileName=${fileName}`
    }
}
```

This function checks if the fileData is a UUID (which would be the case for files uploaded with the new storage service) and uses the appropriate endpoint.

### handleFileUploads Function

The `handleFileUploads` function has been updated to use the new storage service endpoint:

```javascript
const handleFileUploads = async (uploads) => {
    if (!uploadedFiles.length) return uploads

    if (fullFileUpload) {
        const filesWithFullUploadType = uploadedFiles.filter((file) => file.type === 'file:full')
        if (filesWithFullUploadType.length > 0) {
            try {
                // Try to use the new storage service first
                for (const file of filesWithFullUploadType) {
                    const formData = new FormData()
                    formData.append('file', file.file)
                    formData.append('chatflowId', chatflowid)
                    formData.append('chatId', chatId)
                    formData.append('nodeId', '')

                    try {
                        // Use the new endpoint
                        const response = await axios.post(`${baseURL}/api/storage/upload/chat`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        })
                        
                        const data = response.data
                        
                        if (data.success && data.file) {
                            // Find matching name in previews and replace data with file ID
                            const uploadIndex = uploads.findIndex((upload) => upload.name === data.file.name)
                            
                            if (uploadIndex !== -1) {
                                uploads[uploadIndex] = {
                                    ...uploads[uploadIndex],
                                    data: data.file.id, // Store the file ID
                                    name: data.file.name,
                                    type: 'stored-file',
                                    mime: data.file.mime
                                }
                            }
                        }
                    } catch (fileError) {
                        console.error('Error uploading individual file with new storage service:', fileError)
                        // Continue with the next file
                    }
                }
            } catch (error) {
                console.error('Error uploading files with new storage service:', error)
                // Fall back to the old method if the new endpoint fails
                // ... existing code for fallback ...
            }
        }
    } else if (isChatFlowAvailableForRAGFileUploads) {
        // ... existing code for RAG uploads ...
    }
    return uploads
}
```

This updated function tries to use the new storage service first, and falls back to the old method if it fails. It also updates the uploads array to store the file ID instead of the file path.

### File URL Construction

The file URL construction has been updated to use the `getFileUrl` helper function:

```javascript
if (message.fileUploads) {
    obj.fileUploads = message.fileUploads
    obj.fileUploads.forEach((file) => {
        if (file.type === 'stored-file') {
            // Use the helper function to determine the correct URL
            file.data = getFileUrl(file.data, file.name, chatflowid, chatId, baseURL)
        }
    })
}
```

### Artifact URL Construction

The artifact URL construction has also been updated to use the `getFileUrl` helper function:

```javascript
const agentReasoningArtifacts = (artifacts) => {
    const newArtifacts = cloneDeep(artifacts)
    for (let i = 0; i < newArtifacts.length; i++) {
        const artifact = newArtifacts[i]
        if (artifact && (artifact.type === 'png' || artifact.type === 'jpeg')) {
            const fileName = artifact.data.replace('FILE-STORAGE::', '')
            newArtifacts[i].data = getFileUrl(fileName, fileName, chatflowid, chatId, baseURL)
        }
    }
    return newArtifacts
}
```

## multiModalUtils.ts Integration

The `multiModalUtils.ts` file has been updated to use the new storage service for uploading images. The key changes include:

```typescript
import { 
    uploadApplicationFile, 
    FILE_RESOURCE_TYPES 
} from '../../server/src/services/storage'
import { StorageError } from '../../server/src/errors'

export const addImagesToMessages = async (
    nodeData: INodeData,
    options: ICommonObject,
    multiModalOption?: IMultiModalOption
): Promise<MessageContentImageUrl[]> => {
    // ... existing code ...
    
    // Create authentication context from available information
    const authContext = {
        userId: options.userId || 'anonymous',
        orgId: options.orgId,
        appId: options.chatflowid
    }
    
    // ... existing code ...
    
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
                resourceId: options.chatId,
                isPublic: true,
                metadata: {
                    originalName: upload.name,
                    chatId: options.chatId,
                    nodeId: nodeData.id,
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
    // ... existing code ...
}
```

## Flow

1. User uploads a file in the chat UI
2. The file is sent to the server via the `/api/storage/upload/chat` endpoint
3. The server uploads the file to Supabase Storage and stores metadata in the database
4. The server returns the file ID to the client
5. The client displays the file in the chat UI using the file ID
6. When the user views the chat later, the client requests the file from the server via the `/api/storage/file/:fileId/download` endpoint
7. The server retrieves the file from Supabase Storage and returns it to the client
8. The client displays the file in the chat UI

## Backward Compatibility

To ensure backward compatibility with existing file uploads, the integration includes fallback mechanisms:

1. If the file data is not a UUID, the client falls back to the legacy endpoint
2. If the file upload to the new storage service fails, the client falls back to the old method
3. If the file cannot be downloaded from Supabase Storage, the server falls back to the legacy storage method

## Next Steps

The next steps for the UI integration include:

1. Update other UI components to use the new storage service
2. Add support for file versioning
3. Add support for file sharing between users
4. Add support for file permissions in the UI 