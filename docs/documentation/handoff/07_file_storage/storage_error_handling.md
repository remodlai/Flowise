# Storage Error Handling

This document provides information about the error handling system for the Supabase Storage integration in the Remodl AI platform.

## StorageError Class

The `StorageError` class extends the platform's `InternalFlowiseError` class to provide specialized error handling for storage operations. It includes specific error codes and utility functions to create consistent error messages.

### Error Codes

The `StorageErrorCode` enum defines the following error codes:

| Error Code | Description |
|------------|-------------|
| `FILE_NOT_FOUND` | The requested file could not be found |
| `PERMISSION_DENIED` | The user does not have permission to access the file |
| `UPLOAD_FAILED` | The file upload operation failed |
| `DOWNLOAD_FAILED` | The file download operation failed |
| `DELETE_FAILED` | The file deletion operation failed |
| `INVALID_FILE` | The file is invalid or corrupted |
| `QUOTA_EXCEEDED` | The user's storage quota has been exceeded |
| `FILE_ALREADY_EXISTS` | A file with the same name already exists at the specified path |
| `INVALID_OPERATION` | The requested operation is invalid |
| `BUCKET_NOT_FOUND` | The specified storage bucket could not be found |
| `STORAGE_ERROR` | A generic storage error occurred |

### Usage

#### Basic Usage

```typescript
import { StorageError, StorageErrorCode } from '../errors/storageError';

// Create a new StorageError
const error = new StorageError(
  StorageErrorCode.FILE_NOT_FOUND,
  'File with ID abc123 not found',
  undefined, // Optional: custom HTTP status code
  { fileId: 'abc123' } // Optional: additional details
);

// Throw the error
throw error;
```

#### Using Utility Functions

The storage error module includes utility functions to create common error types:

```typescript
import { 
  createFileNotFoundError,
  createPermissionDeniedError,
  createUploadFailedError,
  // ... other utility functions
} from '../errors/storageError/utils';

// Create a file not found error
throw createFileNotFoundError('abc123');

// Create a permission denied error
throw createPermissionDeniedError('abc123', 'user456');

// Create an upload failed error
throw createUploadFailedError('Network connection lost');
```

#### Converting Generic Errors

You can convert generic errors to StorageError instances:

```typescript
import { convertToStorageError } from '../errors/storageError/utils';

try {
  // Some storage operation
  await supabaseClient.storage.from('bucket').upload(...);
} catch (error) {
  // Convert to StorageError and throw
  throw convertToStorageError(error, 'Failed to upload file');
}
```

### HTTP Status Codes

The `StorageError` class automatically maps error codes to appropriate HTTP status codes:

| Error Code | HTTP Status Code |
|------------|------------------|
| `FILE_NOT_FOUND` | 404 (Not Found) |
| `BUCKET_NOT_FOUND` | 404 (Not Found) |
| `PERMISSION_DENIED` | 403 (Forbidden) |
| `QUOTA_EXCEEDED` | 413 (Request Entity Too Large) |
| `FILE_ALREADY_EXISTS` | 409 (Conflict) |
| `INVALID_FILE` | 400 (Bad Request) |
| `INVALID_OPERATION` | 400 (Bad Request) |
| Other codes | 500 (Internal Server Error) |

## Error Handling Best Practices

1. **Use specific error types**: Always use the most specific error type for the situation.
2. **Include relevant details**: Add context information to help with debugging.
3. **Consistent error handling**: Use try/catch blocks with the `convertToStorageError` function.
4. **Proper error propagation**: Let errors bubble up to the appropriate handler.

### Example: Complete Error Handling

```typescript
import { 
  createFileNotFoundError,
  createUploadFailedError,
  convertToStorageError
} from '../errors/storageError/utils';

async function uploadUserFile(userId: string, fileData: Buffer, fileName: string) {
  try {
    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Generate file path
    const filePath = `users/${userId}/${fileName}`;
    
    // Check if file already exists
    const existingFile = await getFileByPath(filePath);
    if (existingFile) {
      throw createFileAlreadyExistsError(fileName, filePath);
    }
    
    // Upload file
    try {
      const result = await supabaseClient.storage
        .from('user-files')
        .upload(filePath, fileData);
        
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    } catch (error) {
      throw createUploadFailedError(`Failed to upload ${fileName}: ${error.message}`);
    }
  } catch (error) {
    // Convert any unhandled errors to StorageError
    if (!(error instanceof StorageError)) {
      throw convertToStorageError(error);
    }
    throw error;
  }
}
```

## Integration with Express Error Handler

The StorageError class integrates with the platform's existing error handling middleware. When a StorageError is thrown, it will be caught by the error handler middleware and returned to the client with the appropriate status code and error message.

```typescript
// Example of error handler middleware integration
app.use((err, req, res, next) => {
  if (err instanceof StorageError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }
  
  // Handle other error types
  next(err);
});
``` 