# Storage Constants

This document provides information about the constants used in the Supabase Storage integration for the Remodl AI platform.

## Overview

The storage constants are defined in `/packages/server/src/constants/storage.ts` and provide standardized values for various aspects of file storage, including bucket names, access levels, context types, resource types, file size limits, allowed file extensions, MIME types, and URL expiration times.

## Storage Buckets

The `STORAGE_BUCKETS` object defines the names of the storage buckets used in the system:

| Bucket Name | Description |
|-------------|-------------|
| `PUBLIC` | Publicly accessible files |
| `PROFILES` | User profile pictures |
| `PLATFORM` | Platform-level files |
| `APPS` | Application-specific files |
| `ORGANIZATIONS` | Organization-specific files |
| `USER_FILES` | User-specific files |

Example usage:
```typescript
import { STORAGE_BUCKETS } from '../constants/storage';

// Upload a file to the public bucket
await uploadFile(STORAGE_BUCKETS.PUBLIC, 'path/to/file', fileBuffer, options);
```

## File Access Levels

The `FILE_ACCESS_LEVELS` object defines the different access levels for files:

| Access Level | Description |
|--------------|-------------|
| `PRIVATE` | Only accessible to the owner |
| `RESTRICTED` | Accessible to specific users/roles |
| `ORGANIZATION` | Accessible to all members of an organization |
| `APPLICATION` | Accessible to all users of an application |
| `PUBLIC` | Accessible to anyone |

Example usage:
```typescript
import { FILE_ACCESS_LEVELS } from '../constants/storage';

// Create file metadata with organization-level access
await createFileMetadata({
  // ...other properties
  access_level: FILE_ACCESS_LEVELS.ORGANIZATION
});
```

## Context Types

The `FILE_CONTEXT_TYPES` object defines the different contexts that files can be associated with:

| Context Type | Description |
|--------------|-------------|
| `USER` | Files associated with a user |
| `ORGANIZATION` | Files associated with an organization |
| `APPLICATION` | Files associated with an application |
| `CHATFLOW` | Files associated with a chatflow |
| `DOCUMENT` | Files associated with a document |
| `PLATFORM` | Files associated with the platform |

Example usage:
```typescript
import { FILE_CONTEXT_TYPES } from '../constants/storage';

// Create file metadata for a user context
await createFileMetadata({
  // ...other properties
  context_type: FILE_CONTEXT_TYPES.USER,
  context_id: userId
});
```

## Resource Types

The `FILE_RESOURCE_TYPES` object defines the different types of resources that files can represent:

| Resource Type | Description |
|---------------|-------------|
| `PROFILE_PICTURE` | Profile pictures |
| `DOCUMENT` | Document attachments |
| `IMAGE` | Image files |
| `VIDEO` | Video files |
| `AUDIO` | Audio files |
| `DATA` | Data files (CSV, JSON, etc.) |
| `ARCHIVE` | Archive files (ZIP, TAR, etc.) |
| `OTHER` | Other file types |

Example usage:
```typescript
import { FILE_RESOURCE_TYPES } from '../constants/storage';

// Create file metadata for a profile picture
await createFileMetadata({
  // ...other properties
  resource_type: FILE_RESOURCE_TYPES.PROFILE_PICTURE
});
```

## File Size Limits

The `FILE_SIZE_LIMITS` object defines the maximum file size limits (in bytes) for different types of files:

| Limit Type | Size (bytes) | Description |
|------------|--------------|-------------|
| `DEFAULT` | 52,428,800 | Default file size limit (50MB) |
| `IMAGE` | 10,485,760 | Image file size limit (10MB) |
| `DOCUMENT` | 26,214,400 | Document file size limit (25MB) |
| `PROFILE_PICTURE` | 5,242,880 | Profile picture size limit (5MB) |

Example usage:
```typescript
import { FILE_SIZE_LIMITS } from '../constants/storage';

// Check if a file exceeds the size limit
if (fileSize > FILE_SIZE_LIMITS.IMAGE) {
  throw new Error(`File size exceeds the maximum allowed size of ${FILE_SIZE_LIMITS.IMAGE} bytes`);
}
```

## Allowed File Extensions

The `ALLOWED_FILE_EXTENSIONS` object defines the allowed file extensions for different resource types:

| Resource Type | Allowed Extensions |
|---------------|-------------------|
| `IMAGE` | .jpg, .jpeg, .png, .gif, .webp, .svg |
| `DOCUMENT` | .pdf, .doc, .docx, .txt, .rtf, .md, .csv, .xls, .xlsx, .ppt, .pptx |
| `AUDIO` | .mp3, .wav, .ogg, .m4a, .flac |
| `VIDEO` | .mp4, .webm, .mov, .avi |
| `DATA` | .json, .csv, .xml, .yaml, .yml |
| `ARCHIVE` | .zip, .tar, .gz, .rar |

Example usage:
```typescript
import { ALLOWED_FILE_EXTENSIONS, FILE_RESOURCE_TYPES } from '../constants/storage';

// Check if a file extension is allowed for a specific resource type
const isAllowed = ALLOWED_FILE_EXTENSIONS[FILE_RESOURCE_TYPES.IMAGE].includes(fileExtension);
```

## MIME Types

The `FILE_MIME_TYPES` object maps file extensions to their corresponding MIME types:

Example usage:
```typescript
import { FILE_MIME_TYPES } from '../constants/storage';

// Get the MIME type for a file extension
const mimeType = FILE_MIME_TYPES['.jpg']; // 'image/jpeg'
```

## Virtual Path Separator

The `VIRTUAL_PATH_SEPARATOR` constant defines the separator used for virtual paths:

```typescript
import { VIRTUAL_PATH_SEPARATOR } from '../constants/storage';

// Create a virtual path
const virtualPath = `${organizationId}${VIRTUAL_PATH_SEPARATOR}${folderName}`;
```

## Signed URL Expiration

The `SIGNED_URL_EXPIRATION` object defines the default expiration times (in seconds) for signed URLs:

| Expiration Type | Duration (seconds) | Description |
|-----------------|-------------------|-------------|
| `SHORT` | 300 | Short-lived URL (5 minutes) |
| `MEDIUM` | 3,600 | Medium-lived URL (1 hour) |
| `LONG` | 86,400 | Long-lived URL (24 hours) |

Example usage:
```typescript
import { SIGNED_URL_EXPIRATION } from '../constants/storage';

// Create a signed URL that expires in 1 hour
const signedUrl = await getSignedUrl(bucket, path, SIGNED_URL_EXPIRATION.MEDIUM);
``` 