# Storage Path Utilities

This document provides information about the path generation and validation utilities for the Supabase Storage integration in the Remodl AI platform.

## Overview

The storage path utilities are defined in `/packages/server/src/utils/storagePath.ts` and provide functions for generating consistent, secure, and organized storage paths for different contexts and resource types. These utilities ensure that files are stored in a structured manner and can be easily retrieved.

## Path Structure

Storage paths follow a consistent structure:

```
{contextType}/{contextId}/{resourceType}/{resourceId?}/{folderName?}/{filename}
```

Where:
- `contextType`: The type of context (user, organization, application, etc.)
- `contextId`: The ID of the context (user ID, organization ID, etc.)
- `resourceType`: The type of resource (profile_picture, document, image, etc.)
- `resourceId`: (Optional) The ID of the resource (if applicable)
- `folderName`: (Optional) A custom folder name
- `filename`: The name of the file, optionally with a UUID for uniqueness

## Core Functions

### `generateStoragePath`

The main function for generating storage paths based on provided options.

```typescript
import { generateStoragePath } from '../utils/storagePath';

const path = generateStoragePath({
  contextType: 'user',
  contextId: 'user-123',
  resourceType: 'image',
  includeUuid: true,
  originalFilename: 'photo.jpg'
});
// Result: 'user/user-123/image/photo_abc123.jpg'
```

#### Options

The `StoragePathOptions` interface defines the options for generating a storage path:

| Option | Type | Description |
|--------|------|-------------|
| `contextType` | string | The type of context (required) |
| `contextId` | string | The ID of the context (required) |
| `resourceType` | string | The type of resource (optional, defaults to 'other') |
| `resourceId` | string | The ID of the resource (optional) |
| `includeUuid` | boolean | Whether to include a UUID in the filename (optional, defaults to true) |
| `folderName` | string | A custom folder name to include in the path (optional) |
| `originalFilename` | string | The original filename to preserve (optional) |

### Path Validation

#### `isValidStoragePath`

Validates a storage path to ensure it meets requirements.

```typescript
import { isValidStoragePath } from '../utils/storagePath';

const isValid = isValidStoragePath('user/user-123/image/photo.jpg');
// Result: true
```

A valid path must:
- Not be empty
- Not contain invalid characters (`<>:"|?*` and control characters)
- Not start or end with a slash
- Not contain consecutive slashes
- Not be too long (max 1024 characters)

### Filename Utilities

#### `sanitizeFilename`

Sanitizes a filename to ensure it's safe for storage.

```typescript
import { sanitizeFilename } from '../utils/storagePath';

const sanitized = sanitizeFilename('My Photo (1).jpg');
// Result: 'My_Photo_1.jpg'
```

#### `generateUniqueFilename`

Generates a unique filename with a UUID.

```typescript
import { generateUniqueFilename } from '../utils/storagePath';

const unique = generateUniqueFilename('photo.jpg');
// Result: 'photo_abc123-def456-ghi789.jpg'
```

#### `getFileExtension`

Gets the file extension from a filename.

```typescript
import { getFileExtension } from '../utils/storagePath';

const extension = getFileExtension('photo.jpg');
// Result: '.jpg'
```

### Path Extraction

#### `getFilenameFromPath`

Extracts the filename from a storage path.

```typescript
import { getFilenameFromPath } from '../utils/storagePath';

const filename = getFilenameFromPath('user/user-123/image/photo.jpg');
// Result: 'photo.jpg'
```

#### `getDirPathFromPath`

Extracts the directory path from a storage path.

```typescript
import { getDirPathFromPath } from '../utils/storagePath';

const dirPath = getDirPathFromPath('user/user-123/image/photo.jpg');
// Result: 'user/user-123/image'
```

## Context-Specific Path Generators

The following functions generate storage paths for specific contexts:

### `generateUserStoragePath`

Generates a storage path for a user context.

```typescript
import { generateUserStoragePath } from '../utils/storagePath';

const path = generateUserStoragePath('user-123', 'image', {
  originalFilename: 'photo.jpg'
});
// Result: 'user/user-123/image/photo_abc123.jpg'
```

### `generateOrganizationStoragePath`

Generates a storage path for an organization context.

```typescript
import { generateOrganizationStoragePath } from '../utils/storagePath';

const path = generateOrganizationStoragePath('org-123', 'document', {
  originalFilename: 'report.pdf'
});
// Result: 'organization/org-123/document/report_abc123.pdf'
```

### `generateApplicationStoragePath`

Generates a storage path for an application context.

```typescript
import { generateApplicationStoragePath } from '../utils/storagePath';

const path = generateApplicationStoragePath('app-123', 'image', {
  originalFilename: 'logo.png'
});
// Result: 'application/app-123/image/logo_abc123.png'
```

### `generateChatflowStoragePath`

Generates a storage path for a chatflow context.

```typescript
import { generateChatflowStoragePath } from '../utils/storagePath';

const path = generateChatflowStoragePath('flow-123', 'document', {
  originalFilename: 'transcript.txt'
});
// Result: 'chatflow/flow-123/document/transcript_abc123.txt'
```

### `generateDocumentStoragePath`

Generates a storage path for a document context.

```typescript
import { generateDocumentStoragePath } from '../utils/storagePath';

const path = generateDocumentStoragePath('doc-123', 'document', {
  originalFilename: 'attachment.pdf'
});
// Result: 'document/doc-123/document/attachment_abc123.pdf'
```

### `generatePlatformStoragePath`

Generates a storage path for a platform context.

```typescript
import { generatePlatformStoragePath } from '../utils/storagePath';

const path = generatePlatformStoragePath('image', {
  originalFilename: 'logo.png'
});
// Result: 'platform/global/image/logo_abc123.png'
```

## Virtual Paths

Virtual paths are used for organizing files in the UI and are separate from the actual storage paths.

### `generateVirtualPath`

Generates a virtual path for organizing files in the UI.

```typescript
import { generateVirtualPath } from '../utils/storagePath';

const virtualPath = generateVirtualPath('Marketing', 'Campaigns', '2025');
// Result: 'Marketing/Campaigns/2025'
```

## Best Practices

1. **Use context-specific generators**: Use the context-specific path generators whenever possible to ensure consistent path structures.

2. **Include UUIDs for uniqueness**: Always include UUIDs in filenames to prevent collisions, especially for user-uploaded files.

3. **Sanitize user input**: Always sanitize any user-provided input (filenames, folder names) before using them in paths.

4. **Validate paths**: Validate generated paths to ensure they meet the requirements for Supabase Storage.

5. **Keep paths organized**: Follow the context/resource type structure to keep files organized and easily retrievable.

## Example: Complete Path Generation

```typescript
import { 
  generateUserStoragePath,
  generateVirtualPath,
  FILE_RESOURCE_TYPES
} from '../utils/storagePath';

// Generate a storage path for a user's profile picture
const storagePath = generateUserStoragePath(
  'user-123',
  FILE_RESOURCE_TYPES.PROFILE_PICTURE,
  {
    originalFilename: 'profile.jpg',
    includeUuid: true
  }
);
// Result: 'user/user-123/profile_picture/profile_abc123.jpg'

// Generate a virtual path for UI organization
const virtualPath = generateVirtualPath('Profile', 'Pictures');
// Result: 'Profile/Pictures'

// Store both paths in the database
await createFileMetadata({
  // ...other properties
  path: storagePath,
  virtual_path: virtualPath
});
``` 