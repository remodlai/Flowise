# API Key Authentication Flow

## Overview

This document outlines the authentication flow for API keys in the Remodl AI platform. It covers both personal API keys (tied directly to a user) and service API keys (tied to a service user with specific permissions).

## Authentication Flow

### 1. API Key Submission

The client includes the API key in the request using one of the following methods:

- **HTTP Header**: `Authorization: Bearer {api_key}`
- **Query Parameter**: `?api_key={api_key}`

### 2. API Key Verification

When a request with an API key is received, the following steps are performed:

1. The API key is extracted from the request
2. The system checks if the API key exists in the database
3. The system verifies that the API key is active and not expired
4. The system determines if it's a personal key or a service key

### 3. User Context Setup

Based on the type of API key, the system sets up the user context:

#### For Personal Keys:

1. The user ID is set to the `created_by` value of the API key
2. The user's permissions are retrieved from the `user_roles` table
3. The user context is set up with the user's ID and permissions

#### For Service Keys:

1. The user ID is set to the `service_user_id` value of the API key
2. The service user's permissions are retrieved from the `user_roles` table
3. The user context is set up with the service user's ID and permissions

### 4. Request Processing

Once the user context is set up, the request is processed as if it came from the authenticated user:

1. The system checks if the user has the required permissions for the requested operation
2. If the user has the required permissions, the operation is performed
3. If the user does not have the required permissions, a 403 Forbidden response is returned

### 5. Usage Tracking

After processing the request, the system updates the `last_used_at` timestamp for the API key.

## Implementation Details

### Authentication Middleware

The authentication middleware is responsible for verifying API keys and setting up the user context. It should:

1. Check if the request includes an API key
2. If an API key is present, verify it using the `verify_api_key` function
3. Set up the user context based on the API key type
4. Pass the request to the next middleware or controller

```typescript
// Example authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for API key in header or query parameter
    const apiKey = extractApiKey(req);
    
    if (apiKey) {
      // Verify API key
      const apiKeyInfo = await verifyApiKey(apiKey);
      
      if (apiKeyInfo) {
        // Set up user context
        req.user = {
          userId: apiKeyInfo.user_id,
          isPersonalKey: apiKeyInfo.is_personal_key,
          applicationId: apiKeyInfo.application_id,
          permissions: apiKeyInfo.permissions
        };
        
        // Update usage tracking
        await updateApiKeyUsage(apiKey);
        
        return next();
      }
    }
    
    // Continue with other authentication methods (JWT, etc.)
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
};
```

### API Key Verification Function

The `verify_api_key` function is responsible for verifying API keys and retrieving the associated user information:

```typescript
// Example API key verification function
export const verifyApiKey = async (apiKey: string) => {
  const app = getInstance();
  if (!app || !app.Supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const { data, error } = await app.Supabase.rpc('verify_api_key', {
    p_api_key: apiKey
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0];
};
```

### API Key Usage Tracking Function

The `updateApiKeyUsage` function is responsible for updating the `last_used_at` timestamp for API keys:

```typescript
// Example API key usage tracking function
export const updateApiKeyUsage = async (apiKey: string) => {
  const app = getInstance();
  if (!app || !app.Supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  await app.Supabase.rpc('update_api_key_usage', {
    p_api_key: apiKey
  });
};
```

## Security Considerations

- API keys should be transmitted securely (HTTPS only)
- API keys should be stored securely (hashed in the database)
- API keys should have an expiration date
- API keys should be revocable
- Failed API key authentication attempts should be logged
- Rate limiting should be applied to prevent brute force attacks

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