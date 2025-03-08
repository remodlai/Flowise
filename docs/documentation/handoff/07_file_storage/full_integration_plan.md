# Full Supabase Storage Integration Plan

This document outlines the comprehensive plan to fully integrate our new Supabase Storage service with the file upload functionality in the application.

## Background

We've implemented a high-level storage service that uses Supabase Storage for file storage and management. However, the current implementation only updates the `multiModalUtils.ts` file, which affects how images are processed for multi-modal LLM processing, but doesn't change how the UI handles file uploads or how files are served to users.

The UI is still using the old approach for handling file uploads, which uses the `/api/v1/get-upload-file` endpoint. This endpoint uses the `streamStorageFile` function from `flowise-components`, which stores files in either local storage or S3, depending on the configuration.

## Plan Overview

To fully integrate our new Supabase Storage service with the file upload functionality, we need to:

1. Update the backend API endpoints to use our new storage service
2. Update the file upload process in the UI to use our new endpoints
3. Ensure proper integration with the LLM processing
4. Test and validate the changes
5. Update documentation and clean up legacy code

## Phase 1: Update Backend API Endpoints

### 1. Create a New Storage API Endpoint

1. Create a new endpoint `/api/v1/storage/file/:fileId/download` that uses our storage service to download files
2. This endpoint should:
   - Use the `downloadFile` function from our storage service
   - Set appropriate headers for content type and disposition
   - Stream the file data to the client

```typescript
// packages/server/src/routes/storage/index.ts (add to existing file)

/**
 * @route GET /api/v1/storage/file/:fileId/download
 * @desc Download a file by ID (compatible with legacy URLs)
 * @access Private
 */
router.get('/file/:fileId/download', authorize('file.read'), async (req, res) => {
    try {
        const { fileId } = req.params;
        
        // Download file
        const { data, file } = await downloadFile(fileId);
        
        // Set headers
        res.setHeader('Content-Type', file.content_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Length', data.size.toString());
        
        // Send file
        return res.send(Buffer.from(await data.arrayBuffer()));
    } catch (error) {
        return handleStorageError(error, res);
    }
});
```

### 2. Create a Legacy Compatibility Endpoint

1. Update the existing `/api/v1/get-upload-file` endpoint to use our storage service
2. This endpoint should:
   - Accept the same query parameters (chatflowId, chatId, fileName)
   - Look up the file in our database using these parameters
   - Use our storage service to download and serve the file
   - Maintain backward compatibility with existing URLs

```typescript
// packages/server/src/controllers/get-upload-file/index.ts

import { Request, Response, NextFunction } from 'express'
import contentDisposition from 'content-disposition'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getFileMetadataByPath, searchFileMetadata } from '../../services/fileMetadata'
import { downloadFile } from '../../services/storage'

const streamUploadedFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.query.chatflowId || !req.query.chatId || !req.query.fileName) {
            return res.status(500).send(`Invalid file path`)
        }
        
        const chatflowId = req.query.chatflowId as string
        const chatId = req.query.chatId as string
        const fileName = req.query.fileName as string
        
        // Set content disposition header
        res.setHeader('Content-Disposition', contentDisposition(fileName))
        
        // Try to find the file in our database first
        const { files } = await searchFileMetadata({
            filters: {
                context_type: 'application',
                context_id: chatflowId,
                resource_id: chatId,
                name: fileName
            }
        })
        
        if (files.length > 0) {
            // File found in our database, use our storage service
            const { data, file } = await downloadFile(files[0].id)
            
            // Set headers
            res.setHeader('Content-Type', file.content_type)
            
            // Send file
            return res.send(Buffer.from(await data.arrayBuffer()))
        } else {
            // Fall back to the old storage method
            const { streamStorageFile } = require('flowise-components')
            const fileStream = await streamStorageFile(chatflowId, chatId, fileName)
            
            if (!fileStream) {
                throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: streamStorageFile`)
            }
            
            if (fileStream.pipe) {
                fileStream.pipe(res)
            } else {
                res.send(fileStream)
            }
        }
    } catch (error) {
        next(error)
    }
}

export default {
    streamUploadedFile
}
```

## Phase 2: Update File Upload Process

### 1. Create a New File Upload Endpoint

1. Create a new endpoint `/api/v1/storage/upload` that uses our storage service to upload files
2. This endpoint should:
   - Accept file uploads via multipart/form-data
   - Use our storage service to upload files
   - Return file metadata and URLs
   - Support the same parameters as our storage service

```typescript
// packages/server/src/routes/storage/index.ts (add to existing file)

