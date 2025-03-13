# User Routes and Controller Documentation

## Overview

This document provides comprehensive documentation for the User API routes and controller methods in the Remodl AI platform. The user management system supports multi-tenant architecture with context-based access control, allowing users to be managed at different scope levels:

1. **Global scope** - Platform-wide user management
2. **Organization scope** - Organization-specific user management
3. **Application scope** - Application-specific user management

The system also supports service users, which are special user accounts used for automated tasks and system operations.

## Recent Changes (March 2025)

### 1. Platform Admin Role Detection Fix

- Updated the logic to correctly identify platform admin users based on their role
- Added check for `role === 'platform_admin'` when determining platform admin status
- Standardized the approach across all user retrieval methods
- Improved naming consistency by using camelCase for all response fields

### 2. Enhanced Organization Mapping

- Added logic to populate the organizations array when it's empty but organization info exists
- Ensures consistent organization data format across all user endpoints
- Applied to all user retrieval methods (getAllUsers, getAllServiceUsers, getUserById)

### 3. Consolidated Organization Member Methods

- Combined `updateOrganizationMember` and `updateOrganizationMemberRole` into a single method
- Added detection of admin role updates based on request path or query parameters
- Improved response format to include information about the operation type

### 4. Enhanced User Retrieval with Auth Admin API

- Replaced direct queries to `auth.users` table with Supabase Auth Admin API
- Implemented in-memory filtering for application and organization scopes
- Added support for multiple metadata formats for application and organization IDs
- Improved error handling with proper try/catch blocks

### 5. Standardized API Routes

- Changed user routes from `/global/users` to `/platform/users` for consistency
- Removed `/create` suffixes from POST endpoints
- Simplified update and delete routes to use consistent patterns
- Standardized user routes to use `/users/:userId` consistently
- Made application and organization routes follow the same pattern
- Ensured service user routes follow the same pattern across different contexts

## API Endpoints

### Global User Routes

```
GET    /api/v1/platform/users                 - Get all users (platform scope)
POST   /api/v1/platform/users/create          - Create a new user
GET    /api/v1/platform/users/:userId         - Get a user by ID
PUT    /api/v1/platform/users/:userId         - Update a user
DELETE /api/v1/platform/users/:userId         - Delete a user
GET    /api/v1/users/:userId/organizations    - Get all organizations for a user
```

### Application User Routes

```
GET    /api/v1/applications/:appId/users                 - Get all users for an application
GET    /api/v1/applications/:appId/users/service-users   - Get all service users for an application
GET    /api/v1/applications/:appId/users/service-users/:userId - Get a service user by ID
POST   /api/v1/applications/:appId/users/service-users   - Create a service user for an application
PUT    /api/v1/applications/:appId/users/service-users/:userId - Update a service user
DELETE /api/v1/applications/:appId/users/service-users/:userId - Delete a service user
```

### Organization User Routes

```
GET    /api/v1/organizations/:orgId/users/service-users   - Get all service users for an organization
GET    /api/v1/organizations/:orgId/users/service-users/:userId - Get a service user by ID
POST   /api/v1/organizations/:orgId/users/service-users   - Create a service user for an organization
PUT    /api/v1/organizations/:orgId/users/service-users/:userId - Update a service user
DELETE /api/v1/organizations/:orgId/users/service-users/:userId - Delete a service user
```

### Organization Member Routes

```
GET    /api/v1/organizations/:orgId/members              - Get all members of an organization
POST   /api/v1/organizations/:orgId/members              - Add a member to an organization
PUT    /api/v1/organizations/:orgId/members/:userId      - Update a member's role
DELETE /api/v1/organizations/:orgId/members/:userId      - Remove a member from an organization
```

### Organization Admin Routes

```
GET    /api/v1/organizations/:orgId/admin                - Get all admin members
POST   /api/v1/organizations/:orgId/admin                - Add an admin member
PUT    /api/v1/organizations/:orgId/admin/:userId        - Update an admin member's role
DELETE /api/v1/organizations/:orgId/admin/:userId        - Remove an admin member
```

### Service User Routes

```
GET    /api/v1/platform/users/service-users   - Get all service users (platform scope)
GET    /api/v1/platform/users/service-users/:userId - Get a service user by ID
PUT    /api/v1/platform/users/service-users/:userId - Update a service user
DELETE /api/v1/platform/users/service-users/:userId - Delete a service user
```

## Platform Admin Detection

The system identifies platform administrators through multiple sources to ensure robust role detection:

1. **Role-Based Detection**: Users with the role `platform_admin` are automatically identified as platform administrators.

