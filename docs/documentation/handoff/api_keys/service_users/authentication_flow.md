# API Key Authentication Flow with Zuplo API Gateway

## Overview

This document outlines the authentication flow for API keys in the Remodl AI platform using Zuplo API Gateway. It covers both personal API keys (tied directly to a user) and service API keys (tied to a service user with specific permissions).

## Architecture

The Remodl AI platform uses a multi-layered authentication approach:

1. **Zuplo API Gateway** (api.remodl.ai): The entry point for all API traffic
2. **Supabase Auth**: Handles user authentication and JWT generation
3. **Backend Services**: Process requests after authentication

This architecture provides several benefits:
- Centralized authentication and authorization
- Consistent policy enforcement
- Protection of backend services
- Simplified client integration

## Authentication Flow

### 1. API Key Submission

The client includes the API key in the request using one of the following methods:

- **HTTP Header**: `Authorization: Bearer {api_key}`
- **Query Parameter**: `?api_key={api_key}` (if configured)

### 2. Zuplo API Gateway Processing

When a request with an API key is received by Zuplo:

1. Zuplo extracts the API key from the request
2. Zuplo validates the API key against its configuration
3. Zuplo checks if the API key has the necessary permissions for the requested endpoint
4. If valid, Zuplo adds a secure shared secret to the request before forwarding to backend services
5. If invalid, Zuplo returns an appropriate error response without forwarding the request

### 3. Backend Service Verification

When the backend service receives the request:

1. The service verifies that the request includes the secure shared secret from Zuplo
2. The service extracts the user context from the request headers added by Zuplo
3. The service processes the request based on the authenticated user's permissions

### 4. User Context Setup

Based on the type of API key, Zuplo sets up the user context:

#### For Personal Keys:

1. The user ID is set to the `created_by` value of the API key
2. The user's permissions are retrieved from Supabase
3. The user context is set up with the user's ID and permissions

#### For Service Keys:

1. The user ID is set to the `service_user_id` value of the API key
2. The service user's permissions are retrieved from Supabase
3. The user context is set up with the service user's ID and permissions

### 5. Request Processing

Once the user context is set up, the request is processed:

1. Zuplo checks if the user has the required permissions for the requested operation
2. If the user has the required permissions, the request is forwarded to the appropriate backend service
3. If the user does not have the required permissions, a 403 Forbidden response is returned

### 6. Usage Tracking

After processing the request, Zuplo:

1. Logs the API key usage for analytics
2. Updates rate limiting counters if applicable
3. Collects metrics on response time and status

## Zuplo Policy Implementation

Zuplo uses policies to enforce authentication and authorization:

### API Key Validation Policy

```javascript
// Example Zuplo API Key Validation Policy
export default class ApiKeyValidationPolicy implements ZuploRequest {
  async handle(request: ZuploRequest, context: PolicyContext): Promise<ZuploRequest> {
    // Extract API key from request
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      throw new HttpError(401, 'API key is required');
    }
    
    // Validate API key (implementation depends on storage method)
    const apiKeyData = await validateApiKey(apiKey, context);
    
    if (!apiKeyData) {
      throw new HttpError(401, 'Invalid API key');
    }
    
    // Add user context to request for backend services
    request.headers.set('x-user-id', apiKeyData.userId);
    request.headers.set('x-user-roles', JSON.stringify(apiKeyData.roles));
    request.headers.set('x-api-key-type', apiKeyData.isPersonalKey ? 'personal' : 'service');
    
    // Add secure shared secret for backend verification
    request.headers.set('x-gateway-secret', context.environment.GATEWAY_SECRET);
    
    return request;
  }
}
```

### JWT Validation Policy

```javascript
// Example Zuplo JWT Validation Policy
export default class JwtValidationPolicy implements ZuploRequest {
  async handle(request: ZuploRequest, context: PolicyContext): Promise<ZuploRequest> {
    // Extract JWT from request
    const jwt = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!jwt) {
      throw new HttpError(401, 'JWT is required');
    }
    
    // Validate JWT using Supabase public key
    const jwtData = await validateJwt(jwt, context);
    
    if (!jwtData) {
      throw new HttpError(401, 'Invalid JWT');
    }
    
    // Add user context to request for backend services
    request.headers.set('x-user-id', jwtData.sub);
    request.headers.set('x-user-roles', JSON.stringify(jwtData.user_roles));
    request.headers.set('x-is-platform-admin', jwtData.is_platform_admin ? 'true' : 'false');
    
    // Add secure shared secret for backend verification
    request.headers.set('x-gateway-secret', context.environment.GATEWAY_SECRET);
    
    return request;
  }
}
```

## Backend Implementation

### Gateway Secret Verification

Backend services must verify that requests come from Zuplo:

```typescript
// Example gateway secret verification middleware
export const verifyGatewaySecret = (req: Request, res: Response, next: NextFunction) => {
  const gatewaySecret = req.headers['x-gateway-secret'];
  
  if (!gatewaySecret || gatewaySecret !== process.env.GATEWAY_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid gateway secret'
    });
  }
  
  // Extract user context from headers
  req.user = {
    userId: req.headers['x-user-id'],
    roles: JSON.parse(req.headers['x-user-roles'] || '[]'),
    isPlatformAdmin: req.headers['x-is-platform-admin'] === 'true',
    apiKeyType: req.headers['x-api-key-type']
  };
  
  return next();
};
```

### API Key Management

API keys are still managed in Supabase, but validation happens at the Zuplo layer:

```typescript
// Example API key creation function
export const createApiKey = async (req: Request, res: Response) => {
  try {
    const { keyName, isPersonalKey, serviceUserName, permissions, expiresAt } = req.body;
    const app = getInstance();
    
    if (!app || !app.Supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    // Create API key in Supabase
    const { data, error } = await app.Supabase.rpc('generate_api_key', {
      p_application_id: req.params.applicationId,
      p_key_name: keyName,
      p_is_personal_key: isPersonalKey,
      p_service_user_name: serviceUserName,
      p_permissions: permissions,
      p_expires_at: expiresAt
    });
    
    if (error) {
      throw error;
    }
    
    // Notify Zuplo of new API key (if using Zuplo's API key storage)
    // This step may not be necessary if Zuplo validates against Supabase directly
    
    return res.status(200).json({
      success: true,
      data: {
        apiKey: data
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

## Security Considerations

- API keys should be transmitted securely (HTTPS only)
- API keys should be stored securely (hashed in the database)
- API keys should have an expiration date
- API keys should be revocable
- Failed API key authentication attempts should be logged
- Rate limiting should be applied to prevent brute force attacks
- Backend services should only accept requests from Zuplo
- Zuplo should implement proper error handling to avoid leaking sensitive information

## Best Practices for API Key Management

### For Developers

- Never hardcode API keys in source code
- Store API keys in environment variables or secure configuration files
- Rotate API keys regularly
- Use different API keys for different environments (development, staging, production)
- Use the minimum required permissions for each API key

### For Users

- Keep API keys secure and do not share them
- Revoke API keys that are no longer needed
- Use personal keys for testing and development
- Use service keys for production applications
- Monitor API key usage for suspicious activity 