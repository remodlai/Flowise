# RBAC Implementation for Remodl Platform

This document explains the Role-Based Access Control (RBAC) implementation for the Remodl Platform using Supabase.

## Overview

We've implemented a comprehensive RBAC system that:

1. Defines roles at three levels: platform, application, and organization
2. Uses Supabase's custom access token hook to add role information to JWT tokens
3. Implements Row Level Security (RLS) policies to enforce permissions at the database level
4. Provides helper functions for managing user roles

## Data Model

The RBAC system is built on three main tables:

1. **applications** - Stores application information
2. **organizations** - Stores organization information, with each organization belonging to one application
3. **user_roles** - Stores role assignments for users

The `user_roles` table has a flexible structure that allows assigning roles at different levels:

```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'platform', 'application', or 'organization'
    resource_id UUID, -- NULL for platform-level roles
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role, resource_type, resource_id)
);
```

## Role Hierarchy

The system implements a hierarchical role structure:

1. **Platform Roles**
   - `admin`: Has full access to everything in the platform

2. **Application Roles**
   - `owner`: Has full access to the application and its organizations
   - `member`: Has read access to the application

3. **Organization Roles**
   - `admin`: Can manage the organization
   - `member`: Has read access to the organization

Higher-level roles automatically grant permissions to lower-level resources. For example, a platform admin has access to all applications and organizations.

## Custom Access Token Hook

We use Supabase's custom access token hook to add role information to JWT tokens. This allows the frontend to make authorization decisions without additional database queries.

The hook adds the following claims to the JWT:

```json
{
  "app_metadata": {
    "roles": {
      "platform": [{"role": "admin"}],
      "applications": [{"role": "owner", "application_id": "uuid"}],
      "organizations": [{"role": "admin", "organization_id": "uuid", "application_id": "uuid"}]
    },
    "is_platform_admin": true
  }
}
```

## RPC Functions

The system includes several RPC functions for checking user roles:

1. `rpc.is_platform_admin()` - Checks if the current user is a platform admin
2. `rpc.is_app_owner(app_id)` - Checks if the current user is an owner of the specified application
3. `rpc.user_has_app_access(app_id)` - Checks if the current user has access to the specified application
4. `rpc.is_org_admin(org_id)` - Checks if the current user is an admin of the specified organization
5. `rpc.user_in_organization(org_id)` - Checks if the current user is a member of the specified organization

These functions are used in RLS policies to enforce permissions at the database level.

## Helper Functions

The system includes helper functions for managing user roles:

1. `public.assign_role(user_id, role, resource_type, resource_id)` - Assigns a role to a user
2. `public.remove_role(user_id, role, resource_type, resource_id)` - Removes a role from a user
3. `public.create_initial_platform_admin(admin_email)` - Creates the first platform admin

## Row Level Security (RLS) Policies

RLS policies are applied to the tables to enforce permissions:

1. **applications** table:
   - Platform admins can do anything
   - App owners can view their applications

2. **organizations** table:
   - Platform admins can do anything
   - App owners can view organizations in their app
   - Org members can view their organization
   - Org admins can update their organization

3. **user_roles** table:
   - Platform admins can do anything
   - App owners can manage roles for their app
   - Org admins can manage roles for their org
   - Users can view their own roles

## Implementation Steps

To implement this RBAC system:

1. Run the SQL script in `rbac_implementation.sql` to create the necessary tables, functions, and policies
2. Create your first user through Supabase Auth
3. Run `SELECT public.create_initial_platform_admin('admin@example.com')` to create the first platform admin
4. Use the helper functions to assign roles to users as needed

## Frontend Integration

In your frontend code, you can access the role information from the JWT token:

```typescript
// Get the current user's session
const session = supabase.auth.getSession();

// Check if the user is a platform admin
const isPlatformAdmin = session?.user?.app_metadata?.is_platform_admin || false;

// Get all roles
const roles = session?.user?.app_metadata?.roles || { platform: [], applications: [], organizations: [] };

// Check if the user has a specific role
const isOrgAdmin = (orgId: string) => {
  return roles.organizations.some(
    role => role.role === 'admin' && role.organization_id === orgId
  );
};
```

## Security Considerations

1. All RPC functions use `SECURITY DEFINER` to ensure they run with the privileges of the function creator
2. Helper functions validate inputs to prevent assigning invalid roles
3. RLS policies ensure users can only access data they have permission to see

## Next Steps

1. Add more specific roles and permissions as needed
2. Implement frontend components to manage user roles
3. Add audit logging for role changes 