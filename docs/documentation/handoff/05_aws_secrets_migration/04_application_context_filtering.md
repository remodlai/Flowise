# Application Context Filtering for Secrets

## Overview

This document explains how secrets (API keys, credentials, etc.) are filtered by application context in the Remodl AI platform. This ensures that secrets are properly scoped to the selected application, providing proper multi-tenant isolation.

## Implementation Details

### Secret Filtering by Application ID

When retrieving secrets, the system now filters them by the current application context. This is implemented in the following functions:

#### 1. `getSecretByKeyId`

The `getSecretByKeyId` function in `packages/server/src/services/secrets/index.ts` now accepts an optional `applicationId` parameter and filters secrets by this ID:

```typescript
export const getSecretByKeyId = async (keyId: string, applicationId?: string): Promise<any> => {
    try {
        // Build the query
        let query = supabase
            .from('secrets')
            .select('id, value, metadata')
            .eq('key_id', keyId)
        
        // Filter by application ID if provided and not 'global'
        if (applicationId && applicationId !== 'global') {
            console.log(`Filtering secret by application ID: ${applicationId} for key ID: ${keyId}`)
            query = query.eq('metadata->applicationId', applicationId)
        }
        
        // Execute the query
        const { data, error } = await query
        
        // ... rest of the function
    }
}
```

#### 2. API Key Service

All functions in the API key service that call `getSecretByKeyId` now pass the application ID from the request context or the `X-Application-ID` header:

```typescript
// Helper function to get application ID from request
const getApplicationIdFromRequest = (req?: any): string | undefined => {
    if (!req) return undefined
    
    // First check if applicationId is set in the request context by middleware
    if (req.applicationId && req.applicationId !== 'global') {
        return req.applicationId
    }
    
    // Fallback to X-Application-ID header if present
    const headerAppId = req.headers?.['x-application-id'] || req.headers?.['X-Application-ID']
    if (headerAppId && headerAppId !== 'global') {
        return headerAppId
    }
    
    return undefined
}

const getApiKey = async (apiKey: string, req?: any) => {
    try {
        // Get application ID from request context or header
        const applicationId = getApplicationIdFromRequest(req)
        
        // Get the secret by key ID, filtered by application ID if available
        const secretData = await getSecretByKeyId(apiKey, applicationId)
        
        // ... rest of the function
    }
}
```

#### 3. Credentials Service

The credentials service now uses a similar approach to filter credentials by application ID:

```typescript
// Helper function to get application ID from request
const getApplicationIdFromRequest = (req?: any, paramCredentialName?: any): string | undefined => {
    if (!req) return undefined
    
    // First check if applicationId is provided in paramCredentialName object
    if (typeof paramCredentialName === 'object' && paramCredentialName?.applicationId) {
        return paramCredentialName.applicationId !== 'global' ? paramCredentialName.applicationId : undefined
    }
    
    // Check if applicationId is provided as a query parameter
    if (req.query?.applicationId && req.query.applicationId !== 'global') {
        return req.query.applicationId as string
    }
    
    // Check if applicationId is set in the request context by middleware
    if (req.applicationId && req.applicationId !== 'global') {
        return req.applicationId
    }
    
    // Fallback to X-Application-ID header if present
    const headerAppId = req.headers?.['x-application-id'] || req.headers?.['X-Application-ID']
    if (headerAppId && headerAppId !== 'global') {
        return headerAppId as string
    }
    
    return undefined
}

const getAllCredentials = async (paramCredentialName: any, req?: any) => {
    // ... existing code to fetch credentials
    
    // Get application ID from request using the helper function
    const applicationId = getApplicationIdFromRequest(req, paramCredentialName)
    
    // Filter credentials by application if an applicationId is available
    if (applicationId) {
        // ... filter credentials by application ID
    }
    
    return dbResponse
}
```

#### 4. UI Components

The UI components that fetch credentials now pass the application ID:

```javascript
// In AsyncDropdown.jsx
const fetchCredentialList = async () => {
    try {
        // ... existing code to prepare credential names
        
        // Get the application ID from localStorage
        const applicationId = localStorage.getItem('selectedApplicationId')
        
        // Pass the application ID to the API call
        const resp = await credentialsApi.getCredentialsByName(names, applicationId)
        
        // ... process response
    } catch (error) {
        console.error(error)
    }
}

// In credentials.js API client
const getCredentialsByName = (componentCredentialName, applicationId) => {
    let url = `/credentials?credentialName=${componentCredentialName}`
    if (applicationId && applicationId !== 'global') {
        url += `&applicationId=${applicationId}`
    }
    return client.get(url)
}
```

#### 5. API Key Validation

The API key validation middleware now passes the request object to the `verifyApiKey` function to ensure that API keys are validated in the correct application context:

```typescript
export const validateAPIKey = async (req: Request) => {
    // ... existing code
    
    if (suppliedKey) {
        try {
            // Pass the request object to verifyApiKey to get the application context
            await apikeyService.verifyApiKey(suppliedKey, req)
            return true
        } catch (error) {
            return false
        }
    }
    
    // ... rest of the function
}
```

