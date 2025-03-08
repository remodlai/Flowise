# Phase 3: Flowise Compatibility and Integration

This document outlines how to integrate our Supabase Storage solution with the existing Flowise upload functionality, including the refactoring of `flowise_chatId` to `remodl_chatId`.

## 3.1 Understanding Existing Flowise Upload Functionality

The Flowise platform currently supports several types of uploads:

1. **Image Uploads**: For multimodal LLMs, allowing users to upload images that are processed and included in the context.
2. **Audio Uploads**: For speech-to-text processing, enabling voice input.
3. **File Uploads**: With two distinct approaches:
   - **RAG File Uploads**: Files are upserted to a vector store for retrieval-augmented generation.
   - **Full File Uploads**: Entire file content is included directly in the prompt.

### Current Upload Types

The Flowise API accepts uploads in the following formats:

```javascript
{
  "uploads": [
    {
      "data": "data:image/png;base64,iVBORw0KGgdM2uN0", // base64 string or URL
      "type": "file", // file | url | audio | file:rag | file:full
      "name": "document.pdf",
      "mime": "application/pdf"
    }
  ]
}
```

### Vector Store Integration

For RAG file uploads, Flowise associates files with chat sessions using the `flowise_chatId` metadata field. When querying, it applies an OR filter:
- Metadata contains `flowise_chatId` and the value matches the current chat session ID
- Metadata does not contain `flowise_chatId` (global documents)

## 3.2 Refactoring `flowise_chatId` to `remodl_chatId`

### Metadata Field Refactoring

We need to update all references to `flowise_chatId` to use `remodl_chatId` instead. This includes:

1. **Vector Store Upsert Process**:

```typescript
// Current implementation
const metadata = {
  flowise_chatId: chatId,
  // other metadata
};

// Updated implementation
const metadata = {
  remodl_chatId: chatId,
  // other metadata
};
```

2. **Vector Store Query Filters**:

```typescript
// Current implementation
const filter = {
  $or: [
    { flowise_chatId: chatId },
    { $not: { flowise_chatId: { $exists: true } } }
  ]
};

// Updated implementation
const filter = {
  $or: [
    { remodl_chatId: chatId },
    { $not: { remodl_chatId: { $exists: true } } }
  ]
};
```

### Backward Compatibility

To ensure backward compatibility during the transition period, we should implement a dual-check approach:

```typescript
// Backward compatible filter
const filter = {
  $or: [
    { remodl_chatId: chatId },
    { flowise_chatId: chatId },
    { 
      $and: [
        { $not: { remodl_chatId: { $exists: true } } },
        { $not: { flowise_chatId: { $exists: true } } }
      ] 
    }
  ]
};
```

This allows the system to work with both old and new metadata formats during the transition.

## 3.3 Integrating with Supabase Storage

### Vector Store Upsert Process

When upserting files to the vector store, we'll use Supabase Storage for the actual file storage:

```typescript
/**
 * Uploads a file to Supabase Storage and prepares it for vector store upsert
 * @param file The file to upload
 * @param chatId The chat session ID
 * @returns The file metadata and content for vector store upsert
 */
export async function prepareFileForVectorUpsert(file: File, chatId: string) {
  // Upload the file to Supabase Storage
  const result = await uploadFile({
    file,
    fileName: file.name,
    contentType: file.type,
    pathOptions: {
      context: 'user', // or organization/application based on context
      contextId: userId, // or organizationId/applicationId
      resourceType: 'vector-documents',
      resourceId: chatId
    },
    metadata: {
      remodl_chatId: chatId
    }
  });
  
  // Process the file content for vector store
  const fileContent = await processFileContent(file);
  
  return {
    metadata: {
      source: file.name,
      remodl_chatId: chatId,
      url: result.url,
      contentType: file.type
    },
    content: fileContent
  };
}
```

### Supporting Different Upload Types

We need to modify our storage utilities to handle all the upload types supported by Flowise:

```typescript
/**
 * Processes uploads based on their type
 * @param uploads The uploads to process
 * @param options Processing options
 * @returns The processed uploads
 */
export async function processUploads(
  uploads: Array<{
    data: string;
    type: 'file' | 'url' | 'audio' | 'file:rag' | 'file:full';
    name: string;
    mime: string;
  }>,
  options: {
    chatId?: string;
    userId?: string;
    organizationId?: string;
    applicationId?: string;
  }
) {
  const { chatId, userId, organizationId, applicationId } = options;
  
  // Determine the appropriate context for storage
  let context: 'organization' | 'user' | 'application' = 'user';
  let contextId = userId;
  
  if (organizationId) {
    context = 'organization';
    contextId = organizationId;
  } else if (applicationId) {
    context = 'application';
    contextId = applicationId;
  }
  
  const results = [];
  
  for (const upload of uploads) {
    const { data, type, name, mime } = upload;
    
    // Process based on upload type
    if (type === 'file' || type === 'file:full') {
      // Handle regular file or full file upload
      const file = dataURLtoFile(data, name, mime);
      
      const result = await uploadFile({
        file,
        fileName: name,
        contentType: mime,
        pathOptions: {
          context,
          contextId,
          resourceType: 'uploads',
          resourceId: chatId || Date.now().toString()
        },
        metadata: chatId ? { remodl_chatId: chatId } : {}
      });
      
      results.push({
        ...result,
        content: type === 'file:full' ? await file.text() : undefined
      });
    } else if (type === 'file:rag') {
      // Handle RAG file upload
      const file = dataURLtoFile(data, name, mime);
      
      // Prepare for vector store upsert
      const vectorData = await prepareFileForVectorUpsert(file, chatId);
      
      results.push({
        vectorData,
        url: vectorData.metadata.url
      });
    } else if (type === 'url') {
      // Handle URL upload
      // Fetch the content from the URL and store it
      const response = await fetch(data);
      const blob = await response.blob();
      
      const result = await uploadFile({
        file: blob,
        fileName: name || `url-${Date.now()}`,
        contentType: mime || blob.type,
        pathOptions: {
          context,
          contextId,
          resourceType: 'url-uploads',
          resourceId: chatId || Date.now().toString()
        },
        metadata: chatId ? { remodl_chatId: chatId } : {}
      });
      
      results.push(result);
    } else if (type === 'audio') {
      // Handle audio upload
      const file = dataURLtoFile(data, name, mime);
      
      const result = await uploadFile({
        file,
        fileName: name,
        contentType: mime,
        pathOptions: {
          context,
          contextId,
          resourceType: 'audio',
          resourceId: chatId || Date.now().toString()
        },
        metadata: chatId ? { remodl_chatId: chatId } : {}
      });
      
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Converts a data URL to a File object
 * @param dataURL The data URL
 * @param fileName The file name
 * @param mimeType The MIME type
 * @returns A File object
 */
function dataURLtoFile(dataURL: string, fileName: string, mimeType: string): File {
  const arr = dataURL.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], fileName, { type: mimeType });
}
```

