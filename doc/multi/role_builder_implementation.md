# Role Builder Implementation for Remodl Platform

## Overview

This document outlines the implementation of a dynamic Role Builder system for the Remodl Platform. The Role Builder allows platform administrators, application owners, and organization administrators to create custom roles with specific permission sets tailored to their needs, beyond the predefined roles in the system.

## Key Concepts

1. **Dynamic Roles**: Custom roles created by administrators with specific permission sets
2. **Permission Categories**: Logical groupings of permissions for easier management
3. **Role Templates**: Pre-configured permission sets that can be used as starting points
4. **Role Inheritance**: The ability for roles to inherit permissions from other roles
5. **Context-Aware Permissions**: Permissions that apply only in specific contexts (platform, application, organization)

## Data Model

### Custom Roles Table

```sql
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_role TEXT, -- Optional reference to a system role this extends
    context_type TEXT NOT NULL, -- 'platform', 'application', or 'organization'
    context_id UUID, -- NULL for platform-level roles
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, context_type, context_id)
);
```

### Role Permissions Table

```sql
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL, -- The permission identifier
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission)
);
```

### User Custom Roles Table

```sql
CREATE TABLE IF NOT EXISTS public.user_custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role_id)
);
```

### Permission Categories Table

```sql
CREATE TABLE IF NOT EXISTS public.permission_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name)
);
```

### Permissions Table

```sql
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES public.permission_categories(id),
    context_types TEXT[] NOT NULL, -- Array of contexts where this permission is applicable
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name)
);
```

## Extended JWT Claims

The custom access token hook needs to be updated to include custom roles:

```sql
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    original_claims jsonb;
    new_claims jsonb;
    user_roles jsonb;
    user_custom_roles jsonb;
    is_admin boolean;
BEGIN
    user_id = (event->>'user_id')::uuid;
    original_claims = event->'claims';
    
    -- Start with the original claims
    new_claims = original_claims;
    
    -- Get all user roles
    user_roles = rpc.get_user_roles(user_id);
    
    -- Get all custom roles
    user_custom_roles = rpc.get_user_custom_roles(user_id);
    
    -- Check if user is a platform admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = custom_access_token_hook.user_id
        AND role = 'admin'
        AND resource_type = 'platform'
    ) INTO is_admin;
    
    -- Add custom claims
    new_claims = jsonb_set(new_claims, '{app_metadata}', jsonb_build_object(
        'roles', user_roles,
        'custom_roles', user_custom_roles,
        'is_platform_admin', is_admin
    ));
    
    -- Return the updated claims
    RETURN jsonb_build_object('claims', new_claims);
END;
$$;
```

## RPC Functions for Custom Roles

### Get User Custom Roles

```sql
CREATE OR REPLACE FUNCTION rpc.get_user_custom_roles(user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    platform_custom_roles jsonb = '[]'::jsonb;
    app_custom_roles jsonb = '[]'::jsonb;
    org_custom_roles jsonb = '[]'::jsonb;
    all_custom_roles jsonb;
BEGIN
    -- Get platform-level custom roles
    SELECT jsonb_agg(jsonb_build_object(
        'id', cr.id,
        'name', cr.name,
        'permissions', (
            SELECT jsonb_agg(rp.permission)
            FROM public.role_permissions rp
            WHERE rp.role_id = cr.id
        )
    ))
    INTO platform_custom_roles
    FROM public.custom_roles cr
    JOIN public.user_custom_roles ucr ON cr.id = ucr.role_id
    WHERE ucr.user_id = get_user_custom_roles.user_id
    AND cr.context_type = 'platform';
    
    -- Get application-level custom roles
    SELECT jsonb_agg(jsonb_build_object(
        'id', cr.id,
        'name', cr.name,
        'context_id', cr.context_id,
        'permissions', (
            SELECT jsonb_agg(rp.permission)
            FROM public.role_permissions rp
            WHERE rp.role_id = cr.id
        )
    ))
    INTO app_custom_roles
    FROM public.custom_roles cr
    JOIN public.user_custom_roles ucr ON cr.id = ucr.role_id
    WHERE ucr.user_id = get_user_custom_roles.user_id
    AND cr.context_type = 'application';
    
    -- Get organization-level custom roles
    SELECT jsonb_agg(jsonb_build_object(
        'id', cr.id,
        'name', cr.name,
        'context_id', cr.context_id,
        'permissions', (
            SELECT jsonb_agg(rp.permission)
            FROM public.role_permissions rp
            WHERE rp.role_id = cr.id
        )
    ))
    INTO org_custom_roles
    FROM public.custom_roles cr
    JOIN public.user_custom_roles ucr ON cr.id = ucr.role_id
    WHERE ucr.user_id = get_user_custom_roles.user_id
    AND cr.context_type = 'organization';
    
    -- Handle null cases
    IF platform_custom_roles IS NULL THEN
        platform_custom_roles = '[]'::jsonb;
    END IF;
    
    IF app_custom_roles IS NULL THEN
        app_custom_roles = '[]'::jsonb;
    END IF;
    
    IF org_custom_roles IS NULL THEN
        org_custom_roles = '[]'::jsonb;
    END IF;
    
    -- Combine all roles
    all_custom_roles = jsonb_build_object(
        'platform', platform_custom_roles,
        'applications', app_custom_roles,
        'organizations', org_custom_roles
    );
    
    RETURN all_custom_roles;
END;
$$;
```

