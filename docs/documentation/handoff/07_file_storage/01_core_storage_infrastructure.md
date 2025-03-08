# Phase 1: Core Storage Infrastructure

This document provides detailed implementation guidance for Phase 1 of the Supabase Storage integration plan, focusing on establishing the core storage infrastructure.

## 1.1 Standardize Storage Path Generation

### Current Implementation

The current `generateStoragePath` function in `supabaseStorage.ts` provides a foundation but needs enhancement to support all required path patterns consistently.

### Proposed Implementation

```typescript
/**
 * Generates a storage path based on the context and resource type
 * @param options Path generation options
 * @returns The generated storage path
 */
export function generateStoragePath(options: {
  context: 'platform' | 'application' | 'organization' | 'user';
  resourceType: string;
  resourceId?: string;
  contextId?: string;
  subPath?: string;
}): string {
  const { context, resourceType, resourceId, contextId, subPath } = options;
  
  // Validate required parameters based on context
  if (context !== 'platform' && !contextId) {
    throw new Error(`contextId is required for ${context} context`);
  }
  
  let basePath = '';
  
  // Generate base path based on context
  switch (context) {
    case 'platform':
      basePath = `platform/${resourceType}`;
      break;
    case 'application':
      basePath = `applications/${contextId}/${resourceType}`;
      break;
    case 'organization':
      basePath = `organizations/${contextId}/${resourceType}`;
      break;
    case 'user':
      basePath = `users/${contextId}/${resourceType}`;
      break;
    default:
      throw new Error(`Invalid context: ${context}`);
  }
  
  // Add resource ID if provided
  if (resourceId) {
    basePath = `${basePath}/${resourceId}`;
  }
  
  // Add sub-path if provided
  if (subPath) {
    // Ensure sub-path doesn't start with a slash
    const cleanSubPath = subPath.startsWith('/') ? subPath.substring(1) : subPath;
    basePath = `${basePath}/${cleanSubPath}`;
  }
  
  return basePath;
}
```

### Bucket Naming Conventions

Establish consistent bucket naming conventions:

1. **public**: For publicly accessible files (no authentication required)
2. **private**: For files that require authentication
3. **protected**: For files with specific access patterns (e.g., organization-specific)

## 1.2 Complete API Wrapper

Enhance `supabaseStorage.ts` with a comprehensive set of methods for file operations.

### File Upload

```typescript
/**
 * Uploads a file to Supabase Storage
 * @param options Upload options
 * @returns The uploaded file metadata
 */
export async function uploadFile(options: {
  file: File | Buffer;
  fileName: string;
  contentType?: string;
  pathOptions: Parameters<typeof generateStoragePath>[0];
  bucket?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}): Promise<{
  path: string;
  url: string;
  id: string;
  size: number;
}> {
  const { file, fileName, contentType, pathOptions, bucket = 'private', isPublic = false, metadata = {} } = options;
  
  // Use the appropriate bucket based on visibility
  const targetBucket = isPublic ? 'public' : bucket;
  
  // Generate the storage path
  const storagePath = `${generateStoragePath(pathOptions)}/${fileName}`;
  
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    // Upload the file
    const { data, error } = await supabase
      .storage
      .from(targetBucket)
      .upload(storagePath, file, {
        contentType,
        upsert: true,
        metadata
      });
    
    if (error) {
      throw error;
    }
    
    // Generate the URL
    const { data: urlData } = supabase
      .storage
      .from(targetBucket)
      .getPublicUrl(storagePath);
    
    return {
      path: storagePath,
      url: urlData.publicUrl,
      id: data.id,
      size: data.size
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}
```

### Image Upload with Transformations

```typescript
/**
 * Uploads an image to Supabase Storage with transformation options
 * @param options Upload options
 * @returns The uploaded image metadata with transformation URL
 */
export async function uploadImage(options: {
  file: File | Buffer;
  fileName: string;
  contentType?: string;
  pathOptions: Parameters<typeof generateStoragePath>[0];
  bucket?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
  transformations?: {
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg' | 'jpg' | 'png';
    quality?: number;
  };
}): Promise<{
  path: string;
  url: string;
  transformationUrl: string;
  id: string;
  size: number;
}> {
  const { transformations, ...uploadOptions } = options;
  
  // Upload the file using the base upload function
  const result = await uploadFile(uploadOptions);
  
  // Generate transformation URL if transformations are provided
  let transformationUrl = result.url;
  
  if (transformations) {
    const { width, height, format, quality } = transformations;
    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    if (format) params.append('format', format);
    if (quality) params.append('quality', quality.toString());
    
    transformationUrl = `${result.url}?${params.toString()}`;
  }
  
  return {
    ...result,
    transformationUrl
  };
}
```

### Get File URL