## 3.4 Updating the Prediction Endpoint

The `/predictions` endpoint needs to be updated to handle uploads using our Supabase Storage integration:

```typescript
// packages/server/src/controllers/PredictionController.ts

import { Request, Response } from 'express';
import { processUploads } from '../utils/supabaseStorage';

export class PredictionController {
  async predict(req: Request, res: Response) {
    try {
      const { question, chatId, uploads, ...otherParams } = req.body;
      
      // Get authentication context
      const auth = getSupabaseAuth(req);
      const userId = auth?.user?.id;
      const organizationId = req.headers['x-organization-id'] as string;
      const applicationId = req.headers['x-application-id'] as string;
      
      // Process uploads if provided
      let processedUploads = [];
      if (uploads && uploads.length > 0) {
        processedUploads = await processUploads(uploads, {
          chatId,
          userId,
          organizationId,
          applicationId
        });
      }
      
      // Continue with the prediction logic
      // ...
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in prediction:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
```

## 3.5 Vector Store Integration

For RAG file uploads, we need to ensure our Supabase Storage integration works with the vector store upsert functionality:

```typescript
// packages/server/src/controllers/VectorController.ts

import { Request, Response } from 'express';
import { uploadFile } from '../utils/supabaseStorage';
import { processFileForVectorStore } from '../utils/vectorUtils';

export class VectorController {
  async upsert(req: Request, res: Response) {
    try {
      const { chatId } = req.body;
      const files = req.files as Express.Multer.File[];
      
      // Get authentication context
      const auth = getSupabaseAuth(req);
      const userId = auth?.user?.id;
      const organizationId = req.headers['x-organization-id'] as string;
      const applicationId = req.headers['x-application-id'] as string;
      
      // Determine the appropriate context for storage
      let context: 'organization' | 'user' | 'application' = 'user';
      let contextId = userId;
      
      if (organizationId) {
        context = 'organization';
        contextId = organizationId;
      } else if (applicationId) {
        context = 'application';
        contextId = applicationId;
      }
      
      const results = [];
      
      for (const file of files) {
        // Upload the file to Supabase Storage
        const uploadResult = await uploadFile({
          file: file.buffer,
          fileName: file.originalname,
          contentType: file.mimetype,
          pathOptions: {
            context,
            contextId,
            resourceType: 'vector-documents',
            resourceId: chatId || Date.now().toString()
          },
          metadata: chatId ? { remodl_chatId: chatId } : {}
        });
        
        // Process the file for vector store upsert
        const vectorResult = await processFileForVectorStore(file, {
          metadata: {
            source: file.originalname,
            remodl_chatId: chatId,
            url: uploadResult.url,
            contentType: file.mimetype
          }
        });
        
        results.push({
          fileName: file.originalname,
          url: uploadResult.url,
          vectorIds: vectorResult.ids
        });
      }
      
      // Return the results
      return res.status(200).json({ results });
    } catch (error) {
      console.error('Error in vector upsert:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
```

## 3.6 Implementation Steps

1. **Update Vector Store Filters**:
   - Modify all vector store query filters to use `remodl_chatId` instead of `flowise_chatId`
   - Implement backward compatibility for the transition period

2. **Update Upload Processing**:
   - Implement the `processUploads` function to handle all upload types
   - Ensure proper integration with Supabase Storage

3. **Update Prediction Endpoint**:
   - Modify the `/predictions` endpoint to use the new upload processing
   - Ensure proper handling of different upload types

4. **Update Vector Store Integration**:
   - Implement the vector store upsert functionality with Supabase Storage
   - Ensure proper metadata handling for chat association

5. **Test Compatibility**:
   - Test with existing Flowise clients to ensure backward compatibility
   - Verify that all upload types work as expected

## 3.7 Key Considerations

1. **Backward Compatibility**: Ensure the system works with both old and new metadata formats during the transition
2. **Performance**: Optimize file processing for different upload types
3. **Error Handling**: Implement comprehensive error handling for upload processing
4. **Security**: Ensure proper access control for uploaded files
5. **Multi-tenant Isolation**: Enforce strict tenant isolation in all upload operations 