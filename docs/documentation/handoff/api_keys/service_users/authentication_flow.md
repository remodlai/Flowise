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

## High-Performance Implementation with Redis

To support high-volume API usage, the platform implements a Redis-based caching layer for API key authentication:

### Redis Caching Architecture

- **Key Format**: `apikey:{api_key_hash}`
- **Value Structure**:
  ```json
  {
    "jwt": "raw_jwt_token",
    "decoded_jwt": {
      "sub": "user_id",
      "user_roles": [...],
      "is_platform_admin": boolean,
      "exp": timestamp
    },
    "expires": timestamp,
    "user_id": "user_id",
    "is_service_account": boolean
  }
  ```
- **TTL**: Automatically set to match JWT expiration

### Optimized Authentication Flow

1. Extract API key from request (Authorization header or query parameter)
2. Look up API key in Redis cache
   - If found and not expired:
     - Use stored JWT for authentication
     - Use decoded JWT data for authorization checks
     - Skip database lookup entirely
   - If not found or expired:
     - Look up API key in Supabase
     - If valid, generate new JWT
     - Decode JWT and store both raw and decoded JWT in Redis
     - Set TTL to match JWT expiration
3. Use JWT for authentication and decoded data for authorization checks
4. Update usage tracking asynchronously to avoid blocking the request

### Performance Benefits

- Minimizes database queries for frequently used API keys
- Reduces latency for API key validation
- Scales to support thousands of concurrent API requests
- Maintains security by respecting token expiration
- Synchronizes with Supabase for consistency

### Refresh Token Handling

When a token is expired:
1. The system uses the refresh token to obtain a new session
2. The new JWT and decoded data are stored in Redis
3. The TTL is updated to match the new expiration time

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
      // Check Redis cache first
      const cachedData = await getFromRedisCache(apiKey);
      
      if (cachedData) {
        // Set up user context from cached data
        req.user = {
          userId: cachedData.decoded_jwt.sub,
          isPersonalKey: !cachedData.is_service_account,
          permissions: cachedData.decoded_jwt.user_roles,
          isPlatformAdmin: cachedData.decoded_jwt.is_platform_admin
        };
        
        // Update usage tracking asynchronously
        updateApiKeyUsage(apiKey).catch(console.error);
        
        return next();
      }
      
      // If not in cache, verify API key from database
      const apiKeyInfo = await verifyApiKey(apiKey);
      
      if (apiKeyInfo) {
        // Generate JWT and cache in Redis
        const jwt = await generateJwtForApiKey(apiKeyInfo);
        const decodedJwt = decodeJwt(jwt);
        
        await cacheInRedis(apiKey, {
          jwt,
          decoded_jwt: decodedJwt,
          expires: decodedJwt.exp * 1000, // Convert to milliseconds
          user_id: apiKeyInfo.user_id,
          is_service_account: !apiKeyInfo.is_personal_key
        });
        
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

### Redis Cache Functions

```typescript
// Example Redis cache functions
export const getFromRedisCache = async (apiKey: string) => {
  const apiKeyHash = hashApiKey(apiKey);
  const key = `apikey:${apiKeyHash}`;
  
  const data = await redis.get(key);
  if (!data) return null;
  
  const parsedData = JSON.parse(data);
  
  // Check if token is expired
  if (parsedData.expires < Date.now()) {
    // Token is expired, remove from cache
    await redis.del(key);
    return null;
  }
  
  return parsedData;
};

export const cacheInRedis = async (apiKey: string, data: any) => {
  const apiKeyHash = hashApiKey(apiKey);
  const key = `apikey:${apiKeyHash}`;
  
  // Calculate TTL in seconds
  const now = Date.now();
  const ttl = Math.floor((data.expires - now) / 1000);
  
  if (ttl <= 0) return; // Don't cache expired tokens
  
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
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
- Redis cache should use encryption at rest and in transit
- Redis TTL should match or be shorter than the JWT expiration

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