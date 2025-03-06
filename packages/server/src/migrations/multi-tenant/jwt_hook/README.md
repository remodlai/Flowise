# JWT Custom Claims and Authorization

This directory contains the implementation of JWT custom claims and authorization functions for the Flowise platform.

## Overview

We've implemented a Role-Based Access Control (RBAC) system using Supabase's custom JWT claims and PostgreSQL functions. This system allows us to:

1. Add custom claims to user JWTs, including role information and profile data
2. Create authorization functions that check these claims for permissions
3. Use these functions in Row Level Security (RLS) policies to control access to data

## Files

- `08_create_custom_access_token_hook.sql`: Creates the custom access token hook function
- `08_register_custom_access_token_hook.md`: Instructions for registering the hook in Supabase
- `09_create_authorize_function.sql`: Creates the basic authorization function
- `10_create_resource_authorize_function.sql`: Creates the resource-based authorization function
- `11_example_rls_policy.sql`: Example RLS policies using our authorize functions
- `12_update_rls_policies.sql`: Updates RLS policies for key tables in the system

## JWT Custom Claims

The custom access token hook adds the following claims to the JWT:

- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of objects with role, resource_type, and resource_id
- Profile information: first_name, last_name, organization_name, profile_role
- `test_claim`: A test claim to verify the hook is working

## Authorization Functions

We've created two authorization functions that use the JWT claims to check permissions:

### 1. Basic Authorization Function

```sql
CREATE OR REPLACE FUNCTION public.authorize(
  requested_permission text
)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
```

### 2. Resource-Based Authorization Function

```sql
CREATE OR REPLACE FUNCTION public.authorize_resource(
  requested_permission text,
  resource_type text,
  resource_id uuid
)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
```

## RLS Policies

We've created RLS policies for key tables in the system using our authorization functions. For example:

```sql
CREATE POLICY "Allow users with app.view permission" 
ON public.applications FOR SELECT 
USING (public.authorize('app.view'));

CREATE POLICY "Allow users with folder.view permission" 
ON public.application_folders FOR SELECT 
USING (public.authorize_resource('folder.view', 'application', application_id));
```

## Client-Side Integration

We've updated the client-side code to use the JWT claims:

1. `AuthContext.jsx`: Extracts JWT claims and provides them to the application
2. `ApplicationChooser.jsx`: Uses JWT claims to filter applications
3. `ApplicationContext.jsx`: Uses JWT claims to fetch applications

## Server-Side Integration

We've updated the server-side code to use the JWT claims:

1. `supabaseAuth.ts`: Extracts JWT claims and adds them to the request object
2. `ApplicationController.ts`: Uses JWT claims to filter applications

## Debugging

We've added a JWT debug middleware to the server that logs JWT claims when the `DEBUG_JWT` environment variable is set to 'true'.

```javascript
// JWT debug middleware
if (process.env.DEBUG_JWT === 'true') {
  app.use('/api/*', jwtDebugMiddleware);
}
``` 