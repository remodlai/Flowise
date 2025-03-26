# Authenticated Requests in Remodl Auth

## Overview

The `authenticatedRequest` method in the Remodl Auth package provides a standardized way to make authenticated HTTP requests to the Remodl API Gateway. This method handles all aspects of authentication, token management, and header inclusion, ensuring consistent and secure communication between client applications and the API Gateway.

## Purpose

The method serves several key purposes:
1. Provides a unified way to make authenticated requests
2. Automatically handles token management and refresh
3. Ensures all necessary headers are included
4. Manages retry logic for expired tokens
5. Integrates seamlessly with the Remodl API Gateway's authentication requirements

## Method Signature

```typescript
async authenticatedRequest(
    url: string,
    options: RequestInit = {}
): Promise<Response>
```

## Features

### Automatic Token Management
- Retrieves current access token
- Checks token expiration
- Automatically refreshes expired tokens
- Handles token refresh errors

### Header Management
- Adds `Authorization` bearer token
- Sets proper content type
- Includes required custom headers from JWT claims:
  - `x-application-id`: Current application context
  - `x-user-id`: Authenticated user's ID
  - `x-organization-id`: Current organization context (when applicable)

### Error Handling
- Handles 401 Unauthorized responses
- Attempts token refresh on authorization failures
- Retries failed requests with new tokens
- Provides clear error messages

## Usage Examples

### Basic GET Request
```typescript
const auth = new RemodlAuth(options);

try {
    const response = await auth.authenticatedRequest('https://api.remodl.ai/some/endpoint');
    const data = await response.json();
} catch (error) {
    console.error('Request failed:', error);
}
```

### POST Request with Body
```typescript
const response = await auth.authenticatedRequest('https://api.remodl.ai/some/endpoint', {
    method: 'POST',
    body: JSON.stringify({
        key: 'value'
    })
});
```

### Custom Headers
```typescript
const response = await auth.authenticatedRequest('https://api.remodl.ai/some/endpoint', {
    headers: {
        'Custom-Header': 'value'
    }
});
```

## Integration with Remodl API Gateway

The `authenticatedRequest` method is designed to work seamlessly with the Remodl API Gateway. The gateway:
1. Validates the JWT token
2. Processes the included headers
3. Enforces access control based on token claims
4. Routes requests to appropriate services

This integration allows for:
- Centralized authentication
- Consistent header management
- Proper access control
- Efficient request routing

## Best Practices

1. **Error Handling**
   ```typescript
   try {
       const response = await auth.authenticatedRequest(url);
       if (!response.ok) {
           throw new Error(`Request failed: ${response.statusText}`);
       }
       return await response.json();
   } catch (error) {
       // Handle error appropriately
   }
   ```

2. **Token Refresh**
   - The method handles token refresh automatically
   - No need to manually check token expiration
   - Always use this method instead of direct fetch calls

3. **Headers**
   - Don't manually add authorization headers
   - Let the method handle all auth-related headers
   - Only add custom headers when necessary

## Common Use Cases

1. **Application Data Retrieval**
   ```typescript
   const response = await auth.authenticatedRequest('/applications/list');
   ```

2. **User Profile Updates**
   ```typescript
   const response = await auth.authenticatedRequest('/user/profile', {
       method: 'PUT',
       body: JSON.stringify(profileData)
   });
   ```

3. **Organization Management**
   ```typescript
   const response = await auth.authenticatedRequest('/organizations/members', {
       headers: {
           'x-organization-id': currentOrgId
       }
   });
   ```

## Security Considerations

1. The method automatically handles sensitive information like tokens
2. Never expose tokens in URLs or logs
3. Always use HTTPS endpoints
4. Handle errors appropriately to avoid exposing sensitive information

## Future Enhancements

1. Request queueing during token refresh
2. Configurable retry strategies
3. Request cancellation support
4. Request timeout configuration 