2. **Metadata-Based Detection**: Platform admin status can be stored in various metadata locations:
   - `user.is_platform_admin` - Direct property on the user object
   - `user.user_metadata.is_platform_admin` - In the user metadata
   - `user.app_metadata.is_platform_admin` - In the application metadata

3. **Response Format**: Platform admin status is returned in the API response as `isPlatformAdmin` (camelCase).

### Implementation Details

```typescript
// Get the user's role
const userRole = user.profile_role || meta.role || 'user'

// Check if user is platform admin from all possible sources, including role
const isPlatformAdmin = user.is_platform_admin || 
                       meta.is_platform_admin || 
                       user.app_metadata?.is_platform_admin || 
                       userRole === 'platform_admin' || 
                       false
```

This approach ensures that platform admin users are correctly identified regardless of how their role information is stored, and works properly even when accessing the API with service keys.

## Response Format Standardization

To ensure consistency across all API endpoints, the user response format has been standardized with the following conventions:

1. **CamelCase Property Names**: All response properties use camelCase naming convention:
   - `isPlatformAdmin` instead of `is_platform_admin`
   - `isServiceUser` instead of `is_service_user`
   - `organizationId` instead of `organization_id`
   - `applicationId` instead of `application_id`
   - `createdAt` instead of `created_at`
   - `updatedAt` instead of `updated_at`

2. **Consistent User Object Structure**: All user endpoints return a consistent structure with these properties:
   - Basic user info: `id`, `email`, `name`, `firstName`, `lastName`
   - Status info: `status`, `userStatus`, `lastLogin`, `createdAt`
   - Role info: `role`, `roles`, `permissions`, `isPlatformAdmin`
   - Organization info: `organization`, `organizationId`, `organizationRole`, `organizations`
   - Application info: `application`, `applicationId`
   - Service user info: `isServiceUser`

3. **Enhanced Metadata**: The response includes metadata from multiple sources:
   - Direct JWT claims
   - User metadata
   - Application metadata
   - Organization information

This standardization ensures that client applications can rely on consistent field names and data structures across all user-related API endpoints.

## Controller Methods

### UserController

#### `getAllUsers(req: Request, res: Response)`

Retrieves users based on the context level (global, application, or organization).

**Request Parameters:**
- `appId` (optional): Application ID for application-scoped requests
- `orgId` (optional): Organization ID for organization-scoped requests
- `isServiceUser` (optional): Filter for service users

**Permission Requirements:**
- Global scope: `platform.read_users`
- Organization scope: `org.read_users`
- Application scope: `app.read_users`

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "status": "Active",
      "lastLogin": "2023-03-15 10:30:45",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "organization": "Example Org",
      "organizationId": "org-uuid",
      "organizationRole": "member",
      "organizations": [...],
      "isPlatformAdmin": false,
      "isServiceUser": false,
      "userStatus": "active"
    }
  ]
}
```

**Implementation Details:**
```typescript
// Determine the context level based on request parameters
let appId = req.params.appId || null
let orgId = req.params.orgId || null
let userContextLevel = ''
switch (true) {
    case appId !== null:
        userContextLevel = 'application'
    case orgId !== null:
        userContextLevel = 'organization'
    default:
        userContextLevel = 'global'
}

// Check permissions based on context level
const hasPlatformReadUsersPermission = await checkPermission(req.user, 'platform.read_users')
const hasOrgReadUsersPermission = await checkPermission(req.user, 'org.read_users')
const hasAppReadUsersPermission = await checkPermission(req.user, 'app.read_users')

// Set scope level based on permissions and context
let scopeLevel = ''
if (userContextLevel === 'application' && appId !== null && hasAppReadUsersPermission) {
    scopeLevel = 'application'
} else if (userContextLevel === 'organization' && orgId !== null && hasOrgReadUsersPermission) {
    scopeLevel = 'organization'
} else if (userContextLevel === 'global' && hasPlatformReadUsersPermission) {
    scopeLevel = 'global'
} else {
    return res.status(403).json({
        success: false,
        message: `Forbidden - Missing required permissions to read users for ${userContextLevel} context`
    })
}

// Get users based on scope level
const authUsers = await getAuthUsers(scopeLevel, appId, orgId)

// Format and return users
const formattedUsers = authUsers.map(user => {
    // Format user data
})

return res.json({ users: formattedUsers })
```

#### `getAllServiceUsers(req: Request, res: Response)`

Retrieves all service users in the system.

**Response:**
```json
{
  "users": [
    {
      "id": "service-user-uuid",
      "email": "service-user@example.com",
      "name": "API Service",
      "firstName": "API",
      "lastName": "Service",
      "role": "service",
      "status": "Active",
      "lastLogin": "2023-03-15 10:30:45",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "organization": "Example Org",
      "organizationId": "org-uuid",
      "application": "Example App",
      "applicationId": "app-uuid",
      "isServiceUser": true
    }
  ]
}
```

**Implementation Details:**
```typescript
// Use the Auth Admin API to get all users
const { data, error } = await supabase.auth.admin.listUsers()

