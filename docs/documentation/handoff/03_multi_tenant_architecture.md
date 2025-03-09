# Multi-tenant Architecture with Supabase

## Overview

The Remodl AI platform implements a multi-tenant architecture using Supabase for authentication, database, and storage. This architecture allows the platform to serve multiple applications, organizations, and users while maintaining proper isolation and access control.

## Key Components

### 1. Supabase Authentication

Supabase Auth is used for user authentication and authorization:

- **JWT-based Authentication**: Users authenticate with Supabase Auth and receive JWT tokens
- **Custom Claims**: JWT tokens include custom claims for user roles, permissions, and other metadata
- **Row-Level Security (RLS)**: Supabase RLS policies enforce access control at the database level

### 2. Multi-tenant Data Model

The data model is designed to support multiple levels of tenancy:

- **Applications**: Top-level containers that can have multiple organizations
- **Organizations**: Groups of users within an application
- **Users**: Individual users who can belong to multiple organizations

### 3. Row-Level Security (RLS)

RLS policies enforce data isolation and access control:

- **Application-level Policies**: Control access to application resources
- **Organization-level Policies**: Control access to organization resources
- **User-level Policies**: Control access to user-specific resources

### 4. Custom Access Hooks

Custom access hooks add claims to JWT tokens:

- **User Identification**: 
  - `userId`: Direct copy of the user's UUID for easier access
  - `sub`: The original Supabase user ID

- **Organization Context**: 
  - `organizationId`: The user's primary organization ID
  - `organization_name`: The name of the user's organization

- **Role and Permission Information**:
  - `is_platform_admin`: Boolean indicating if the user is a platform admin
  - `user_roles`: Array of objects with role, resource_type, and resource_id
  - `profile_role`: The user's role from their profile

- **User Profile Information**:
  - `first_name`: User's first name
  - `last_name`: User's last name

The current JWT structure is implemented in the `custom_access_token_hook` function, which:
1. Extracts user information from the `user_profiles` table
2. Determines if the user is a platform admin
3. Retrieves the user's primary organization ID from either:
   - The `user_profiles.meta->>'organization_id'` field
   - The first organization in the `organization_users` table
4. Gets the user's roles with resource context
5. Adds all this information to the JWT claims

For more details on the JWT structure and implementation, see [JWT Claims Update](./jwt_claims_update.md).

## Data Model

### Core Tables

