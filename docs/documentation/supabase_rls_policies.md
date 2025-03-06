# Supabase RLS Policies and RBAC Implementation

## Overview

This document outlines the Row Level Security (RLS) policies and Role-Based Access Control (RBAC) implementation in the Remodl AI platform. It provides recommendations for optimizing RLS policies based on our custom JWT claims and permission system.

## Current RBAC Implementation

### Permission System

- Permissions are stored as text values (e.g., "app.create", "chatflow.view") rather than enums
- Permissions are categorized (Platform, Application, Organization, etc.)
- Each permission has context_types that define where it can be applied (platform, application, organization)
- Permissions are stored in the `permissions` table with a reference to `permission_categories`

### Role System

- The platform supports both built-in roles and custom roles
- Built-in roles include: platform_admin, platform_owner, app_admin, app_owner, organization_owner
- Roles have a context_type (platform, application, organization) and optional context_id
- Roles can have a base_role (e.g., "admin") for categorization
- Roles are stored in the `roles` table

### User Role Assignments

- Users are assigned roles through the `user_roles` table
- Role assignments can include resource_type and resource_id for resource-specific permissions
- This allows for granular access control at different levels (platform, application, organization)

### JWT Claims

The custom access token hook adds several claims to the JWT:

- `is_platform_admin`: Boolean flag for platform admins
- `user_roles`: Array of objects with role, resource_type, and resource_id
- Profile information (first_name, last_name, etc.)

Example JWT claims:
```json
{
  "is_platform_admin": true,
  "user_roles": [
    {
      "role": "platform_admin",
      "resource_type": null,
      "resource_id": null
    }
  ],
  "first_name": "John",
  "last_name": "Doe",
  "organization_name": "Remodl AI",
  "profile_role": "platform_admin",
  "test_claim": "CUSTOM_ACCESS_TOKEN_HOOK_WORKING"
}
```

### RLS Helper Functions

The platform uses several helper functions for RLS policies:

- `authorize(requested_permission)`: Checks if user has a specific permission
- `authorize_resource(requested_permission, resource_type, resource_id)`: Checks if user has permission for a specific resource
- `is_platform_admin()`: Checks if user is a platform admin
- `user_has_application_access(app_id)`: Checks if user has access to an application
- `user_belongs_to_organization(org_id)`: Checks if user belongs to an organization

## Recommendations for RLS Policies

### 1. Standardize Platform Admin Checks

Current policies use different methods to check for platform admin status. Standardize on using:

```sql
(auth.jwt() ->> 'is_platform_admin')::boolean = true
```

This is more efficient than calling a function for every row.

**Example:**
```sql
-- Before
CREATE POLICY "Platform admins can manage all" ON table_name
USING (is_platform_admin());

-- After
CREATE POLICY "Platform admins can manage all" ON table_name
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);
```

### 2. Use the authorize() Function for General Permissions

For policies that check general permissions, use:

```sql
CREATE POLICY "Allow users with permission" ON table_name
FOR operation
USING (authorize('permission.name'));
```

**Example:**
```sql
CREATE POLICY "Allow users with chatflow.view permission" ON application_chatflows
FOR SELECT
USING (authorize('chatflow.view'));
```

### 3. Use authorize_resource() for Resource-Specific Permissions

For tables that need resource-specific access control:

```sql
CREATE POLICY "Allow users with resource permission" ON table_name
FOR operation
USING (authorize_resource('permission.name', 'resource_type', resource_id));
```

**Example:**
```sql
CREATE POLICY "Allow users with chatflow.edit permission" ON application_chatflows
FOR UPDATE
USING (authorize_resource('chatflow.edit', 'application', application_id));
```

### 4. Add Context-Specific Policies

For application and organization resources, add policies that check context:

```sql
-- For application resources
CREATE POLICY "Allow users with application access" ON table_name
FOR operation
USING (user_has_application_access(application_id));

-- For organization resources
CREATE POLICY "Allow users with organization access" ON table_name
FOR operation
USING (user_belongs_to_organization(organization_id));
```

**Example:**
```sql
CREATE POLICY "Users can view chatflows for their applications" ON application_chatflows
FOR SELECT
USING (user_has_application_access(application_id));
```

### 5. Optimize JWT Claims Access

When accessing JWT claims frequently, consider extracting them once at the beginning of functions:

```sql
DECLARE
  user_roles jsonb := auth.jwt() -> 'user_roles';
  is_admin boolean := (auth.jwt() ->> 'is_platform_admin')::boolean;
BEGIN
  -- Use variables instead of repeatedly accessing JWT
```

### 6. Add Restrictive Policies for Security

Consider adding restrictive policies for sensitive tables:

```sql
CREATE POLICY "Restrict access to authenticated users only"
ON table_name
AS RESTRICTIVE
TO authenticated
USING (true);
```

This ensures that even if permissive policies are added later, access is still restricted to authenticated users.

### 7. Update User Profile Policies

Update user_profiles table policies that are using 'user_role' instead of 'is_platform_admin':

```sql
-- Change this:
USING (((auth.jwt() ->> 'user_role'::text) = 'platform_admin'::text))

-- To this:
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true)
```

## Implementation Plan

1. Update helper functions first to ensure they work with the current JWT structure
2. Standardize platform admin checks across all policies
3. Update policies for core tables (applications, organizations, users)
4. Update policies for resource tables (chatflows, credentials, etc.)
5. Add restrictive policies for sensitive tables
6. Test all policies with different user roles

## Testing RLS Policies

To test RLS policies:

1. Create test users with different roles
2. Use the Supabase client to make requests as different users
3. Verify that users can only access resources they have permission for
4. Test edge cases (e.g., users with multiple roles, resource-specific permissions)

```sql
-- Example test setup
BEGIN;
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user-id", "is_platform_admin": false, "user_roles": [{"role": "app_admin", "resource_type": "application", "resource_id": "test-app-id"}]}';

-- Run test queries
SELECT * FROM applications; -- Should only see applications the user has access to

ROLLBACK;
```

## References

- [Supabase Custom Claims & RBAC Documentation](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) 