```typescript
/**
 * Generates a URL for a file in Supabase Storage
 * @param options URL generation options
 * @returns The file URL
 */
export async function getFileUrl(options: {
  path: string;
  bucket?: string;
  isPublic?: boolean;
  expiresIn?: number;
  transformations?: {
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg' | 'jpg' | 'png';
    quality?: number;
  };
}): Promise<string> {
  const { path, bucket = 'private', isPublic = false, expiresIn, transformations } = options;
  
  // Use the appropriate bucket based on visibility
  const targetBucket = isPublic ? 'public' : bucket;
  
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    let url: string;
    
    // Generate the appropriate URL based on visibility and expiration
    if (isPublic) {
      const { data } = supabase
        .storage
        .from(targetBucket)
        .getPublicUrl(path);
      
      url = data.publicUrl;
    } else {
      const { data, error } = await supabase
        .storage
        .from(targetBucket)
        .createSignedUrl(path, expiresIn || 60 * 60); // Default to 1 hour
      
      if (error) {
        throw error;
      }
      
      url = data.signedUrl;
    }
    
    // Apply transformations if provided
    if (transformations) {
      const { width, height, format, quality } = transformations;
      const params = new URLSearchParams();
      
      if (width) params.append('width', width.toString());
      if (height) params.append('height', height.toString());
      if (format) params.append('format', format);
      if (quality) params.append('quality', quality.toString());
      
      url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    }
    
    return url;
  } catch (error) {
    console.error('Error generating file URL:', error);
    throw new Error(`Failed to generate file URL: ${error.message}`);
  }
}
```

### List Files

```typescript
/**
 * Lists files in Supabase Storage
 * @param options List options
 * @returns The list of files
 */
export async function listFiles(options: {
  pathOptions: Parameters<typeof generateStoragePath>[0];
  bucket?: string;
  limit?: number;
  offset?: number;
  sortBy?: {
    column: string;
    order: 'asc' | 'desc';
  };
}): Promise<{
  files: Array<{
    name: string;
    path: string;
    url: string;
    size: number;
    createdAt: string;
    contentType: string;
  }>;
  count: number;
}> {
  const { pathOptions, bucket = 'private', limit = 100, offset = 0, sortBy } = options;
  
  // Generate the storage path
  const storagePath = generateStoragePath(pathOptions);
  
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    // List the files
    let query = supabase
      .storage
      .from(bucket)
      .list(storagePath, {
        limit,
        offset,
        sortBy: sortBy ? { column: sortBy.column, order: sortBy.order } : undefined
      });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Generate URLs for each file
    const files = await Promise.all(
      data.map(async (file) => {
        const filePath = `${storagePath}/${file.name}`;
        const { data: urlData } = supabase
          .storage
          .from(bucket)
          .getPublicUrl(filePath);
        
        return {
          name: file.name,
          path: filePath,
          url: urlData.publicUrl,
          size: file.metadata.size,
          createdAt: file.created_at,
          contentType: file.metadata.mimetype
        };
      })
    );
    
    return {
      files,
      count: files.length
    };
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
}
```

### Delete File

```typescript
/**
 * Deletes a file from Supabase Storage
 * @param options Delete options
 * @returns Success status
 */
export async function deleteFile(options: {
  path: string;
  bucket?: string;
}): Promise<boolean> {
  const { path, bucket = 'private' } = options;
  
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    // Delete the file
    const { error } = await supabase
      .storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
```

### Copy File

```typescript
/**
 * Copies a file within Supabase Storage
 * @param options Copy options
 * @returns The copied file metadata
 */
export async function copyFile(options: {
  sourcePath: string;
  sourceBucket?: string;
  destinationPath: string;
  destinationBucket?: string;
}): Promise<{
  path: string;
  url: string;
}> {
  const { 
    sourcePath, 
    sourceBucket = 'private', 
    destinationPath, 
    destinationBucket = sourceBucket 
  } = options;
  
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient();
    
    // Download the file
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(sourceBucket)
      .download(sourcePath);
    
    if (downloadError) {
      throw downloadError;
    }
    
    // Upload the file to the destination
    const { error: uploadError } = await supabase
      .storage
      .from(destinationBucket)
      .upload(destinationPath, fileData, {
        upsert: true
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Generate the URL
    const { data: urlData } = supabase
      .storage
      .from(destinationBucket)
      .getPublicUrl(destinationPath);
    
    return {
      path: destinationPath,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Error copying file:', error);
    throw new Error(`Failed to copy file: ${error.message}`);
  }
}
```

## 1.3 Update Multi-Modal Utils

Replace the base64 fallback in `multiModalUtils.ts` with Supabase Storage integration.

### Current Implementation (with base64 fallback)

