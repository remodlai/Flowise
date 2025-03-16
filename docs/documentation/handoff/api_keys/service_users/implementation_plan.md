# Application Service Users and API Keys Implementation

## Overview

This document outlines the implementation plan for creating application-specific service users and associated API keys. This approach leverages Zuplo API Gateway for centralized traffic management, API key authentication, and JWT validation.

## Current Implementation

Currently, API keys are associated with a single platform admin user with an ID of all zeros. This approach lacks granularity and doesn't follow the principle of least privilege.

## Proposed Implementation

### Conceptual Flow

1. When a user clicks "Create API Key" (either during application creation or separately):
   - A modal appears with two options: "Create Personal Key" or "Create Service Key"
   
2. If "Create Personal Key" is selected:
   - The API key will be directly tied to the user's ID
   - The permissions will be based on the user's existing permissions
   - The modal will show options for key name and expiry date

3. If "Create Service Key" is selected:
   - The modal will show available permissions
   - Default permission level is view-only (lowest access)
   - User can select additional permissions or choose "global" which grants all permissions
   - User can set key name and expiry date

4. On the backend for Personal Keys:
   - Generate an API key with the specified expiry (default: 1 year)
   - Associate this API key directly with the user's ID
   - Return the API key to the UI for the user to save

5. On the backend for Service Keys:
   - Create a new service user with a name format like `{application_id}_{api_key_name}_service_user`
   - Grant the selected permissions to this service user
   - Generate an API key with the specified expiry
   - Associate this API key with the newly created service user
   - Return the API key to the UI for the user to save

### Zuplo API Gateway as Centralized Traffic Management

Zuplo API Gateway (api.remodl.ai) will serve as the central entry point for **ALL** traffic in the platform, including:

- UI to React Server communications
- React Server to Platform backend communications
- External API calls to the platform
- Platform calls to external services (when proxied)

This centralized approach provides complete control over every endpoint, resource, and communication path in the system, with the following benefits:

1. **Unified Traffic Control**: All requests flow through a single point where consistent policies can be applied
2. **Interception Capabilities**: Custom code can be executed between any communication path
3. **Secure Tunneling**: Private backends can connect to Zuplo via outbound connections, eliminating the need for public exposure
4. **Traffic Flow Control**: Sophisticated routing, path rewriting, and protocol translation

Zuplo will handle the following authentication mechanisms:

1. API Key Authentication:
   - Validating API keys using Zuplo's built-in API Key Authentication policy
   - Storing consumer metadata including permissions and roles
   - Supporting both header-based (`Authorization: Bearer {api_key}`) and query parameter-based authentication

2. JWT Authentication:
   - Validating JWTs from Supabase Auth using Zuplo's Supabase JWT Auth policy
   - Extracting claims from the JWT for authorization decisions
   - Supporting custom claims for specialized access control

3. Custom Authorization Policies:
   - Implementing custom TypeScript policies for resource-level permission checks
   - Validating user roles and permissions directly in the gateway
   - Enforcing application-specific access controls

4. Custom JWT Options:
   - For service accounts, we can create long-lived JWTs with extended expiry
   - Alternatively, we can use Supabase Auth to generate JWTs and reference them as API keys

### Database Changes

1. Create a new table for application service users:
   ```sql
   CREATE TABLE IF NOT EXISTS public.application_service_users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     created_by UUID NOT NULL REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE(application_id, name)
   );

   -- Add RLS policies
   ALTER TABLE public.application_service_users ENABLE ROW LEVEL SECURITY;

   -- Platform admins can manage all service users
   CREATE POLICY "Platform admins can manage all service users"
     ON public.application_service_users
     USING (is_platform_admin());

   -- Application admins can manage service users for their applications
   CREATE POLICY "Application admins can manage service users for their applications"
     ON public.application_service_users
     USING (user_has_application_access(application_id));
   ```

