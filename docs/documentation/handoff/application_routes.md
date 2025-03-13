# Application API Routes and Controller

This document provides information about the API routes and controller methods for managing applications in the Remodl AI platform.

## Overview

The application API routes are defined in `/packages/server/src/routes/api.ts` and provide endpoints for managing applications. The controller methods are implemented in `/packages/server/src/controllers/ApplicationController.ts`.

## Authentication

All application API routes require authentication. The routes use the `authenticateUser` middleware to verify the user's JWT token.

## API Endpoints

### Get All Applications

```
GET /applications
```

Get a list of all applications the user has access to.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `x-organization-id`: Organization ID (optional)
  - `x-application-id`: Application ID (optional)

#### Response

- **Success (200 OK)**
  ```json
  {
    "applications": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "My Application",
        "description": "Description of my application",
        "logo_url": "https://example.com/storage/v1/object/public/applications/123e4567-e89b-12d3-a456-426614174000/assets/logos/logo.png",
        "url": "https://myapp.example.com",
        "version": "1.0.0",
        "type": "web",
        "status": "active"
      }
    ]
  }
  ```

### Create a New Application

```
POST /applications/create
```

Create a new application.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `Content-Type`: `application/json`

- **Body**
  ```json
  {
    "name": "My Application",
    "description": "Description of my application"
  }
  ```

#### Response

- **Success (200 OK)**
  ```json
  {
    "application": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Application",
      "description": "Description of my application",
      "created_at": "2025-03-13T12:00:00.000Z"
    }
  }
  ```

### Get Application by ID

```
GET /applications/:appId
```

Get details for a specific application.

#### Request

- **Headers**
  - `Authorization`: Bearer token

- **Path Parameters**
  - `appId`: The ID of the application

#### Response

- **Success (200 OK)**
  ```json
  {
    "application": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Application",
      "description": "Description of my application",
      "logo_url": "https://example.com/storage/v1/object/public/applications/123e4567-e89b-12d3-a456-426614174000/assets/logos/logo.png",
      "url": "https://myapp.example.com",
      "version": "1.0.0",
      "type": "web",
      "status": "active",
      "created_at": "2025-03-13T12:00:00.000Z",
      "updated_at": "2025-03-13T12:00:00.000Z"
    }
  }
  ```

- **Error (404 Not Found)**
  ```json
  {
    "error": "Application not found"
  }
  ```

### Update an Application

```
PUT /applications/update/:appId
```

Update an existing application.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `Content-Type`: `application/json`

- **Path Parameters**
  - `appId`: The ID of the application

- **Body**
  ```json
  {
    "name": "Updated Application Name",
    "description": "Updated description"
  }
  ```

#### Response

- **Success (200 OK)**
  ```json
  {
    "application": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Updated Application Name",
      "description": "Updated description",
      "updated_at": "2025-03-13T12:30:00.000Z"
    }
  }
  ```

- **Error (404 Not Found)**
  ```json
  {
    "error": "Application not found"
  }
  ```

### Delete an Application

```
DELETE /applications/delete/:appId
```

Delete an application.

#### Request

- **Headers**
  - `Authorization`: Bearer token

- **Path Parameters**
  - `appId`: The ID of the application

#### Response

- **Success (200 OK)**
  ```json
  {
    "success": true
  }
  ```

- **Error (404 Not Found)**
  ```json
  {
    "error": "Application not found"
  }
  ```

### Get User Applications

```
GET /user/:userId/applications/all
```

Get all applications for a specific user.

#### Request

- **Headers**
  - `Authorization`: Bearer token

- **Path Parameters**
  - `userId`: The ID of the user

#### Response

- **Success (200 OK)**
  ```json
  [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "My Application",
      "description": "Description of my application",
      "logo_url": "https://example.com/storage/v1/object/public/applications/123e4567-e89b-12d3-a456-426614174000/assets/logos/logo.png",
      "url": "https://myapp.example.com",
      "version": "1.0.0",
      "type": "web",
      "status": "active",
      "is_admin": true
    }
  ]
  ```

### Upload Application Logo

```
POST /applications/:appId/assets/logo/upload
```

Upload a logo for an application.

#### Request

- **Headers**
  - `Authorization`: Bearer token
  - `Content-Type`: `multipart/form-data`

- **Path Parameters**
  - `appId`: The ID of the application

- **Body**
  - `file`: The logo file to upload (required)
  - `isPublic`: Whether the file is publicly accessible (optional, defaults to `true`)
  - `isShareable`: Whether the file is shareable (optional, defaults to `false`)

#### File Requirements
- Must be an image file (PNG or SVG)
- JPEGs are not supported as they don't have transparent backgrounds

#### Response

- **Success (201 Created)**
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "url": "https://example.com/storage/v1/object/public/applications/123e4567-e89b-12d3-a456-426614174000/assets/logos/logo.png",
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "logo.png",
      "content_type": "image/png",
      "size": 1024,
      "url": "https://example.com/storage/v1/object/public/applications/123e4567-e89b-12d3-a456-426614174000/assets/logos/logo.png",
      "bucket": "applications",
      "path_tokens": ["123e4567-e89b-12d3-a456-426614174000", "assets", "logos"],
      "context_type": "application",
      "context_id": "123e4567-e89b-12d3-a456-426614174000",
      "resource_type": "image",
      "is_public": true,
      "access_level": "public",
      "created_at": "2025-03-13T12:00:00.000Z",
      "created_by": "user-123",
      "description": "Logo for My Application",
      "is_shareable": false,
      "is_deleted": false
    }
  }
  ```

- **Error (400 Bad Request)**
  ```json
  {
    "success": false,
    "message": "No file uploaded"
  }
  ```

  ```json
  {
    "success": false,
    "message": "File must be an image"
  }
  ```

  ```json
  {
    "success": false,
    "message": "File must be a PNG, or svg image. Jpegs don't have a transparent background and are not supported."
  }
  ```

- **Error (403 Forbidden)**
  ```json
  {
    "success": false,
    "message": "Forbidden - Missing required permission: image.create"
  }
  ```

- **Error (404 Not Found)**
  ```json
  {
    "success": false,
    "message": "Application not found by name. Please check the appId and try again, or update the application metadata"
  }
  ```

## Controller Methods

The `ApplicationController` class in `/packages/server/src/controllers/ApplicationController.ts` implements the following methods:

### getAllApplications

Gets all applications the user has access to. Uses a direct SQL query to bypass RLS policies.

### getApplicationById

Gets details for a specific application by ID.

### getUserApplications

Gets all applications for a specific user. Adds an `is_admin` flag to each application based on the user's roles.

### createApplication

Creates a new application with the specified name and description.

### updateApplication

Updates an existing application with the specified name and description.

### uploadApplicationLogo

Uploads a logo for an application. The logo is stored in Supabase Storage in the `applications` bucket under the path `{appId}/assets/logos/{filename}`. The file metadata is stored in the `files` table.

### deleteApplication

Deletes an application by ID.

## Permission Model

Access to application endpoints is controlled by the following permissions:

1. **Platform Admin**
   - Can access all applications
   - Can create, update, and delete any application
   - Can upload logos for any application

2. **Application Admin/Owner**
   - Can access applications they are an admin of
   - Can update applications they are an admin of
   - Can upload logos for applications they are an admin of

3. **Regular User**
   - Can access applications they have access to
   - Cannot create, update, or delete applications
   - Cannot upload logos for applications

## Error Handling

All application API routes use a common error handling mechanism. If an error occurs, the response will include an error message and an appropriate HTTP status code. 