### Check User Permission

```sql
CREATE OR REPLACE FUNCTION rpc.user_has_permission(
    p_user_id UUID,
    p_permission TEXT,
    p_context_type TEXT DEFAULT NULL,
    p_context_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    -- Check if user is platform admin (has all permissions)
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id
        AND role = 'admin'
        AND resource_type = 'platform'
    ) INTO has_permission;
    
    IF has_permission THEN
        RETURN TRUE;
    END IF;
    
    -- Check standard roles first
    -- This would check against the predefined role-permission mappings
    -- Implementation depends on how standard roles are mapped to permissions
    
    -- Then check custom roles
    SELECT EXISTS (
        SELECT 1
        FROM public.user_custom_roles ucr
        JOIN public.custom_roles cr ON ucr.role_id = cr.id
        JOIN public.role_permissions rp ON cr.id = rp.role_id
        WHERE ucr.user_id = p_user_id
        AND rp.permission = p_permission
        AND (
            -- Match context if provided
            (p_context_type IS NOT NULL AND cr.context_type = p_context_type AND 
             (p_context_id IS NULL OR cr.context_id = p_context_id))
            OR
            -- Platform roles apply everywhere
            (cr.context_type = 'platform')
            OR
            -- App roles apply to the app and all its orgs
            (cr.context_type = 'application' AND p_context_type = 'organization' AND
             EXISTS (
                 SELECT 1 FROM public.organizations
                 WHERE id = p_context_id AND application_id = cr.context_id
             ))
        )
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;
```

## Helper Functions for Role Management

### Create Custom Role

```sql
CREATE OR REPLACE FUNCTION public.create_custom_role(
    p_name TEXT,
    p_description TEXT,
    p_base_role TEXT,
    p_context_type TEXT,
    p_context_id UUID,
    p_permissions TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_id UUID;
    permission TEXT;
BEGIN
    -- Validate context type
    IF p_context_type NOT IN ('platform', 'application', 'organization') THEN
        RAISE EXCEPTION 'Invalid context type: %', p_context_type;
    END IF;
    
    -- Validate context ID for non-platform contexts
    IF p_context_type != 'platform' AND p_context_id IS NULL THEN
        RAISE EXCEPTION 'Context ID is required for % contexts', p_context_type;
    END IF;
    
    -- Create the custom role
    INSERT INTO public.custom_roles (
        name, description, base_role, context_type, context_id, created_by
    )
    VALUES (
        p_name, p_description, p_base_role, p_context_type, p_context_id, auth.uid()
    )
    RETURNING id INTO role_id;
    
    -- Add permissions to the role
    FOREACH permission IN ARRAY p_permissions
    LOOP
        INSERT INTO public.role_permissions (role_id, permission)
        VALUES (role_id, permission);
    END LOOP;
    
    RETURN role_id;
END;
$$;
```

### Assign Custom Role to User

```sql
CREATE OR REPLACE FUNCTION public.assign_custom_role(
    p_user_id UUID,
    p_role_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Insert the role assignment
    INSERT INTO public.user_custom_roles (user_id, role_id, created_by)
    VALUES (p_user_id, p_role_id, auth.uid())
    RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$;
```

## Row Level Security Policies

```sql
-- RLS for custom_roles table
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Platform admins can do anything
CREATE POLICY "Platform admins can do anything with custom roles"
ON public.custom_roles
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

-- App owners can manage custom roles for their app
CREATE POLICY "App owners can manage custom roles for their app"
ON public.custom_roles
USING (
    context_type = 'application' AND
    EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))
)
WITH CHECK (
    context_type = 'application' AND
    EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))
);

-- Org admins can manage custom roles for their org
CREATE POLICY "Org admins can manage custom roles for their org"
ON public.custom_roles
USING (
    context_type = 'organization' AND
    EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id))
)
WITH CHECK (
    context_type = 'organization' AND
    EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id))
);

-- Users can view roles they have been assigned
CREATE POLICY "Users can view roles they have been assigned"
ON public.custom_roles
FOR SELECT
USING (
    id IN (
        SELECT role_id FROM public.user_custom_roles
        WHERE user_id = auth.uid()
    )
);

-- Similar policies for role_permissions and user_custom_roles tables
```

## UI Implementation

### Role Builder Interface

The Role Builder interface should include:

1. **Role Creation Form**:
   - Name and description fields
   - Context selection (platform, application, organization)
   - Base role selection (optional)
   - Permission selection interface

2. **Permission Selection Interface**:
   - Grouped by categories for easier navigation
   - Search functionality
   - Tooltips explaining each permission
   - Bulk selection options (select all in category)

3. **Role Management**:
   - List of existing custom roles
   - Edit and delete options
   - Duplicate functionality
   - Export/import capabilities