2. Modify the application_api_keys table to associate with either regular users or service users:
   ```sql
   -- Add service_user_id column to application_api_keys
   ALTER TABLE public.application_api_keys 
   ADD COLUMN service_user_id UUID REFERENCES application_service_users(id) ON DELETE CASCADE;
   
   -- Add is_personal_key flag to distinguish between personal and service keys
   ALTER TABLE public.application_api_keys
   ADD COLUMN is_personal_key BOOLEAN NOT NULL DEFAULT false;
   ```

3. Create a function to generate API keys:
   ```sql
   CREATE OR REPLACE FUNCTION public.generate_api_key(
     p_application_id UUID,
     p_key_name TEXT,
     p_is_personal_key BOOLEAN,
     p_service_user_name TEXT DEFAULT NULL,
     p_permissions TEXT[] DEFAULT NULL,
     p_expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 year')
   )
   RETURNS TEXT
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_service_user_id UUID;
     v_api_key TEXT;
     v_hashed_key TEXT;
     v_permission TEXT;
   BEGIN
     -- Generate API key
     v_api_key := encode(gen_random_bytes(32), 'base64');
     v_hashed_key := crypt(v_api_key, gen_salt('bf'));
     
     -- Handle personal key
     IF p_is_personal_key THEN
       -- Store API key as personal key
       INSERT INTO public.application_api_keys (
         application_id,
         key_name,
         api_key,
         hashed_key,
         expires_at,
         created_by,
         is_personal_key
       ) VALUES (
         p_application_id,
         p_key_name,
         v_api_key,
         v_hashed_key,
         p_expires_at,
         auth.uid(),
         true
       );
     ELSE
       -- Create service user
       INSERT INTO public.application_service_users (
         application_id,
         name,
         description,
         created_by
       ) VALUES (
         p_application_id,
         p_service_user_name,
         'Service user for API key: ' || p_key_name,
         auth.uid()
       )
       RETURNING id INTO v_service_user_id;
       
       -- Grant permissions to service user
       IF p_permissions IS NOT NULL THEN
         FOREACH v_permission IN ARRAY p_permissions
         LOOP
           -- Grant permission logic here
           -- This will depend on how permissions are stored and managed
         END LOOP;
       END IF;
       
       -- Store API key
       INSERT INTO public.application_api_keys (
         application_id,
         key_name,
         api_key,
         hashed_key,
         expires_at,
         created_by,
         service_user_id,
         is_personal_key
       ) VALUES (
         p_application_id,
         p_key_name,
         v_api_key,
         v_hashed_key,
         p_expires_at,
         auth.uid(),
         v_service_user_id,
         false
       );
     END IF;
     
     RETURN v_api_key;
   END;
   $$;
   ```

### Backend Implementation

1. Create a new controller for managing service users and API keys:
   - `ServiceUserController.ts` - Handles CRUD operations for service users
   - `ApiKeyController.ts` - Handles CRUD operations for API keys

2. Update the authentication middleware to handle API key authentication:
   - Verify API key against the database
   - Determine if it's a personal key or service key
   - For personal keys, use the associated user's ID and permissions
   - For service keys, retrieve associated service user and its permissions
   - Set up user context with appropriate permissions

3. Create services for managing service users and permissions:
   - `ServiceUserService.ts` - Business logic for service users
   - `ApiKeyService.ts` - Business logic for API keys

4. Review existing authentication code:
   - Ensure the auth code can handle both regular users and service users
   - Verify that permission checks work correctly with service users
   - Confirm that JWT claims processing works with service users
   - No major changes should be needed as we're working with the user claims

### Zuplo Policy Implementation

1. API Key Authentication Policy:
   ```javascript
   // Zuplo API Key Authentication Policy Configuration
   {
     "export": "ApiKeyInboundPolicy",
     "module": "$import(@zuplo/runtime)",
     "options": {
       "headerName": "authorization",
       "headerValuePrefix": "Bearer ",
       "queryStringParam": "api_key",
       "allowUnauthenticatedRequests": true
     }
   }
   ```

   This policy will:
   - Look for an API key in the `Authorization` header with the prefix `Bearer `
   - Alternatively, look for an API key in the `api_key` query parameter
   - Allow unauthenticated requests to pass through to the next policy
   - Make the consumer data available in the request context

