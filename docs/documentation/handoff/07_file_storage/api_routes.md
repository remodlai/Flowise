# Storage API Routes

This document provides information about the API routes for the Supabase Storage integration in the Remodl AI platform.

## Overview

The storage API routes are defined in `/packages/server/src/routes/storage/index.ts` and provide endpoints for managing files in Supabase Storage.

## Authentication

All storage API routes require authentication. The routes use the `authorize` middleware to check if the user has the required permissions.

## Error Handling

All storage API routes use a common error handling mechanism. If an error occurs, the response will include an error message and an appropriate HTTP status code.

## API Endpoints

### Upload a File

```
POST /api/storage/upload
```

Upload a file to Supabase Storage.

#### Request

- **Headers**
  - `Content-Type`: `multipart/form-data`
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Body**
  - `file`: The file to upload (required)
  - `bucket`: The bucket to upload to (optional, defaults to `USER_FILES`)
  - `contextType`: The type of context (optional, defaults to `USER`)
  - `contextId`: The ID of the context (optional, defaults to the user ID)
  - `resourceType`: The type of resource (optional, defaults to `DOCUMENT`)
  - `resourceId`: The ID of the resource (optional)
  - `isPublic`: Whether the file is publicly accessible (optional, defaults to `false`)
  - `accessLevel`: The access level of the file (optional)
  - `metadata`: Custom metadata for the file (optional, JSON string)
  - `path_tokens`: Virtual path for organizing files in the UI (optional, array of strings)
  - `name`: Custom name for the file (optional, defaults to the original filename)
  - `contentType`: Custom content type for the file (optional, defaults to the file's MIME type)

#### Response

- **Success (201 Created)**
  ```json
  {
    "success": true,
    "file": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "document.pdf",
      "content_type": "application/pdf",
      "size": 1024,
      "url": "https://example.com/storage/v1/object/public/user-files/path/to/document.pdf",
      "context_type": "user",
      "context_id": "user-123",
      "resource_type": "document",
      "resource_id": null,
      "is_public": false,
      "access_level": null,
      "created_at": "2025-03-11T12:00:00.000Z",
      "created_by": "user-123",
      "updated_at": "2025-03-11T12:00:00.000Z",
      "metadata": {
        "description": "Important document"
      },
      "path_tokens": ["documents", "important"]
    },
    "url": "https://example.com/storage/v1/object/public/user-files/path/to/document.pdf"
  }
  ```

- **Error (400 Bad Request)**
  ```json
  {
    "error": "No file provided"
  }
  ```

### Upload a User File

```
POST /api/storage/user/:userId/upload
```

Upload a file for a specific user.

#### Request

- **Headers**
  - `Content-Type`: `multipart/form-data`
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `userId`: The ID of the user

- **Body**
  - `file`: The file to upload (required)
  - `resourceType`: The type of resource (optional, defaults to `DOCUMENT`)
  - `resourceId`: The ID of the resource (optional)
  - `isPublic`: Whether the file is publicly accessible (optional, defaults to `false`)
  - `accessLevel`: The access level of the file (optional)
  - `metadata`: Custom metadata for the file (optional, JSON string)
  - `path_tokens`: Virtual path for organizing files in the UI (optional, array of strings)
  - `name`: Custom name for the file (optional, defaults to the original filename)
  - `contentType`: Custom content type for the file (optional, defaults to the file's MIME type)

#### Response

Same as the `/api/storage/upload` endpoint.

### Upload an Organization File

```
POST /api/storage/organization/:orgId/upload
```

Upload a file for a specific organization.

#### Request

- **Headers**
  - `Content-Type`: `multipart/form-data`
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `orgId`: The ID of the organization

- **Body**
  - `file`: The file to upload (required)
  - `resourceType`: The type of resource (optional, defaults to `DOCUMENT`)
  - `resourceId`: The ID of the resource (optional)
  - `isPublic`: Whether the file is publicly accessible (optional, defaults to `false`)
  - `accessLevel`: The access level of the file (optional)
  - `metadata`: Custom metadata for the file (optional, JSON string)
  - `path_tokens`: Virtual path for organizing files in the UI (optional, array of strings)
  - `name`: Custom name for the file (optional, defaults to the original filename)
  - `contentType`: Custom content type for the file (optional, defaults to the file's MIME type)

#### Response

Same as the `/api/storage/upload` endpoint.

### Upload an Application File

```
POST /api/storage/application/:appId/upload
```

Upload a file for a specific application.

#### Request

- **Headers**
  - `Content-Type`: `multipart/form-data`
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `appId`: The ID of the application

- **Body**
  - `file`: The file to upload (required)
  - `resourceType`: The type of resource (optional, defaults to `DOCUMENT`)
  - `resourceId`: The ID of the resource (optional)
  - `isPublic`: Whether the file is publicly accessible (optional, defaults to `false`)
  - `accessLevel`: The access level of the file (optional)
  - `metadata`: Custom metadata for the file (optional, JSON string)
  - `path_tokens`: Virtual path for organizing files in the UI (optional, array of strings)
  - `name`: Custom name for the file (optional, defaults to the original filename)
  - `contentType`: Custom content type for the file (optional, defaults to the file's MIME type)

#### Response

Same as the `/api/storage/upload` endpoint.

### Get a File URL

```
GET /api/storage/file/:fileId/url
```

Get a file URL (public or signed).

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `fileId`: The ID of the file

- **Query Parameters**
  - `signed`: Whether to create a signed URL (optional, defaults to `false`)
  - `expiresIn`: Expiration time in seconds for signed URLs (optional)
  - `download`: Download options for signed URLs (optional)
  - `transform`: Transform options for images (optional, JSON string)

#### Response

- **Success (200 OK)**
  ```json
  {
    "success": true,
    "url": "https://example.com/storage/v1/object/public/user-files/path/to/document.pdf"
  }
  ```

- **Error (404 Not Found)**
  ```json
  {
    "error": "File not found"
  }
  ```

### Download a File

```
GET /api/storage/file/:fileId/download
```

Download a file from Supabase Storage.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `fileId`: The ID of the file

#### Response

- **Success (200 OK)**
  The file content with appropriate headers:
  - `Content-Type`: The file's content type
  - `Content-Disposition`: `attachment; filename="filename.ext"`
  - `Content-Length`: The file size in bytes

- **Error (404 Not Found)**
  ```json
  {
    "error": "File not found"
  }
  ```

### Delete a File

```
DELETE /api/storage/file/:fileId
```

Delete a file from Supabase Storage.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `fileId`: The ID of the file

#### Response

- **Success (200 OK)**
  ```json
  {
    "success": true,
    "deleted": true
  }
  ```

- **Error (404 Not Found)**
  ```json
  {
    "error": "File not found"
  }
  ```

### List Files

```
GET /api/storage/files
```

List files based on various criteria.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Query Parameters**
  - `limit`: Maximum number of files to return (optional, defaults to `10`)
  - `offset`: Offset for pagination (optional, defaults to `0`)
  - `sortBy`: Column to sort by (optional)
  - `sortOrder`: Sort order (`asc` or `desc`, optional, defaults to `asc`)
  - `contextType`: Filter by context type (optional)
  - `contextId`: Filter by context ID (optional)
  - `resourceType`: Filter by resource type (optional)
  - `resourceId`: Filter by resource ID (optional)
  - `isPublic`: Filter by public status (optional)
  - `path_tokens`: Filter by path tokens (optional, array of strings)

#### Response

- **Success (200 OK)**
  ```json
  {
    "success": true,
    "files": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "document.pdf",
        "content_type": "application/pdf",
        "size": 1024,
        "url": "https://example.com/storage/v1/object/public/user-files/path/to/document.pdf",
        "context_type": "user",
        "context_id": "user-123",
        "resource_type": "document",
        "resource_id": null,
        "is_public": false,
        "access_level": null,
        "created_at": "2025-03-11T12:00:00.000Z",
        "created_by": "user-123",
        "updated_at": "2025-03-11T12:00:00.000Z",
        "metadata": {
          "description": "Important document"
        },
        "path_tokens": ["documents", "important"]
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
  ```

### Update a File

```
PATCH /api/storage/file/:fileId
```

Update a file's metadata.

#### Request

- **Headers**
  - `Content-Type`: `application/json`
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `fileId`: The ID of the file

- **Body**
  ```json
  {
    "name": "updated-document.pdf",
    "contentType": "application/pdf",
    "isPublic": true,
    "accessLevel": "read",
    "metadata": {
      "description": "Updated description"
    },
    "path_tokens": ["documents", "public"]
  }
  ```

#### Response

- **Success (200 OK)**
  ```json
  {
    "success": true,
    "file": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "updated-document.pdf",
      "content_type": "application/pdf",
      "size": 1024,
      "url": "https://example.com/storage/v1/object/public/user-files/path/to/updated-document.pdf",
      "context_type": "user",
      "context_id": "user-123",
      "resource_type": "document",
      "resource_id": null,
      "is_public": true,
      "access_level": "read",
      "created_at": "2025-03-11T12:00:00.000Z",
      "created_by": "user-123",
      "updated_at": "2025-03-11T12:30:00.000Z",
      "metadata": {
        "description": "Updated description"
      },
      "path_tokens": ["documents", "public"]
    }
  }
  ```

- **Error (404 Not Found)**
  ```json
  {
    "error": "File not found"
  }
  ```

### Search Files

```
GET /api/storage/search
```

Search for files based on a search term.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Query Parameters**
  - `q`: Search query (required)
  - `limit`: Maximum number of files to return (optional, defaults to `10`)
  - `offset`: Offset for pagination (optional, defaults to `0`)
  - `contextType`: Filter by context type (optional)
  - `contextId`: Filter by context ID (optional)
  - `resourceType`: Filter by resource type (optional)
  - `resourceId`: Filter by resource ID (optional)
  - `isPublic`: Filter by public status (optional)
  - `path_tokens`: Filter by path tokens (optional, array of strings)

#### Response

- **Success (200 OK)**
  ```json
  {
    "success": true,
    "files": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "document.pdf",
        "content_type": "application/pdf",
        "size": 1024,
        "url": "https://example.com/storage/v1/object/public/user-files/path/to/document.pdf",
        "context_type": "user",
        "context_id": "user-123",
        "resource_type": "document",
        "resource_id": null,
        "is_public": false,
        "access_level": null,
        "created_at": "2025-03-11T12:00:00.000Z",
        "created_by": "user-123",
        "updated_at": "2025-03-11T12:00:00.000Z",
        "metadata": {
          "description": "Important document"
        },
        "path_tokens": ["documents", "important"]
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
  ```

- **Error (400 Bad Request)**
  ```json
  {
    "error": "Search query is required"
  }
  ```

### Move a File

```
PATCH /api/storage/file/:fileId/move
```

Move a file to a new virtual path.

#### Request

- **Headers**
  - `Content-Type`: `application/json`
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `fileId`: The ID of the file

- **Body**
  ```json
  {
    "path_tokens": ["documents", "important", "2025"]
  }
  ```

#### Response

- **Success (200 OK)**
  ```json
  {
    "success": true,
    "file": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "document.pdf",
      "content_type": "application/pdf",
      "size": 1024,
      "url": "https://example.com/storage/v1/object/public/user-files/path/to/document.pdf",
      "context_type": "user",
      "context_id": "user-123",
      "resource_type": "document",
      "resource_id": null,
      "is_public": false,
      "access_level": null,
      "created_at": "2025-03-11T12:00:00.000Z",
      "created_by": "user-123",
      "updated_at": "2025-03-11T12:30:00.000Z",
      "metadata": {
        "description": "Important document"
      },
      "path_tokens": ["documents", "important", "2025"]
    }
  }
  ```

- **Error (400 Bad Request)**
  ```json
  {
    "error": "Path tokens are required"
  }
  ```

### Copy a File

```
POST /api/storage/file/:fileId/copy
```

Copy a file to a new location.

#### Request

- **Headers**
  - `Content-Type`: `application/json`
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

- **Path Parameters**
  - `fileId`: The ID of the file

- **Body**
  ```json
  {
    "name": "copy-document.pdf",
    "contentType": "application/pdf",
    "contextType": "organization",
    "contextId": "org-456",
    "resourceType": "document",
    "resourceId": null,
    "isPublic": true,
    "accessLevel": null,
    "metadata": {
      "description": "Copy of important document"
    },
    "path_tokens": ["documents", "shared"]
  }
  ```

#### Response

- **Success (201 Created)**
  ```json
  {
    "success": true,
    "file": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "copy-document.pdf",
      "content_type": "application/pdf",
      "size": 1024,
      "url": "https://example.com/storage/v1/object/public/organization-files/path/to/copy-document.pdf",
      "context_type": "organization",
      "context_id": "org-456",
      "resource_type": "document",
      "resource_id": null,
      "is_public": true,
      "access_level": null,
      "created_at": "2025-03-11T12:30:00.000Z",
      "created_by": "user-123",
      "updated_at": "2025-03-11T12:30:00.000Z",
      "metadata": {
        "description": "Copy of important document"
      },
      "path_tokens": ["documents", "shared"]
    },
    "url": "https://example.com/storage/v1/object/public/organization-files/path/to/copy-document.pdf"
  }
  ```

- **Error (404 Not Found)**
  ```