### Behavior

1. **Global Context**: When in the global context (`applicationId === 'global'`), all secrets are accessible.
2. **Application Context**: When in a specific application context, only secrets associated with that application are accessible.

### Application ID Resolution Order

The system uses the following order to determine the application ID:

1. For credentials:
   - `paramCredentialName.applicationId` - Provided in the request body
   - `req.query.applicationId` - Provided as a query parameter
   - `req.applicationId` - Set by the application context middleware
   - `X-Application-ID` header - Directly from the request headers

2. For API keys:
   - `req.applicationId` - Set by the application context middleware
   - `X-Application-ID` header - Directly from the request headers

3. If none of the above are available or all are set to 'global', no application filtering is applied

This ensures that:
- Platform admins can access all secrets in the global context
- Application users can only access secrets associated with their application
- API keys and credentials are properly scoped to their respective applications
- The system works correctly even if the middleware hasn't processed the request yet
- UI components can properly fetch credentials for the selected application

## Credentials Service Updates

The credentials service has been updated to ensure proper filtering by application context:

1. All credential service functions now accept an optional `req` parameter to extract the application ID:
   - `createCredential(requestBody, req)`
   - `deleteCredentials(credentialId, req)`
   - `getAllCredentials(paramCredentialName, req)`
   - `getCredentialById(credentialId, req)`
   - `updateCredential(credentialId, requestBody, req)`

2. A helper function `getApplicationIdFromRequest` has been implemented to extract the application ID from various sources:
   ```typescript
   const getApplicationIdFromRequest = (req?: any, paramCredentialName?: any): string | undefined => {
       if (!req) return undefined
       
       // First check if applicationId is provided in paramCredentialName object
       if (typeof paramCredentialName === 'object' && paramCredentialName?.applicationId) {
           return paramCredentialName.applicationId !== 'global' ? paramCredentialName.applicationId : undefined
       }
       
       // Check if applicationId is provided as a query parameter
       if (req.query?.applicationId && req.query.applicationId !== 'global') {
           return req.query.applicationId as string
       }
       
       // Check if applicationId is set in the request context by middleware
       if (req.applicationId && req.applicationId !== 'global') {
           return req.applicationId
       }
       
       // Fallback to X-Application-ID header if present
       const headerAppId = req.headers?.['x-application-id'] || req.headers?.['X-Application-ID']
       if (headerAppId && headerAppId !== 'global') {
           return headerAppId as string
       }
       
       return undefined
   }
   ```

3. The credentials controller has been updated to pass the request object to all service functions:
   ```typescript
   // Example: createCredential
   const createCredential = async (req: Request, res: Response, next: NextFunction) => {
       try {
           if (!req.body) {
               throw new InternalFlowiseError(
                   StatusCodes.PRECONDITION_FAILED,
                   `Error: credentialsController.createCredential - body not provided!`
               )
           }
           // Pass the request object to include application context
           const apiResponse = await credentialsService.createCredential(req.body, req)
           return res.json(apiResponse)
       } catch (error) {
           next(error)
       }
   }
   ```

4. Verification has been added to ensure credentials belong to the application:
   ```typescript
   // Example: getCredentialById
   if (applicationId) {
       try {
           const applicationcredentials = await import('../applicationcredentials')
           const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
           
           if (!credentialIds.includes(credentialId)) {
               throw new InternalFlowiseError(
                   StatusCodes.FORBIDDEN,
                   `Credential ${credentialId} does not belong to application ${applicationId}`
               )
           }
       } catch (error) {
           // Error handling
       }
   }
   ```

## Credentials Controller Updates

The credentials controller has been updated to ensure consistent handling of application context:

1. All controller functions now extract `appId`, `orgId`, and `userId` from headers or body:
   ```typescript
   // Extract application ID, organization ID, and user ID from headers or body
   const appId = req.headers['x-application-id'] || req.body.appId
   const orgId = req.headers['x-organization-id'] || req.body.orgId
   const userId = req.headers['x-user-id'] || req.body.userId
   ```

2. These values are then set back into the request headers for consistency:
   ```typescript
   // Set these values in the request headers for consistency
   if (appId) {
       req.headers['x-application-id'] = appId
   }
   if (orgId) {
       req.headers['x-organization-id'] = orgId
   }
   if (userId) {
       req.headers['x-user-id'] = userId
   }
   ```

3. For the `getAllCredentials` function, we also check for `applicationId` in query parameters:
   ```typescript
   const appId = req.headers['x-application-id'] || req.body.appId || req.query.applicationId
   ```

This ensures that:
- The application context is consistently available in the request headers
- The credentials service can reliably extract the application ID from the request
- The system works correctly regardless of how the application ID is passed (headers, body, or query parameters)

## Chatflow Verification

The `utilBuildChatflow`