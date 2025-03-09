# JWT User Context

## Overview

This document explains how to access the user context (userId and organizationId) from JWT claims in both internal and external applications. We've implemented both client-side helper functions and a server-side endpoint to make this process easy and reliable.

## JWT Claims Structure

Our JWT tokens include the following claims related to user context:

```json
{
  "userId": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
  "sub": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
  "organizationId": "a4233773-4128-4149-82a1-75db25dd460f",
  "is_platform_admin": true
}
```

- `userId`: Direct copy of the user's UUID for easier access
- `sub`: The original Supabase user ID (same as userId)
- `organizationId`: The user's primary organization ID
- `is_platform_admin`: Boolean indicating if the user is a platform admin

## Client-Side Helper Functions

We've created a set of helper functions in `packages/ui/src/utils/jwtHelper.js` to make it easy to access the user context from JWT claims.

### Basic Usage

```javascript
import { getUserContext } from '../../utils/jwtHelper'

// In an async function
const handleSomeAction = async () => {
  const userContext = await getUserContext()
  
  console.log('User ID:', userContext.userId)
  console.log('Organization ID:', userContext.orgId)
  console.log('Is Platform Admin:', userContext.isPlatformAdmin)
  
  // Use the user context in API calls
  const response = await api.post('/some-endpoint', {
    userId: userContext.userId,
    orgId: userContext.orgId
  })
}
```

### Available Functions

#### `getUserContext()`

This is the main function you should use in most cases. It tries to get the user context from JWT claims first, and falls back to the server endpoint if needed.

```javascript
const userContext = await getUserContext()
```

#### `getUserContextFromJWT()`

This function extracts the user context directly from JWT claims in local storage. It's synchronous and doesn't make any API calls.

```javascript
const userContext = getUserContextFromJWT()
```

#### `getUserContextFromServer()`

This function gets the user context from the server endpoint. It's useful when the JWT token is not available or when you need to ensure you have the most up-to-date information.

```javascript
const userContext = await getUserContextFromServer()
```

## Server-Side Endpoint

We've also created a server-side endpoint to get the user context from JWT claims. This is useful for external applications that need to access the user context without having to decode the JWT themselves.

### Endpoint Details

- **URL**: `/api/v1/auth/user-context`
- **Method**: GET
- **Authentication**: Requires a valid JWT token in the Authorization header
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "userId": "a2132fe6-bc0d-449f-8361-c5e5b598e0e6",
      "orgId": "a4233773-4128-4149-82a1-75db25dd460f",
      "isPlatformAdmin": true
    }
  }
  ```

### Example Usage with Fetch

```javascript
const getUserContext = async () => {
  try {
    const response = await fetch('/api/v1/auth/user-context', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      return data.data
    } else {
      throw new Error('Failed to get user context')
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return {
      userId: '',
      orgId: null,
      isPlatformAdmin: false
    }
  }
}
```

## Server-Side Helper Functions

For server-side code, we've created helper functions in `packages/server/src/utils/jwtClaims.ts` to extract the user context from JWT claims in incoming requests.

### Example Usage in Express Route Handler

```typescript
import { Request, Response } from 'express'
import { getUserContext } from '../../utils/jwtClaims'

export const someRouteHandler = async (req: Request, res: Response) => {
  try {
    // Extract user context from JWT claims
    const userContext = getUserContext(req)
    
    console.log('User ID:', userContext.userId)
    console.log('Organization ID:', userContext.orgId)
    console.log('Is Platform Admin:', userContext.isPlatformAdmin)
    
    // Use the user context in your route handler
    // ...
    
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error in route handler:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
```

## Internal vs External Predictions

### Internal Predictions

For internal predictions (within the Remodl AI platform), you can use the client-side helper functions to get the user context and include it in the request body:

```javascript
// In ChatMessage.jsx
const handleSubmit = async () => {
  // Get user context from JWT claims
  const userContext = await getUserContext()
  
  // Include user context in request body
  const params = {
    question: input,
    chatId,
    appId,
    userId: userContext.userId,
    orgId: userContext.orgId
  }
  
  // Send request to internal prediction API
  const response = await predictionApi.sendMessageAndGetPrediction(chatflowid, params)
  // ...
}
```

### External Predictions

For external predictions (from external applications), you have two options:

#### Option 1: Use the Server Endpoint

```javascript
// Get user context from server endpoint
const getUserContextAndMakePrediction = async () => {
  try {
    // Get user context from server endpoint
    const response = await fetch('/api/v1/auth/user-context', {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    })
    
    const data = await response.json()
    
    if (data.success) {
      const userContext = data.data
      
      // Use user context in prediction request
      const predictionResponse = await fetch('/api/v1/prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          question: 'Your question here',
          chatId: 'your-chat-id',
          appId: 'your-app-id',
          userId: userContext.userId,
          orgId: userContext.orgId
        })
      })
      
      // Process prediction response
      // ...
    }
  } catch (error) {
    console.error('Error:', error)
  }
}
```

#### Option 2: Decode the JWT on the Client Side

```javascript
import { jwtDecode } from 'jwt-decode'

const makeExternalPrediction = async () => {
  try {
    // Get JWT token (from your authentication system)
    const jwtToken = getJwtToken()
    
    // Decode JWT to get claims
    const decodedJwt = jwtDecode(jwtToken)
    
    // Extract user context from claims
    const userContext = {
      userId: decodedJwt.userId || decodedJwt.sub,
      orgId: decodedJwt.organizationId || null
    }
    
    // Use user context in prediction request
    const predictionResponse = await fetch('/api/v1/prediction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        question: 'Your question here',
        chatId: 'your-chat-id',
        appId: 'your-app-id',
        userId: userContext.userId,
        orgId: userContext.orgId
      })
    })
    
    // Process prediction response
    // ...
  } catch (error) {
    console.error('Error:', error)
  }
}
```

## Best Practices

1. **Always include userId and orgId in API requests** that need to be scoped to a specific user or organization.

2. **Use the `getUserContext()` function** in most cases, as it handles both JWT and server fallback.

3. **For server-side code, use the `getUserContext(req)` function** to extract the user context from the request.

4. **For external applications, use the server endpoint** to get the user context, as it's more reliable than decoding the JWT on the client side.

5. **Handle errors gracefully** by providing default values when the user context can't be retrieved.

## Troubleshooting

If you're having trouble getting the user context, check the following:

1. **Make sure the user is authenticated** and has a valid JWT token.

2. **Check that the JWT token includes the necessary claims** (userId, organizationId).

3. **Verify that the user has a valid organization association** in the database.

4. **Check the browser console for errors** related to JWT decoding or API calls.

5. **Use the server endpoint as a fallback** if client-side JWT decoding fails. 