1. **applications**
   ```sql
   CREATE TABLE public.applications (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       description TEXT,
       logo_url TEXT,
       url TEXT,
       version TEXT DEFAULT '1.0.0',
       type TEXT DEFAULT 'standard',
       status TEXT DEFAULT 'active',
       created_at TIMESTAMPTZ DEFAULT now(),
       updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. **organizations**
   ```sql
   CREATE TABLE public.organizations (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       description TEXT,
       application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
       status TEXT DEFAULT 'active',
       created_at TIMESTAMPTZ DEFAULT now(),
       updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

3. **roles**
   ```sql
   CREATE TABLE public.roles (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name TEXT NOT NULL,
       description TEXT,
       base_role TEXT,
       context_type TEXT NOT NULL,
       context_id UUID,
       created_by UUID NOT NULL REFERENCES auth.users(id),
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       UNIQUE(name, context_type, context_id)
   );
   ```

4. **user_roles**
   ```sql
   CREATE TABLE public.user_roles (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       UNIQUE(user_id, role_id)
   );
   ```

5. **role_permissions**
   ```sql
   CREATE TABLE public.role_permissions (
       role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
       permission TEXT NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       PRIMARY KEY (role_id, permission)
   );
   ```

## Authentication Flow

1. **User Login**:
   - User logs in via Supabase Auth (email/password, OAuth, etc.)
   - Supabase generates a JWT token with basic claims

2. **Custom Claims**:
   - The `custom_access_token_hook` function adds custom claims to the JWT
   - Claims include user roles, permissions, and other metadata

3. **API Requests**:
   - Client includes the JWT token in the Authorization header
   - Server validates the token and extracts user information
   - RLS policies enforce access control based on the JWT claims

## Row-Level Security (RLS) Policies

### Application Access

```sql
-- Allow platform admins to access all applications
CREATE POLICY "Platform admins can access all applications" 
ON public.applications
FOR ALL
TO authenticated
USING (authorize('platform.global'));

-- Allow users with app.view permission to read applications
CREATE POLICY "Users with app.view can read applications" 
ON public.applications
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON rp.role_id = r.id
  WHERE ur.user_id = auth.uid()
  AND r.context_type = 'platform'
  AND rp.permission = 'app.view'
));
```

### Organization Access

```sql
-- Allow users to access organizations they belong to
CREATE POLICY "Users can access their organizations" 
ON public.organizations
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid()
  AND r.context_type = 'organization'
  AND r.context_id = organizations.id
));
```

## Helper Functions

### authorize

The `authorize` function checks if a user has a specific permission:

```sql
CREATE OR REPLACE FUNCTION authorize(required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is platform admin
  IF current_setting('request.jwt.claims.is_platform_admin', true)::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Check if user has the required permission through any of their roles
  RETURN EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(current_setting('request.jwt.claims.user_roles', true)::jsonb) AS role_id
    JOIN public.role_permissions rp ON rp.role_id = role_id::uuid
    WHERE rp.permission = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### authorize_resource

The `authorize_resource` function checks if a user has permission for a specific resource:

```sql
CREATE OR REPLACE FUNCTION authorize_resource(required_permission TEXT, resource_type TEXT, resource_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is platform admin
  IF current_setting('request.jwt.claims.is_platform_admin', true)::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Check if user has the required permission for the specific resource
  RETURN EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(current_setting('request.jwt.claims.user_roles', true)::jsonb) AS role_id
    JOIN public.roles r ON r.id = role_id::uuid
    JOIN public.role_permissions rp ON rp.role_id = r.id
    WHERE rp.permission = required_permission
    AND (
      (r.context_type = resource_type AND r.context_id = resource_id)
      OR
      (r.context_type = 'platform')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Custom Access Token Hook

The custom access token hook adds claims to JWT tokens:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_id uuid;
  is_platform_admin boolean;
  user_roles jsonb;
BEGIN
  claims := event->'claims';
  user_id := (event->>'user_id')::uuid;
  
  -- Check if user is platform admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id
    AND r.name = 'platform_admin'
    AND r.context_type = 'platform'
  ) INTO is_platform_admin;
  
  -- Add platform admin status to claims
  claims := jsonb_set(claims, '{is_platform_admin}', to_jsonb(is_platform_admin));
  
  -- Get user roles
  SELECT jsonb_agg(ur.role_id)
  FROM user_roles ur
  WHERE ur.user_id = user_id
  INTO user_roles;
  
  -- Add user roles to claims
  claims := jsonb_set(claims, '{user_roles}', coalesce(user_roles, '[]'::jsonb));
  
  -- Get user profile information
  SELECT
    jsonb_set(
      jsonb_set(
        claims,
        '{first_name}',
        to_jsonb(COALESCE(up.first_name, ''))
      ),
      '{last_name}',
      to_jsonb(COALESCE(up.last_name, ''))
    )
  FROM user_profiles up
  WHERE up.user_id = user_id
  INTO claims;
  
  -- Update the claims in the event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;
```

## Integration with Express

The Express application integrates with Supabase Auth:

```typescript
// packages/server/src/utils/supabaseAuth.ts
import { Request, Response, NextFunction } from 'express'
import { supabase } from './supabase'
import { IUser } from '../Interface'

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip authentication for public routes
    if (req.path.includes('/public/') || req.path === '/login' /* other public routes */) {
      return next()
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized Access' })
      return
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1]
    
    // Validate the token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token)
    
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid authentication token' })
      return
    }
    
    // Set the user object on the request with JWT claims
    const user: IUser = {
      userId: data.user.id,
      email: data.user.email,
      // ... other user properties from JWT claims
    }
    
    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ error: 'Server error during authentication' })
  }
}
```

## Current Challenges

1. **Legacy API Key Integration**: The legacy API key system doesn't integrate with the Supabase auth system.

2. **Environment-Specific Configuration**: Different environments (dev, prod) use different secret storage mechanisms.

3. **Permission Granularity**: Some operations require more fine-grained permissions than currently implemented.

## Next Steps

1. **API Key Bridge**: Implement the API key bridge solution to integrate legacy API keys with Supabase auth.

2. **Enhanced RLS Policies**: Refine RLS policies to provide more granular access control.

3. **Unified Secret Management**: Standardize secret management across environments.

4. **User Interface Improvements**: Enhance the UI for managing roles, permissions, and API keys. 