# JWT Custom Claims and Authorization

This document provides a comprehensive overview of the JWT custom claims implementation and authorization functions in the Flowise platform.

## Table of Contents

1. [Overview](#overview)
2. [JWT Custom Claims](#jwt-custom-claims)
3. [Authorization Functions](#authorization-functions)
4. [Implementation Steps](#implementation-steps)
5. [Usage Examples](#usage-examples)
6. [Debugging](#debugging)

## Overview

We've implemented a Role-Based Access Control (RBAC) system using Supabase's custom JWT claims and PostgreSQL functions. This system allows us to:

1. Add custom claims to user JWTs, including role information and profile data
2. Create authorization functions that check these claims for permissions
3. Use these functions in Row Level Security (RLS) policies to control access to data

This approach reduces database queries by including authorization information directly in the JWT, improving performance and security.

## JWT Custom Claims

### Custom Access Token Hook

We've created a custom access token hook that adds the following claims to the JWT:

- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of objects with role, resource_type, and resource_id
- Profile information: first_name, last_name, organization_name, profile_role
- `test_claim`: A test claim to verify the hook is working

### Example JWT

```json
{
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1741240326
    }
  ],
  "app_metadata": {
    "provider": "email",
    "providers": [
      "email"
    ]
  },
  "aud": [
    "authenticated"
  ],
  "email": "brian+test@remodl.ai",
  "exp": 1741243926,
  "first_name": "Brian",
  "iat": 1741240326,
  "is_anonymous": false,
  "is_platform_admin": true,
  "iss": "https://voksjtjrshonjadwjozt.supabase.co/auth/v1",
  "last_name": "Bagdasarian",
  "organization_name": "Remodl AI",
  "phone": "",
  "profile_role": "platform_admin",
  "role": "authenticated",
  "session_id": "4ec7ba42-808a-4c65-910e-62f3866ce725",
  "sub": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
  "test_claim": "CUSTOM_ACCESS_TOKEN_HOOK_WORKING",
  "user_metadata": {
    "email_verified": true,
    "role": "platform_admin"
  },
  "user_roles": [
    {
      "resource_id": null,
      "resource_type": null,
      "role": "platform_admin"
    }
  ]
}
```

### Implementation Files

The JWT custom claims implementation consists of the following files:

1. `packages/server/src/migrations/multi-tenant/jwt_hook/08_create_custom_access_token_hook.sql`: Creates the custom access token hook function
2. `packages/server/src/migrations/multi-tenant/jwt_hook/08_register_custom_access_token_hook.md`: Instructions for registering the hook in Supabase

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

This function checks if a user has a specific permission based on their roles in the JWT claims.

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

This function extends the basic authorization function to check permissions for specific resources.

### Implementation Files

The authorization functions are implemented in the following files:

1. `packages/server/src/migrations/multi-tenant/jwt_hook/09_create_authorize_function.sql`: Creates the basic authorization function
2. `packages/server/src/migrations/multi-tenant/jwt_hook/10_create_resource_authorize_function.sql`: Creates the resource-based authorization function

## Implementation Steps

The implementation of JWT custom claims and authorization functions involved the following steps:

1. **Create the JWT Custom Claims Hook**:
   - Created the `custom_access_token_hook` function that adds custom claims to the JWT
   - Added profile information, platform admin status, and user roles to the JWT

2. **Register the Hook in Supabase**:
   - Created instructions for registering the hook in the Supabase dashboard
   - Documented the process in `08_register_custom_access_token_hook.md`

3. **Create Authorization Functions**:
   - Created the `authorize` function for basic permission checks
   - Created the `authorize_resource` function for resource-based permission checks
   - Granted necessary permissions to these functions

4. **Update the Changelog**:
   - Documented the changes in `custom_access_hooks_changelog.md`
   - Added a new entry for the custom access token hook

## Usage Examples

### Using Authorization Functions in RLS Policies

Here's how to use the authorization functions in RLS policies:

```sql
-- Enable RLS on a table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create a policy for viewing projects
CREATE POLICY view_projects ON public.projects
FOR SELECT
USING (
  public.authorize('view_project')
);

-- Create a policy for updating projects
CREATE POLICY update_projects ON public.projects
FOR UPDATE
USING (
  public.authorize('update_project')
)
WITH CHECK (
  public.authorize('update_project')
);

-- Create a resource-based policy
CREATE POLICY view_tasks ON public.tasks
FOR SELECT
USING (
  public.authorize_resource('view_task', 'project', project_id)
);
```

### Accessing JWT Claims in JavaScript

To access the JWT claims in your JavaScript code:

```javascript
import { supabase } from './supabaseClient';

// Get the current session
const session = supabase.auth.getSession();

// Access the JWT claims
const { access_token } = session.data.session;

// Decode the JWT (you can use a library like jwt-decode)
import { jwtDecode } from 'jwt-decode';
const decodedToken = jwtDecode(access_token);

// Access the custom claims
const isPlatformAdmin = decodedToken.is_platform_admin;
const userRoles = decodedToken.user_roles;
const firstName = decodedToken.first_name;
```

## Debugging

### JWT Debug Middleware

We've added a JWT debug middleware to the server that logs JWT claims when the `DEBUG_JWT` environment variable is set to 'true'. This helps with debugging JWT-related issues.

```javascript
// JWT debug middleware
if (process.env.DEBUG_JWT === 'true') {
  app.use('/api/*', jwtDebugMiddleware);
}
```

### Testing the JWT Hook

To test if the JWT hook is working:

1. Log out and log back in to get a new JWT with the custom claims
2. Check the JWT for the `test_claim` with value "CUSTOM_ACCESS_TOKEN_HOOK_WORKING"
3. Verify that the `user_roles` array contains the expected roles
4. Confirm that `is_platform_admin` is set correctly

### Troubleshooting

If the JWT claims are not appearing:

1. Make sure the hook is registered in the Supabase dashboard
2. Check that the user has the appropriate roles in the database
3. Verify that the user has logged out and logged back in to get a new JWT
4. Enable the JWT debug middleware to see the actual JWT claims

## Conclusion

The JWT custom claims and authorization functions provide a robust RBAC system for the Flowise platform. By including authorization information directly in the JWT, we reduce database queries and improve performance while maintaining security.

This implementation follows the best practices outlined in the Supabase documentation for custom claims and RBAC, adapted to our specific needs and data structure. 