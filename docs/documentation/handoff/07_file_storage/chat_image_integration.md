# Chat Image Integration

This document outlines the integration of Supabase Storage with the chat image functionality in the Remodl AI platform.

## Overview

The chat image integration allows users to upload images to their chat conversations, which are then stored in Supabase Storage and can be retrieved later. The integration includes:

1. Uploading images to Supabase Storage
2. Storing metadata about the images in the database
3. Retrieving images from Supabase Storage
4. Displaying images in the chat UI

## Components

### multiModalUtils.ts

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
    // ... existing code ...
}
```

### get-upload-file Controller

The `get-upload-file` controller has been updated to use the new storage service for downloading images. The key changes include:

```typescript
import { searchFileMetadata } from '../../services/fileMetadata'
import { downloadFile } from '../../services/storage'
import { StorageError } from '../../errors'

const streamUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ... existing code ...
        
        try {
            // Try to find the file in our database first
            const files = await searchFileMetadata(fileName, {
                filters: {
                    context_type: 'application',
                    context_id: chatflowId,
                    resource_id: chatId
                }
            })
            
            if (files.length > 0) {
                // File found in our database, use our storage service
                try {
                    const { data, file } = await downloadFile(files[0].id)
                    
                    // Set headers
                    res.setHeader('Content-Type', file.content_type)
                    
                    // Send file
                    return res.send(Buffer.from(await data.arrayBuffer()))
                } catch (error) {
                    console.warn('Error downloading file from storage service, falling back to legacy storage:', error)
                    // Fall back to the old storage method if download fails
                }
            }
        } catch (error) {
            console.warn('Error searching for file metadata, falling back to legacy storage:', error)
            // Fall back to the old storage method if search fails
        }
        
        // Fall back to the old storage method
        // ... existing code ...
    } catch (error) {
        if (error instanceof StorageError) {
            // Handle storage errors
            if (error.code === 'FILE_NOT_FOUND') {
                return res.status(404).send(`File not found`)
            }
            return res.status(error.statusCode).send(error.message)
        }
        next(error)
    }
}
```

### Storage Routes

A new endpoint has been added to the storage routes for uploading files specifically for chat:

```typescript
/**
 * @route POST /api/storage/upload/chat
 * @desc Upload a file specifically for chat
 * @access Private
 */
router.post('/upload/chat', authorize('file.create'), upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const authContext = getAuthContextFromRequest(req);
        
        // Get parameters from request body
        const {
            chatflowId,
            chatId,
            nodeId
        } = req.body;
        
        if (!chatflowId || !chatId) {
            return res.status(400).json({ error: 'chatflowId and chatId are required' });
        }
        
        // Upload file
        const result = await uploadApplicationFile(
            chatflowId,
            file.buffer,
            {
                name: file.originalname,
                contentType: file.mimetype,
                resourceType: file.mimetype.startsWith('image/') ? FILE_RESOURCE_TYPES.IMAGE : FILE_RESOURCE_TYPES.DOCUMENT,
                resourceId: chatId,
                isPublic: true,
                metadata: {
                    originalName: file.originalname,
                    chatId: chatId,
                    nodeId: nodeId || '',
                    size: file.size
                },
                pathTokens: 'uploads'
            },
            authContext
        );
        
        // Return result
        return res.status(201).json({
            success: true,
            file: {
                id: result.file.id,
                name: result.file.name,
                type: 'stored-file',
                mime: result.file.content_type,
                data: result.file.id // Store the file ID instead of the path
            }
        });
    } catch (error) {
        return handleStorageError(error, res);
    }
});
```

## Flow

1. User uploads an image in the chat UI
2. The image is sent to the server via the `/api/storage/upload/chat` endpoint
3. The server uploads the image to Supabase Storage and stores metadata in the database
4. The server returns the file ID to the client
5. The client displays the image in the chat UI using the file ID
6. When the user views the chat later, the client requests the image from the server via the `/api/v1/get-upload-file` endpoint
7. The server retrieves the image from Supabase Storage and returns it to the client
8. The client displays the image in the chat UI

## Backward Compatibility

To ensure backward compatibility with existing file uploads, the integration includes fallback mechanisms:

1. If the file is not found in the database, the server falls back to the legacy storage method
2. If the file cannot be downloaded from Supabase Storage, the server falls back to the legacy storage method
3. If the file cannot be uploaded to Supabase Storage, the client falls back to base64 encoding

## Next Steps

The next phase of the integration involves updating the UI components to use the new storage service:

1. Update `ChatMessage.jsx` to use the new storage service for displaying images
2. Update file upload components to use the new storage service
3. Update file display components to use the new storage service
4. Update file download components to use the new storage service

## Conclusion

The chat image integration with Supabase Storage provides a more robust and scalable solution for handling images in chat conversations. The integration includes proper error handling and fallback mechanisms to ensure backward compatibility with existing file uploads. 