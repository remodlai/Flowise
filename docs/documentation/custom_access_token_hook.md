# Custom Access Token Hook Implementation

## Overview

This document details the implementation of the Custom Access Token Hook in the Remodl AI platform. The hook is responsible for adding custom claims to the JWT token issued by Supabase Auth, which are then used for authorization in Row Level Security (RLS) policies.

## Current Implementation

The current implementation of the custom access token hook adds several important claims to the JWT token:

- `is_platform_admin`: Boolean indicating if the user is a platform admin
- `user_roles`: Array of objects with role, resource_type, and resource_id
- Profile information: first_name, last_name, organization_name, profile_role
- `test_claim`: A test claim to verify the hook is working

## Hook Function Definition

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  remodl_user_id uuid;
  profile_data record;
  user_roles jsonb;
BEGIN
  -- Extract the user_id and claims from the event
  remodl_user_id := (event->>'user_id')::uuid;
  claims := event->'claims';
  
  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{test_claim}', '"CUSTOM_ACCESS_TOKEN_HOOK_WORKING"');

  -- Check if user is platform admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = remodl_user_id AND up.meta->>'role' = 'platform_admin'
  ) INTO profile_data;

  -- Set platform admin status if found
  IF profile_data IS NOT NULL THEN
    claims := jsonb_set(claims, '{is_platform_admin}', 'true');
  ELSE
    claims := jsonb_set(claims, '{is_platform_admin}', 'false');
  END IF;

  -- Get profile information from user_profiles table
  BEGIN
    -- Use a more explicit query to avoid ambiguous column references
    SELECT 
      up.meta->'first_name' AS first_name,
      up.meta->'last_name' AS last_name,
      up.meta->'organization_name' AS organization_name,
      up.meta->'role' AS role
    INTO profile_data
    FROM public.user_profiles AS up
    WHERE up.user_id = remodl_user_id;

    -- Add profile information to claims if available
    IF profile_data IS NOT NULL THEN
      claims := jsonb_set(claims, '{first_name}', profile_data.first_name);
      claims := jsonb_set(claims, '{last_name}', profile_data.last_name);
      claims := jsonb_set(claims, '{organization_name}', profile_data.organization_name);
      claims := jsonb_set(claims, '{profile_role}', profile_data.role);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, add error message to claims and continue
    claims := jsonb_set(claims, '{profile_error}', to_jsonb(SQLERRM));
  END;

  -- Get user roles with resource information
  SELECT jsonb_agg(
    jsonb_build_object(
      'role', r.name,
      'resource_type', ur.resource_type,
      'resource_id', ur.resource_id
    )
  )
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = remodl_user_id
  INTO user_roles;

  -- Set user roles
  IF user_roles IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_roles}', user_roles);
  ELSE
    claims := jsonb_set(claims, '{user_roles}', '[]');
  END IF;

  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  RETURN event;
END;
$$;
```

## Required Permissions

For the hook to function properly, the following permissions must be granted:

```sql
-- Grant usage on the public schema to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Grant execute permission on the hook function to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke execute permission from other roles for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Grant access to the user_roles table to supabase_auth_admin
GRANT SELECT ON TABLE public.user_roles TO supabase_auth_admin;
GRANT SELECT ON TABLE public.roles TO supabase_auth_admin;
GRANT SELECT ON TABLE public.user_profiles TO supabase_auth_admin;
```

## Enabling the Hook

To enable the hook in Supabase:

1. Navigate to the Supabase Dashboard
2. Go to Authentication > Hooks (Beta)
3. In the "Custom Access Token" section, select the `public.custom_access_token_hook` function
4. Click "Save"

## Example JWT Claims

When the hook is working correctly, the JWT token will contain claims similar to:

```json
{
  "aud": "authenticated",
  "exp": 1741286410,
  "sub": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
  "email": "user@example.com",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "email_verified": true,
    "role": "platform_admin"
  },
  "role": "authenticated",
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1741282810
    }
  ],
  "session_id": "0168f7c8-4bc4-496e-ac51-cd23aa0205d9",
  "test_claim": "CUSTOM_ACCESS_TOKEN_HOOK_WORKING",
  "is_platform_admin": true,
  "first_name": "John",
  "last_name": "Doe",
  "organization_name": "Remodl AI",
  "profile_role": "platform_admin",
  "user_roles": [
    {
      "role": "platform_admin",
      "resource_type": null,
      "resource_id": null
    }
  ]
}
```

## Debugging the Hook

If the hook is not working as expected, you can:

1. Check if the `test_claim` is present in the JWT token
2. Look for any `profile_error` claim which would indicate an error in the hook
3. Verify that the user has roles assigned in the `user_roles` table
4. Check that the hook is properly registered in the Supabase dashboard

## Potential Improvements

1. **Error Handling**: Add more robust error handling to catch specific exceptions
2. **Performance Optimization**: Cache frequently accessed data to improve performance
3. **Security Enhancements**: Add additional checks to prevent unauthorized access
4. **Versioning**: Implement a versioning system for the hook to track changes
5. **Logging**: Add logging to track hook execution and diagnose issues

## Differences from Supabase Documentation

Our implementation differs from the basic example in the Supabase documentation in several ways:

1. We use text values for roles and permissions instead of enums
2. We include resource-based access control with resource_type and resource_id
3. We add profile information to the JWT claims
4. We have a more complex role hierarchy with platform, application, and organization contexts

These differences allow for a more flexible and powerful RBAC system that can handle the complex requirements of our multi-tenant platform.

## References

- [Supabase Auth Hooks Documentation](https://supabase.com/docs/guides/auth/auth-hooks)
- [Supabase Custom Claims & RBAC Documentation](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
- [JWT.io - Debugger for JWT tokens](https://jwt.io/) 