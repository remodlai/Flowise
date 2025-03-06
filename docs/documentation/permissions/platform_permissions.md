# Platform Permissions

## Overview

Platform permissions control access to platform-wide resources and functionality. These permissions are typically assigned to platform administrators and other roles that need broad access across the entire platform.

## Platform Global Permission

The `platform.global` permission provides global access to all platform resources. This permission is automatically assigned to the `platform_admin` role and allows users with this role to access all applications and other platform-wide resources.

### Usage

The `platform.global` permission is used in Row-Level Security (RLS) policies to grant access to platform-wide resources. For example, the following RLS policy allows users with the `platform.global` permission to view all applications:

```sql
CREATE POLICY "Global platform access" ON applications 
FOR SELECT USING (authorize('platform.global'));
```

### Implementation

The `platform.global` permission is implemented in the database as follows:

1. The permission is defined in the `permissions` table with the following attributes:
   - `name`: `platform.global`
   - `description`: `Global access to all platform resources`
   - `category_id`: The ID of the `Platform` permission category
   - `context_types`: `['platform']`

2. The permission is assigned to the `platform_admin` role in the `role_permissions` table.

3. RLS policies use the `authorize` function to check if the user has the `platform.global` permission.

## Authorize Function

The `authorize` function is used in RLS policies to check if the current user has a specific permission. The function takes a permission name as input and returns a boolean indicating whether the user has that permission.

### Implementation

```sql
CREATE OR REPLACE FUNCTION public.authorize(requested_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  JOIN public.roles r ON r.id = rp.role_id
  JOIN jsonb_array_elements(user_roles) AS jr ON
    (jr ->> 'role')::text = r.name
  WHERE rp.permission = requested_permission;
  
  RETURN bind_permissions > 0;
END;
$function$;
```

### Usage

The `authorize` function is used in RLS policies to check if the current user has a specific permission. For example:

```sql
CREATE POLICY "Allow users with app.view permission" ON applications 
FOR SELECT USING (authorize('app.view'));
```

This policy allows users with the `app.view` permission to view applications.

## Platform Admin Access

Platform admins have access to all resources on the platform through two mechanisms:

1. The `is_platform_admin` claim in the JWT, which is checked by the `authorize` function.
2. The `platform.global` permission, which is assigned to the `platform_admin` role.

This dual approach ensures that platform admins can access all resources even if the JWT claim is not properly set. 