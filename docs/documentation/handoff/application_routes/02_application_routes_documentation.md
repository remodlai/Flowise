# Documentation for Application Routes

This documentation covers the implementation and use of our application-related routes within the Remodl AI platform. ⁠

## Core Application Routes

### Get All Applications
```
GET /api/v1/platform/applications
```
Retrieves all applications in the platform. This route bypasses RLS policies using a direct SQL query.

### Get Application by ID
```
GET /api/v1/applications/:appId
```
Retrieves a specific application by its ID.

### Get User Applications
```
GET /api/v1/user/applications
```
Retrieves applications accessible to the current user. This route respects RLS policies and adds an `is_admin` flag based on the user's roles.

### Create Application
```
POST /api/v1/applications
```
Creates a new application with the provided name and description.

### Update Application
```
PUT /api/v1/applications/:appId
```
Updates an existing application's name and description.

### Delete Application
```
DELETE /api/v1/applications/:appId
```
Deletes an application by its ID.

## Application Assets

For detailed information about application logo-related routes, see [Application Logo Routes](./03_application_logo_routes.md).

## Implementation Notes

- Application routes use path parameters instead of query parameters where possible for clarity
- RLS policies are bypassed for platform-level operations but respected for user-level operations
- User roles are used to determine admin status for applications
- Application assets (like logos) are stored in Supabase Storage with structured paths