4. **User Assignment**:
   - Interface to assign roles to users
   - Bulk assignment options
   - View users with specific roles

### Permission Management Screens

1. **Permission Categories**:
   - View and manage permission categories
   - Create new categories

2. **Permissions**:
   - View all available permissions
   - Filter by category and context
   - Create new permissions (platform admin only)

3. **Role Templates**:
   - Pre-configured permission sets
   - Create new templates
   - Apply templates to roles

### User Role Management

1. **User Detail View**:
   - List of assigned standard and custom roles
   - Add/remove roles interface

2. **Bulk Role Management**:
   - Assign roles to multiple users
   - Remove roles from multiple users

## API Endpoints

### Custom Roles

```
GET /api/custom-roles - List custom roles
POST /api/custom-roles - Create a new custom role
GET /api/custom-roles/:id - Get a specific custom role
PUT /api/custom-roles/:id - Update a custom role
DELETE /api/custom-roles/:id - Delete a custom role
```

### Role Permissions

```
GET /api/custom-roles/:id/permissions - List permissions for a role
POST /api/custom-roles/:id/permissions - Add permissions to a role
DELETE /api/custom-roles/:id/permissions/:permission - Remove a permission from a role
```

### User Custom Roles

```
GET /api/users/:id/custom-roles - List custom roles for a user
POST /api/users/:id/custom-roles - Assign a custom role to a user
DELETE /api/users/:id/custom-roles/:role_id - Remove a custom role from a user
```

### Permissions

```
GET /api/permissions - List all permissions
GET /api/permissions/categories - List permission categories
GET /api/permissions/check - Check if current user has a specific permission
```

## Frontend Integration

### Permission Checking

```typescript
// Check if the current user has a specific permission
const checkPermission = async (permission: string, contextType?: string, contextId?: string) => {
  const { data, error } = await supabase.rpc('user_has_permission', {
    p_permission: permission,
    p_context_type: contextType,
    p_context_id: contextId
  });
  
  if (error) {
    console.error('Error checking permission:', error);
    return false;
  }
  
  return data;
};

// Usage example
const canCreateChatflow = await checkPermission('chatflow.create', 'organization', orgId);
if (canCreateChatflow) {
  // Show create button
}
```

### Permission-Based UI

```typescript
// Component that renders only if user has permission
const PermissionGated = ({ 
  permission, 
  contextType, 
  contextId, 
  children 
}: PermissionGatedProps) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      const result = await checkPermission(permission, contextType, contextId);
      setHasPermission(result);
      setLoading(false);
    };
    
    checkAccess();
  }, [permission, contextType, contextId]);
  
  if (loading) return <Spinner />;
  if (!hasPermission) return null;
  
  return <>{children}</>;
};

// Usage
<PermissionGated permission="chatflow.create" contextType="organization" contextId={orgId}>
  <CreateChatflowButton />
</PermissionGated>
```

## Implementation Steps

1. **Database Setup**:
   - Create the necessary tables for custom roles
   - Implement the RPC functions for permission checking
   - Set up RLS policies

2. **Backend Implementation**:
   - Create API endpoints for role management
   - Implement permission checking middleware

3. **Frontend Implementation**:
   - Build the Role Builder interface
   - Implement permission-based UI components
   - Create user role management screens

4. **Testing**:
   - Test role creation and assignment
   - Verify permission checking
   - Test RLS policies

5. **Documentation**:
   - Document the role builder system
   - Create user guides for administrators

## Use Cases

### Case 1: Limited Access Developer

An organization wants to create a role for a developer who should only be able to view and edit specific chatflows, but not create new ones or delete existing ones.

1. Create a custom role "Limited Developer" at the organization level
2. Assign permissions: `chatflow.view`, `chatflow.edit`
3. Assign this role to the developer

### Case 2: Finance Team

A company wants to create a role for their finance team that can access billing information but not modify application settings.

1. Create a custom role "Finance Team" at the application level
2. Assign permissions: `billing.view`, `billing.edit`, `paymentMethod.view`, `paymentMethod.edit`
3. Assign this role to finance team members

### Case 3: Content Manager

An organization needs a role for content managers who can create and manage documents but not access chatflows.

1. Create a custom role "Content Manager" at the organization level
2. Assign permissions: `document.create`, `document.view`, `document.edit`, `document.delete`
3. Assign this role to content team members

## Security Considerations

1. **Permission Validation**: Validate that users can only assign permissions they themselves have
2. **Role Hierarchy**: Maintain proper role hierarchy to prevent privilege escalation
3. **Audit Logging**: Log all role and permission changes for audit purposes
4. **Permission Checks**: Implement permission checks at both API and UI levels
5. **RLS Enforcement**: Ensure RLS policies properly enforce permissions at the database level

## Next Steps

1. **Role Analytics**: Implement analytics to track role usage and permission patterns
2. **Permission Recommendations**: Build a system to recommend permissions based on user behavior
3. **Role Templates**: Create a library of role templates for common use cases
4. **Approval Workflows**: Implement approval workflows for role assignments
5. **Permission Impact Analysis**: Develop tools to analyze the impact of permission changes 