2. Supabase JWT Authentication Policy:
   ```javascript
   // Zuplo Supabase JWT Authentication Policy Configuration
   {
     "export": "SupabaseJwtInboundPolicy",
     "module": "$import(@zuplo/runtime)",
     "options": {
       "secret": "$env(SUPABASE_JWT_SECRET)",
       "allowUnauthenticatedRequests": true,
       "requiredClaims": {
         "user_roles": ["*"]
       }
     }
   }
   ```

   This policy will:
   - Validate JWTs using the Supabase JWT secret
   - Allow unauthenticated requests to pass through to the next policy
   - Require that the JWT contains a `user_roles` claim
   - Make the JWT claims available in the request context
   
   **Note on Supabase JWT Structure**:
   - Supabase JWTs include a `sub` claim that contains the user's ID
   - The JWT also contains custom claims like `user_roles`, `is_platform_admin`, etc.
   - When decoded by Zuplo, these claims are accessible via `request.user.sub` and `request.user.data.*`

3. Authentication Enforcement Policy:
   ```typescript
   // Authentication Enforcement Policy
   export default async function authEnforcementPolicy(
     request: ZuploRequest,
     context: ZuploContext
   ) {
     // Check if the request has been authenticated by either policy
     if (!request.user?.sub) {
       return new Response("Unauthorized", { status: 401 });
     }
     
     // For debugging purposes, you can log the user object
     console.log("Authenticated user:", {
       sub: request.user.sub,
       data: request.user.data
     });
     
     // Request is authenticated, proceed
     return request;
   }
   ```

   This policy will:
   - Run after both authentication policies
   - Check if the request has been authenticated by either policy by verifying the presence of `request.user.sub`
   - Return a 401 Unauthorized response if not authenticated
   - Allow the request to proceed if authenticated
   - Optionally log the authenticated user information for debugging

4. URL Forwarding Configuration:
   ```javascript
   // Zuplo URL Forward Handler Configuration
   {
     "export": "urlForwardHandler",
     "module": "$import(@zuplo/runtime)",
     "options": {
       "baseUrl": "$env(BACKEND_SERVICE_URL)",
       "forwardSearch": true,
       "followRedirects": true
     }
   }
   ```

   This handler will:
   - Forward requests to the appropriate backend service
   - Preserve query parameters
   - Follow redirects if necessary
   - Support environment-specific backend URLs

5. Custom Resource Permission Check Policy:
   ```typescript
   // Custom Resource Permission Check Policy
   export default async function resourcePermissionPolicy(
     request: ZuploRequest,
     context: PolicyContext,
     options: ResourcePermissionOptions
   ): Promise<ZuploRequest> {
     // Extract resource ID from request path or body
     const resourceId = extractResourceId(request, options);
     
     if (!resourceId) {
       throw new HttpError(400, 'Resource ID is required');
     }
     
     // Get user data from the request context (set by previous policies)
     const user = request.user;
     
     if (!user) {
       throw new HttpError(401, 'Authentication required');
     }
     
     // Check if user is a platform admin
     if (user.data.is_platform_admin === true) {
       // Platform admins have access to all resources
       return request;
     }
     
     // Check if user has access to the resource
     const userRoles = user.data.user_roles || [];
     const hasAccess = userRoles.some(role => 
       (role.resource_id === resourceId || role.resource_id === '*') &&
       (options.requiredPermission ? role.permissions.includes(options.requiredPermission) : true)
     );
     
     if (!hasAccess) {
       throw new HttpError(403, 'Access denied to this resource');
     }
     
     return request;
   }
   
   interface ResourcePermissionOptions {
     resourceIdLocation: 'path' | 'query' | 'body';
     resourceIdParam: string;
     requiredPermission?: string;
   }
   
   function extractResourceId(request: ZuploRequest, options: ResourcePermissionOptions): string | null {
     switch (options.resourceIdLocation) {
       case 'path':
         return request.params[options.resourceIdParam] || null;
       case 'query':
         return new URL(request.url).searchParams.get(options.resourceIdParam);
       case 'body':
         try {
           const body = request.json();
           return body[options.resourceIdParam] || null;
         } catch (error) {
           return null;
         }
     }
   }
   ```