/**
 * @route POST /api/v1/storage/upload/chat
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
                resourceType: file.mimetype.startsWith('image/') ? 'image' : 'document',
                resourceId: chatId,
                isPublic: true,
                metadata: {
                    originalName: file.originalname,
                    chatId: chatId,
                    nodeId: nodeId || '',
                    size: file.size
                },
                virtualPath: 'uploads'
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

### 2. Update the UI to Use the New Endpoints

1. Modify the UI to use our new endpoints for file uploads and downloads
2. Update the URL construction to use file IDs instead of paths
3. Maintain backward compatibility for existing chats

```jsx
// packages/ui/src/views/chatmessage/ChatMessage.jsx

// Update the handleFileUploads function
const handleFileUploads = async (uploads) => {
    if (!uploadedFiles.length) return uploads

    if (fullFileUpload) {
        const filesWithFullUploadType = uploadedFiles.filter((file) => file.type === 'file:full')
        if (filesWithFullUploadType.length > 0) {
            const formData = new FormData()
            for (const file of filesWithFullUploadType) {
                formData.append('file', file.file)
            }
            formData.append('chatflowId', chatflowid)
            formData.append('chatId', chatId)

            try {
                // Use the new endpoint
                const response = await axios.post(`${baseURL}/api/v1/storage/upload/chat`, formData, {
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
            } catch (error) {
                console.error('Error uploading file:', error)
                // Fall back to the old method if the new endpoint fails
                // ... existing code ...
            }
        }
    } else if (isChatFlowAvailableForRAGFileUploads) {
        // ... existing code for RAG uploads ...
    }
    return uploads
}

// Update the URL construction for file downloads
const getFileUrl = (fileData, fileName) => {
    // If fileData is a UUID, use the new endpoint
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileData)) {
        return `${baseURL}/api/v1/storage/file/${fileData}/download`
    } else {
        // Fall back to the old endpoint for backward compatibility
        return `${baseURL}/api/v1/get-upload-file?chatflowId=${chatflowid}&chatId=${chatId}&fileName=${fileName}`
    }
}

// Update the places where file URLs are constructed
// ... (find all places in the code where file URLs are constructed and update them to use the getFileUrl function)
```

## Phase 3: Update the Image Processing for LLMs

### 1. Ensure Proper Integration with multiModalUtils.ts

1. Verify that our updated `multiModalUtils.ts` is properly integrated with the LLM processing
2. Make sure that the file IDs are properly passed to the LLM
3. Update any other components that use `multiModalUtils.ts` to handle the new file ID format

```typescript
// packages/components/src/multiModalUtils.ts

// Make sure the uploadApplicationFile function returns the file ID in the correct format
// and that the LLM can properly process the file URLs
```

## Phase 4: Testing and Validation

### 1. Test File Uploads

1. Test uploading various file types (images, documents, etc.)
2. Verify that files are properly stored in Supabase Storage
3. Verify that file metadata is properly stored in the database
4. Test with different authentication contexts

### 2. Test File Downloads

1. Test downloading files using the new endpoints
2. Verify that files can be accessed using the new URL format
3. Test backward compatibility with existing URLs

### 3. Test LLM Integration

1. Test that images are properly processed by the LLM
2. Verify that the LLM can access the images using the new URL format
3. Test with different LLM models and configurations

## Phase 5: Documentation and Cleanup

### 1. Update Documentation

1. Update the API documentation to include the new endpoints
2. Document the new URL format for file access
3. Update any developer documentation that references file uploads or downloads

### 2. Clean Up Legacy Code

1. Mark the old endpoints as deprecated
2. Add warnings for deprecated usage patterns
3. Plan for eventual removal of the legacy code

## Implementation Timeline

1. **Phase 1**: 1-2 days
2. **Phase 2**: 2-3 days
3. **Phase 3**: 1 day
4. **Phase 4**: 2-3 days
5. **Phase 5**: 1 day

Total estimated time: 7-10 days

## Risks and Mitigations

1. **Risk**: Breaking existing chats
   - **Mitigation**: Maintain backward compatibility with existing URLs

2. **Risk**: Performance issues with large files
   - **Mitigation**: Implement streaming for large file downloads

3. **Risk**: Security vulnerabilities
   - **Mitigation**: Ensure proper authentication and authorization checks

4. **Risk**: Integration issues with LLMs
   - **Mitigation**: Thorough testing with different LLM models and configurations 