# RLS Helper Functions

## Overview

This document details the helper functions used in Row Level Security (RLS) policies in the Remodl AI platform. These functions provide a consistent way to check permissions and access rights across different tables.

## Function Definitions

### 1. authorize(requested_permission)

This function checks if the current user has a specific permission based on their roles.

```sql
CREATE OR REPLACE FUNCTION public.authorize(requested_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  bind_permissions int;
  user_roles jsonb;
BEGIN
  -- Get user_roles from JWT claims
  user_roles := auth.jwt() -> 'user_roles';
  
  -- If user is a platform admin, they have all permissions
  IF (auth.jwt() ->> 'is_platform_admin')::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Check if any of the user's roles has the requested permission
  SELECT COUNT(*)
  INTO bind_permissions
  FROM public.role_permissions rp
  JOIN jsonb_array_elements(user_roles) AS jr ON
    (jr ->> 'role')::text = rp.role_name
  WHERE rp.permission_name = requested_permission;
  
  RETURN bind_permissions > 0;
END;
$$;
```

**Usage Example:**
```sql
CREATE POLICY "Allow users with chatflow.view permission" ON application_chatflows
FOR SELECT
USING (authorize('chatflow.view'));
```

### 2. authorize_resource(requested_permission, resource_type, resource_id)

This function checks if the current user has a specific permission for a specific resource.

```sql
CREATE OR REPLACE FUNCTION public.authorize_resource(
  requested_permission text,
  resource_type text,
  resource_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  bind_permissions int;
  user_roles jsonb;
BEGIN
  -- Get user_roles from JWT claims
  user_roles := auth.jwt() -> 'user_roles';
  
  -- If user is a platform admin, they have all permissions
  IF (auth.jwt() ->> 'is_platform_admin')::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Check if any of the user's roles has the requested permission for the specific resource
  SELECT COUNT(*)
  INTO bind_permissions
  FROM public.role_permissions rp
  JOIN jsonb_array_elements(user_roles) AS jr ON
    (jr ->> 'role')::text = rp.role_name
  WHERE
    rp.permission_name = requested_permission
    AND (
      -- Match if the role is for this specific resource
      ((jr ->> 'resource_type')::text = resource_type AND (jr ->> 'resource_id')::uuid = resource_id)
      -- Or if the role is global (null resource_type and resource_id)
      OR ((jr ->> 'resource_type') IS NULL AND (jr ->> 'resource_id') IS NULL)
    );
  
  RETURN bind_permissions > 0;
END;
$$;
```

**Usage Example:**
```sql
CREATE POLICY "Allow users with chatflow.edit permission" ON application_chatflows
FOR UPDATE
USING (authorize_resource('chatflow.edit', 'application', application_id));
```

### 3. is_platform_admin()

This function checks if the current user is a platform admin.

```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (auth.jwt() ->> 'is_platform_admin')::boolean = true;
END;
$$;
```

**Usage Example:**
```sql
CREATE POLICY "Platform admins can manage all" ON application_settings
USING (is_platform_admin());
```

### 4. user_has_application_access(app_id)

This function checks if the current user has access to a specific application.

```sql
CREATE OR REPLACE FUNCTION public.user_has_application_access(app_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = auth.uid() AND o.application_id = app_id
  ) OR is_platform_admin();
END;
$$;
```

**Usage Example:**
```sql
CREATE POLICY "Users can view application settings they have access to" ON application_settings
FOR SELECT
USING (user_has_application_access(application_id));
```

### 5. user_belongs_to_organization(org_id)

This function checks if the current user belongs to a specific organization.

```sql
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE user_id = auth.uid() AND organization_id = org_id
  );
END;
$$;
```

**Usage Example:**
```sql
CREATE POLICY "Users can view their organization details" ON organizations
FOR SELECT
USING (user_belongs_to_organization(id));
```

## Security Considerations

1. **SECURITY DEFINER**: The `authorize` and `authorize_resource` functions use the `SECURITY DEFINER` attribute, which means they run with the privileges of the user who created them, not the user who calls them. This is important for security as it prevents users from bypassing RLS policies.

2. **SET search_path TO ''**: This setting ensures that the function uses only explicitly schema-qualified names, preventing potential security issues with schema search paths.

3. **Stable Functions**: All functions are marked as `STABLE`, which means they return the same result when called with the same arguments within a single statement. This is important for performance as it allows PostgreSQL to optimize queries.

## Performance Considerations

1. **JWT Claims Access**: Accessing JWT claims can be expensive if done repeatedly. Consider extracting them once at the beginning of functions.

2. **Function Calls in Policies**: Function calls in RLS policies can impact performance, especially for tables with many rows. Consider using direct JWT claim access for frequently accessed tables.

3. **Indexing**: Ensure that columns used in RLS policies are properly indexed to improve performance.

## Best Practices

1. **Consistent Usage**: Use these helper functions consistently across all RLS policies to ensure a uniform security model.

2. **Function Updates**: When updating these functions, be careful not to break existing RLS policies. Consider creating new versions of functions rather than modifying existing ones.

3. **Testing**: Test RLS policies with different user roles to ensure they work as expected.

4. **Documentation**: Keep this documentation updated as functions evolve.

## Example Policy Patterns

### Platform Admin Access

```sql
CREATE POLICY "Platform admins can manage all" ON table_name
USING (is_platform_admin());
```

### Permission-Based Access

```sql
CREATE POLICY "Allow users with permission" ON table_name
FOR operation
USING (authorize('permission.name'));
```

### Resource-Specific Access

```sql
CREATE POLICY "Allow users with resource permission" ON table_name
FOR operation
USING (authorize_resource('permission.name', 'resource_type', resource_id));
```

### Application-Level Access

```sql
CREATE POLICY "Allow users with application access" ON table_name
FOR operation
USING (user_has_application_access(application_id));
```

### Organization-Level Access

```sql
CREATE POLICY "Allow users with organization access" ON table_name
FOR operation
USING (user_belongs_to_organization(organization_id));
```

## References

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL Security Functions Documentation](https://www.postgresql.org/docs/current/functions-admin.html)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) 