### Policy Order and Composition

The order of policies is critical for proper authentication. They should be applied in this sequence:

1. API Key Authentication Policy
2. Supabase JWT Authentication Policy
3. Authentication Enforcement Policy
4. Resource Permission Check Policy (if needed)
5. Other business logic policies

For better organization, these can be combined into a composite policy:

```javascript
// Composite Authentication Policy
{
  "export": "CompositePolicy",
  "module": "$import(@zuplo/runtime)",
  "options": {
    "policies": [
      {
        "export": "ApiKeyInboundPolicy",
        "module": "$import(@zuplo/runtime)",
        "options": {
          "headerName": "authorization",
          "headerValuePrefix": "Bearer ",
          "queryStringParam": "api_key",
          "allowUnauthenticatedRequests": true
        }
      },
      {
        "export": "SupabaseJwtInboundPolicy",
        "module": "$import(@zuplo/runtime)",
        "options": {
          "secret": "$env(SUPABASE_JWT_SECRET)",
          "allowUnauthenticatedRequests": true,
          "requiredClaims": {
            "user_roles": ["*"]
          }
        }
      },
      {
        "export": "authEnforcementPolicy",
        "module": "$import(./policies/auth-enforcement)"
      }
    ]
  }
}
```

This composite policy encapsulates the entire authentication flow and can be applied to routes as a single policy.

### Frontend Implementation

1. Create a modal component for API key creation:
   - Initial option to choose between Personal Key and Service Key
   - For Personal Keys:
     - Key name input
     - Expiry date selection (default: 1 year)
   - For Service Keys:
     - Permission selection UI
     - Key name input
     - Expiry date selection (default: 1 year)

2. Update the application settings page to include API key management:
   - List existing API keys (both personal and service)
   - Create new API keys
   - Revoke existing API keys

3. Add API key creation option during application creation flow

## Implementation Checklist

- [ ] Database schema changes
  - [ ] Create application_service_users table
  - [ ] Update application_api_keys table
  - [ ] Create necessary functions and triggers

- [ ] Backend implementation
  - [ ] Create ServiceUserController
  - [ ] Create ApiKeyController
  - [ ] Update authentication middleware
  - [ ] Create service user and API key services
  - [ ] Review existing auth code for compatibility

- [ ] Zuplo API Gateway implementation
  - [ ] Set up Zuplo project and configuration
  - [ ] Configure API key authentication policy
  - [ ] Configure Supabase JWT authentication policy
  - [ ] Implement authentication enforcement policy
  - [ ] Create composite authentication policy
  - [ ] Implement custom resource permission policy
  - [ ] Configure URL forwarding for all traffic types
  - [ ] Set up path rewriting and routing rules
  - [ ] Configure routes and endpoints
  - [ ] Set up secure communication between Zuplo and backend services
  - [ ] Implement circuit breaking for fault tolerance

- [ ] Frontend implementation
  - [ ] Create API key creation modal with Personal/Service options
  - [ ] Update application settings page
  - [ ] Add API key creation to application creation flow

- [ ] Testing
  - [ ] Unit tests for new controllers and services
  - [ ] Integration tests for API key creation and authentication
  - [ ] Test Zuplo policies and routes
  - [ ] UI tests for API key management
  - [ ] Test both personal and service keys
  - [ ] Test all traffic types through Zuplo (UI, API, internal)

- [ ] Documentation
  - [ ] Update API documentation
  - [ ] Create user guide for API key management
  - [ ] Update developer documentation
  - [ ] Document Zuplo architecture and policies
  - [ ] Document traffic flow through the system

## Security Considerations