// Filter for service users
const serviceUsers = (data.users || []).filter(user => 
    user.user_metadata?.is_service_user === true
)

// Format and return service users
const formattedServiceUsers = serviceUsers.map(user => {
    // Format service user data
})

return res.json({ users: formattedServiceUsers })
```

#### `getUserById(req: Request, res: Response)`

Retrieves a specific user by ID.

**Request Parameters:**
- `userId`: The ID of the user to retrieve

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "organization": "Example Org",
    "organizationId": "org-uuid",
    "organizationRole": "member",
    "organizations": [
      {
        "id": "org-uuid",
        "name": "Example Org",
        "role": "member"
      }
    ],
    "application": "Example App",
    "applicationId": "app-uuid",
    "status": "Active",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "role": "platform_admin",
    "roles": [...],
    "permissions": [...],
    "isPlatformAdmin": true,
    "isServiceUser": false,
    "userStatus": "active"
  }
}
```

#### `createUser(req: Request, res: Response)`

Creates a new user or service user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "organization": "Example Org",
  "role": "user",
  "applicationId": "app-uuid",
  "isPlatformAdmin": false,
  "isServiceUser": false
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "organization": "Example Org",
    "role": "user",
    "status": "Active",
    "createdAt": "2023-03-15T10:30:45.000Z",
    "isPlatformAdmin": false,
    "isServiceUser": false,
    "applicationId": "app-uuid"
  },
  "applicationId": "app-uuid"
}
```

#### `updateUser(req: Request, res: Response)`

Updates an existing user.

**Request Parameters:**
- `userId`: The ID of the user to update

**Request Body:**
```json
{
  "email": "updated@example.com",
  "password": "newSecurePassword123",
  "firstName": "Updated",
  "lastName": "User",
  "organization": "New Org",
  "role": "admin"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "updated@example.com",
    "firstName": "Updated",
    "lastName": "User",
    "name": "Updated User",
    "organization": "New Org",
    "role": "admin",
    "status": "Active",
    "lastLogin": "2023-03-15 10:30:45",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### `deleteUser(req: Request, res: Response)`

Deletes a user.

**Request Parameters:**
- `userId`: The ID of the user to delete

**Response:**
```json
{
  "success": true
}
```

#### `getUserOrganizations(req: Request, res: Response)`

Retrieves all organizations a user belongs to.

**Request Parameters:**
- `userId`: The ID of the user

**Response:**
```json
{
  "organizations": [
    {
      "id": "org-uuid",
      "name": "Example Org",
      "description": "An example organization",
      "applicationId": "app-uuid",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "role": "member"
    }
  ]
}
```

### OrganizationController

#### `updateOrganizationMember(req: Request, res: Response)`

Updates a member's role in an organization. This consolidated method handles both regular member updates and admin role updates.

**Request Parameters:**
- `organizationId`: The ID of the organization
- `userId`: The ID of the user

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "member": {
    "organizationId": "org-uuid",
    "userId": "user-uuid",
    "role": "admin",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-03-15T10:30:45.000Z"
  },
  "isAdminUpdate": true
}
```

**Implementation Details:**
```typescript
// Check if this is an admin role update
const isAdminRole = req.path.includes('/admin/') || req.query.isAdmin === 'true'

// Update user's role
const { data, error } = await supabase
    .from('organization_users')
    .update({ role })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .select()
    .single()

return res.json({ 
    member: data,
    isAdminUpdate: isAdminRole
})
```

## Code Examples

### Retrieving Users Based on Context

#### Global Users

```javascript
// Client-side code
const getGlobalUsers = async () => {
  const response = await fetch('/api/v1/platform/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

#### Application Users

```javascript
// Client-side code
const getApplicationUsers = async (appId) => {
  const response = await fetch(`/api/v1/applications/${appId}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

#### Organization Users

```javascript
// Client-side code
const getOrganizationServiceUsers = async (orgId) => {
  const response = await fetch(`/api/v1/organizations/${orgId}/users/service-users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Creating a Service User

```javascript
// Client-side code
const createServiceUser = async (appId, userData) => {
  const response = await fetch(`/api/v1/applications/${appId}/users/service-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email: 'service-user@example.com',
      password: 'securePassword123',
      firstName: 'API',
      lastName: 'Service',
      role: 'service',
      isServiceUser: true,
      applicationId: appId
    })
  });
  return await response.json();
};