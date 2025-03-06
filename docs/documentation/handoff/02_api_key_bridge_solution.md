# API Key Bridge Solution

## Problem Statement

The Remodl AI platform currently has two separate authentication systems:

1. **Legacy API Key System**: Used by the original Flowise platform for authenticating API requests
2. **Supabase Auth System**: Used for the new multi-tenant architecture with JWT tokens and RBAC

These systems operate independently with no correlation between them. When a client uses a legacy API key to access endpoints protected by the Supabase authentication middleware (`/api/v1/*`), the request fails with "Invalid authentication token" errors because the API key is not a valid Supabase JWT token.

## Proposed Solution

Create a bridge middleware that can:
1. Detect and validate legacy API keys
2. Generate temporary Supabase JWT tokens with appropriate permissions
3. Attach these tokens to requests for the Supabase auth middleware

This approach allows legacy API keys to continue working with the new Supabase-based auth system without requiring changes to existing clients.

## Implementation Details

### 1. Create a New Middleware

Create a new middleware called `apiKeyBridgeMiddleware` that runs before the Supabase authentication middleware:

```typescript
// packages/server/src/utils/apiKeyBridge.ts
import { Request, Response, NextFunction } from 'express'
import { validateAPIKey } from './validateKey'
import { generateTemporarySupabaseToken } from './supabaseAuth'

export const apiKeyBridgeMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip for requests that already have a valid JWT token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1]
    
    // Check if this is a legacy API key (not a JWT)
    if (!token.includes('.')) {
      // This is likely an API key, not a JWT token
      const isValidApiKey = await validateAPIKey(req)
      
      if (isValidApiKey) {
        // Generate a temporary Supabase token with appropriate permissions
        const tempToken = await generateTemporarySupabaseToken()
        
        // Replace the API key with the temporary token
        req.headers.authorization = `Bearer ${tempToken}`
        
        // Add a flag to indicate this request was authenticated via API key
        req.apiKeyAuthenticated = true
      }
    }
    
    next()
  } catch (error) {
    console.error('API Key Bridge error:', error)
    next()
  }
}
```

### 2. Add Token Generation Function

Add a function to generate temporary Supabase tokens:

```typescript
// packages/server/src/utils/supabaseAuth.ts (add to existing file)
import jwt from 'jsonwebtoken'

/**
 * Generate a temporary Supabase token for API key authentication
 * @returns {Promise<string>} Temporary Supabase JWT token
 */
export const generateTemporarySupabaseToken = async (): Promise<string> => {
  // Create a service account or system user in Supabase for API key authentication
  const API_KEY_SERVICE_USER_ID = process.env.API_KEY_SERVICE_USER_ID || 'api-key-service-user'
  
  // Set up claims for the token
  const claims = {
    sub: API_KEY_SERVICE_USER_ID,
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    
    // Add custom claims for API key authentication
    is_api_key_auth: true,
    
    // Add minimal permissions needed for API key operations
    // These should be configured based on your security requirements
    user_roles: ['api_client']
  }
  
  // Sign the JWT with the Supabase JWT secret
  const secret = process.env.SUPABASE_JWT_SECRET || ''
  return jwt.sign(claims, secret, { algorithm: 'HS256' })
}
```

### 3. Update the Express App Configuration

Modify the Express app configuration to use the new middleware:

```typescript
// packages/server/src/index.ts (modify existing code)

// Add import for the new middleware
import { apiKeyBridgeMiddleware } from './utils/apiKeyBridge'

// ...

// Apply the API key bridge middleware before the Supabase auth middleware
this.app.use('/api/v1', apiKeyBridgeMiddleware)
this.app.use('/api/v1', authenticateUser)
```

### 4. Create a Supabase Migration for API Key Role

Create a migration to add an 'api_client' role in Supabase with appropriate permissions:

```sql
-- packages/server/src/migrations/multi-tenant/api_key_bridge/01_api_client_role.sql

-- Create the api_client role if it doesn't exist
INSERT INTO public.roles (id, name, description, context_type, context_id, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  'api_client', 
  'Role for legacy API key authentication', 
  'platform', 
  NULL, 
  now(), 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles WHERE name = 'api_client' AND context_type = 'platform'
);

-- Get the role ID
DO $$
DECLARE
  role_id UUID;
BEGIN
  SELECT id INTO role_id FROM public.roles WHERE name = 'api_client' AND context_type = 'platform';
  
  -- Add necessary permissions for API operations
  INSERT INTO public.role_permissions (role_id, permission, created_at)
  VALUES 
    (role_id, 'chatflow.execute', now()),
    (role_id, 'chatflow.read', now()),
    (role_id, 'credential.use', now())
  ON CONFLICT (role_id, permission) DO NOTHING;
END
$$;
```

### 5. Update RLS Policies

Update the Row-Level Security policies to allow access for requests authenticated via API keys:

```sql
-- packages/server/src/migrations/multi-tenant/api_key_bridge/02_update_rls_policies.sql

-- Create a helper function to check if the request is from an API key
CREATE OR REPLACE FUNCTION auth.is_api_key_auth()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN coalesce(current_setting('request.jwt.claims.is_api_key_auth', true)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow API key access where appropriate
-- Example for chatflows table:
CREATE POLICY "Allow API key access to chatflows" 
ON public.chatflows
FOR ALL
TO authenticated
USING (auth.is_api_key_auth());
```

### 6. Update Custom Access Token Hook

Update the custom access token hook to handle API key authentication:

```sql
-- packages/server/src/migrations/multi-tenant/custom_access_hooks/api_key_bridge_hook.sql

-- Update the custom access token hook to handle API key authentication
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_metadata jsonb;
  is_api_key_auth boolean;
BEGIN
  claims := event->'claims';
  
  -- Check if this is an API key authentication
  is_api_key_auth := (claims->>'is_api_key_auth')::boolean;
  
  IF is_api_key_auth THEN
    -- For API key authentication, we don't need to fetch user metadata
    -- The claims are already set in the generateTemporarySupabaseToken function
    NULL;
  ELSE
    -- Regular user authentication - existing logic
    -- Get the user metadata from the users table or any other source
    SELECT meta INTO user_metadata 
    FROM public.user_profiles 
    WHERE user_id = (event->>'user_id')::uuid;

    IF user_metadata IS NOT NULL THEN
      -- Add existing custom claims logic
      -- ...
    END IF;
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  -- Return the modified event
  return event;
END;
$$;
```

## Environment Configuration

Add the following environment variables:

```
# API Key Bridge Configuration
API_KEY_SERVICE_USER_ID=api-key-service-user
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

## Security Considerations

1. **Token Expiration**: The temporary tokens should have a short expiration time (e.g., 1 hour) to minimize security risks.

2. **Limited Permissions**: The API key service user should have only the minimum permissions required for API operations.

3. **Audit Logging**: Implement audit logging for all API key authentications to track usage and detect potential security issues.

4. **Rate Limiting**: Apply rate limiting to API key requests to prevent abuse.

5. **Gradual Migration**: Consider this as a temporary solution while gradually migrating clients to use the new Supabase authentication system.

## Testing

1. **Unit Tests**: Create unit tests for the `apiKeyBridgeMiddleware` and `generateTemporarySupabaseToken` functions.

2. **Integration Tests**: Test the complete authentication flow with both legacy API keys and Supabase JWT tokens.

3. **Security Tests**: Perform security testing to ensure the solution doesn't introduce vulnerabilities.

## Deployment Considerations

1. **Rollout Strategy**: Deploy the changes in stages, starting with development and testing environments.

2. **Monitoring**: Implement monitoring to track API key usage and detect any issues.

3. **Fallback Plan**: Have a fallback plan in case of unexpected issues with the bridge middleware.

## Future Improvements

1. **API Key Management UI**: Add UI components to manage API keys and their permissions.

2. **Migration Tool**: Create a tool to help clients migrate from legacy API keys to Supabase authentication.

3. **Deprecation Plan**: Develop a plan to eventually deprecate legacy API keys in favor of the Supabase authentication system. 