- API keys should be securely stored (hashed in the database)
- API keys should have an expiration date
- API keys should be revocable
- Service users should follow the principle of least privilege
- All API key operations should be logged for audit purposes
- Personal keys inherit the user's permissions and are tied to the user's account
- Backend services should only accept requests from Zuplo
- Zuplo should implement proper error handling to avoid leaking sensitive information
- All traffic should be encrypted with TLS
- Backend services should not be directly exposed to the internet

## Performance Considerations

- Zuplo provides edge deployment in over 200 data centers worldwide
- JWT validation is performed at the gateway level, reducing backend load
- Permission checks are centralized at the gateway level
- Backend services receive pre-validated requests with user context
- Zuplo can implement caching for improved performance
- Circuit breaking prevents cascading failures

## Zuplo-Specific Features

### Centralized Traffic Management

Zuplo enables sophisticated traffic management through:

- **URL Forwarding**: Proxy requests to different backends based on route configuration
- **Path Rewriting**: Modify request paths before forwarding to backends
- **Protocol Translation**: Convert between different formats (JSON, XML, etc.)
- **Circuit Breaking**: Prevent cascading failures by detecting and handling service outages
- **Custom Middleware**: Execute custom code at any point in the request/response lifecycle

### API Key Management

Zuplo provides built-in API key management capabilities:

- API key creation and revocation through the developer portal
- Consumer management with metadata for permissions and roles
- Support for header-based and query parameter-based authentication
- Usage analytics and monitoring

### JWT Authentication

Zuplo's Supabase JWT authentication policy:

- Validates JWTs using the Supabase JWT secret
- Extracts claims for authorization decisions
- Supports required claims validation
- Makes JWT claims available in the request context

### Custom Policies

Zuplo allows for custom TypeScript policies:

- Implement complex authorization logic
- Access request context including user data
- Perform resource-level permission checks
- Return appropriate HTTP status codes and error messages

### Developer Portal

Zuplo generates a developer portal that includes:

- API documentation based on OpenAPI specifications
- Self-service API key management for consumers
- Usage analytics and monitoring
- Authentication and authorization documentation

## Future Enhancements

- Support for API key rotation
- Support for API key usage tracking
- Support for API key rate limiting
- Support for API key scopes (limiting access to specific endpoints)
- Integration with Zuplo's developer portal for self-service API key management
- Advanced traffic shaping and load balancing
- A/B testing through traffic splitting
- Enhanced monitoring and alerting

### JWT Structure and Claims

When using Supabase JWT authentication with Zuplo, it's important to understand how the JWT claims are structured and accessed:

1. **JWT Structure**:
   - The JWT contains standard claims like `sub` (subject/user ID), `iss` (issuer), and `exp` (expiration)
   - It also contains custom claims added by our custom access token hook, such as:
     - `user_roles`: Array of role objects with resource access information
     - `is_platform_admin`: Boolean indicating if the user is a platform admin
     - `organization`: Object with organization ID and name
     - `application`: Object with application ID and name

2. **Accessing Claims in Zuplo**:
   - Standard claims are accessible directly on the `request.user` object:
     - `request.user.sub`: The user's ID
     - `request.user.exp`: The token's expiration timestamp
   - Custom claims are accessible via the `request.user.data` object:
     - `request.user.data.user_roles`: The user's roles
     - `request.user.data.is_platform_admin`: Whether the user is a platform admin
     - `request.user.data.organization.id`: The organization ID
     - `request.user.data.application.id`: The application ID

3. **Example JWT Payload**:
   ```json
   {
     "sub": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
     "aud": "authenticated",
     "role": "authenticated",
     "exp": 1742059608,
     "iat": 1742056008,
     "iss": "https://voksjtjrshonjadwjozt.supabase.co/auth/v1",
     "user_roles": [
       {
         "resource_id": null,
         "resource_type": null,
         "role": "platform_admin"
       }
     ],
     "is_platform_admin": true,
     "organization": {
       "id": "a4233773-4128-4149-82a1-75db25dd460f",
       "name": "Remodl AI"
     },
     "application": {
       "id": "global",
       "name": "Global"
     }
   }
   ```

This understanding is crucial for implementing proper authorization checks in Zuplo policies. 