```typescript
// Current implementation with base64 fallback
export async function addImagesToMessages(messages: any[], options?: any) {
  // Process each message
  for (const message of messages) {
    if (message.image_url) {
      try {
        // Try to use the image URL directly
        // If it fails, fall back to base64 encoding
        // This is where truncation issues occur
      } catch (error) {
        // Base64 fallback causing truncation issues
      }
    }
  }
  return messages;
}
```

### Proposed Implementation (with Supabase Storage)

```typescript
import { uploadImage, getFileUrl } from './supabaseStorage';

/**
 * Adds images to messages for multi-modal LLM processing
 * @param messages The messages to process
 * @param options Processing options
 * @returns The processed messages with image URLs
 */
export async function addImagesToMessages(
  messages: any[],
  options?: {
    organizationId?: string;
    userId?: string;
    applicationId?: string;
    transformations?: {
      width?: number;
      height?: number;
      format?: 'webp' | 'jpeg' | 'jpg' | 'png';
      quality?: number;
    };
  }
) {
  const { organizationId, userId, applicationId, transformations } = options || {};
  
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
  
  // Process each message
  for (const message of messages) {
    if (message.image_url) {
      try {
        // Check if the image_url is already a URL
        if (message.image_url.startsWith('http')) {
          // If it's an external URL, fetch and store in Supabase
          const response = await fetch(message.image_url);
          const blob = await response.blob();
          
          // Generate a unique filename
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${blob.type.split('/')[1] || 'png'}`;
          
          // Upload the image to Supabase Storage
          const result = await uploadImage({
            file: blob,
            fileName,
            contentType: blob.type,
            pathOptions: {
              context,
              contextId,
              resourceType: 'chat-images',
              resourceId: message.id || Date.now().toString()
            },
            isPublic: true,
            transformations
          });
          
          // Update the message with the transformation URL
          message.image_url = result.transformationUrl;
        } else if (message.image_url.startsWith('data:')) {
          // If it's a base64 data URL, convert to blob and upload
          const base64Data = message.image_url.split(',')[1];
          const contentType = message.image_url.split(';')[0].split(':')[1];
          const blob = Buffer.from(base64Data, 'base64');
          
          // Generate a unique filename
          const extension = contentType.split('/')[1] || 'png';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
          
          // Upload the image to Supabase Storage
          const result = await uploadImage({
            file: blob,
            fileName,
            contentType,
            pathOptions: {
              context,
              contextId,
              resourceType: 'chat-images',
              resourceId: message.id || Date.now().toString()
            },
            isPublic: true,
            transformations
          });
          
          // Update the message with the transformation URL
          message.image_url = result.transformationUrl;
        }
      } catch (error) {
        console.error('Error processing image for message:', error);
        // Don't fall back to base64, just log the error and continue
        // This prevents truncation issues
      }
    }
  }
  
  return messages;
}
```

## Error Handling Strategy

Implement a consistent error handling strategy across all storage operations:

```typescript
/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  public readonly code: string;
  public readonly originalError: any;
  
  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.originalError = originalError;
  }
  
  /**
   * Creates a storage error from a Supabase error
   * @param error The Supabase error
   * @returns A StorageError instance
   */
  static fromSupabaseError(error: any): StorageError {
    let code = 'UNKNOWN_ERROR';
    let message = error.message || 'Unknown storage error';
    
    // Map Supabase error codes to our custom codes
    if (error.code === '23505') {
      code = 'DUPLICATE_FILE';
    } else if (error.code === '42501') {
      code = 'PERMISSION_DENIED';
    } else if (error.code === '413') {
      code = 'FILE_TOO_LARGE';
    } else if (error.statusCode === 404) {
      code = 'FILE_NOT_FOUND';
    }
    
    return new StorageError(message, code, error);
  }
}

/**
 * Wraps a storage operation with consistent error handling
 * @param operation The storage operation to execute
 * @returns The result of the operation
 */
export async function withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    
    throw StorageError.fromSupabaseError(error);
  }
}
```

## Implementation Steps

1. **Update `supabaseStorage.ts`**:
   - Implement the enhanced `generateStoragePath` function
   - Add comprehensive file operation methods
   - Implement error handling strategy

2. **Update `multiModalUtils.ts`**:
   - Replace base64 fallback with Supabase Storage integration
   - Ensure proper error handling
   - Add support for various image formats and sizes

3. **Create Unit Tests**:
   - Test path generation with various contexts
   - Test file operations with mock data
   - Test error handling scenarios

## Key Considerations

1. **Backward Compatibility**: Ensure existing code using the current storage functions continues to work
2. **Performance**: Optimize file operations for performance, especially for image transformations
3. **Error Handling**: Implement comprehensive error handling with meaningful error messages
4. **Security**: Ensure proper access control for all storage operations
5. **Multi-tenant Isolation**: Enforce strict tenant isolation in all storage operations 