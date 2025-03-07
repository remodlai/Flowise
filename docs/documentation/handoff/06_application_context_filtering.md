# Application Context Filtering

## Overview

This document details the implementation of application context filtering in the Remodl AI platform. This feature ensures that resources (credentials, API keys, tools, etc.) are properly scoped to the selected application, providing proper multi-tenant isolation.

## Implementation Details

### Application Context Middleware

The application context is managed by the `applicationContextMiddleware` in `packages/server/src/middlewares/applicationContextMiddleware.ts`. This middleware:

1. Extracts the application ID from the request headers (`X-Application-ID`) or query parameters
2. Verifies that the user has access to the specified application
3. Sets the application ID in the request object for use by other components

```typescript
export const applicationContextMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check for application ID in headers or query parameters
        const applicationId = req.headers['x-application-id'] as string || req.query.applicationId as string
        
        if (applicationId) {
            // If "global" is specified and user is platform admin, allow global access
            if (applicationId === 'global') {
                const user = req.user as IUser | undefined
                if (user && user.userId && await isPlatformAdmin(user.userId)) {
                    req.applicationId = 'global'
                } else {
                    // User is not a platform admin, ignore the global setting
                    req.applicationId = undefined
                }
            } else {
                // Verify user has access to this application
                const user = req.user as IUser | undefined
                if (user && user.userId) {
                    // Check if user has access to this application
                    const hasAccess = await isAppOwner(user.userId, applicationId)
                    
                    if (hasAccess) {
                        req.applicationId = applicationId
                    } else {
                        // User doesn't have access to this application
                        req.applicationId = undefined
                    }
                }
            }
        } else {
            // No application ID specified, use default behavior
            req.applicationId = undefined
        }
        
        next()
    } catch (error) {
        logger.error(`[applicationContextMiddleware] ${getErrorMessage(error)}`)
        next()
    }
}
```

### Client-Side Application Context

On the client side, the application context is managed by:

1. The `ApplicationContext` in `packages/ui/src/contexts/ApplicationContext.jsx`
2. The `ApplicationChooser` component in `packages/ui/src/components/ApplicationChooser.jsx`
3. The API client in `packages/ui/src/api/client.js`

The API client adds the application ID to all requests:

```javascript
// Add application context if available
const applicationId = localStorage.getItem('selectedApplicationId')
if (applicationId && applicationId !== 'global') {
    config.headers['X-Application-ID'] = applicationId
    console.log(`Adding X-Application-ID header: ${applicationId}`)
} else if (applicationId === 'global') {
    console.log('Using global application context (no X-Application-ID header)')
}
```

### Resource Filtering by Application

#### Credentials

The credentials service (`packages/server/src/services/credentials/index.ts`) filters credentials by application:

```typescript
const getAllCredentials = async (paramCredentialName: any, req?: any) => {
    try {
        // ... existing code to fetch credentials ...

        // Get application ID from request context or from paramCredentialName
        let applicationId = null
        
        // Check if applicationId is provided in paramCredentialName object
        if (typeof paramCredentialName === 'object' && paramCredentialName?.applicationId) {
            applicationId = paramCredentialName.applicationId
        } 
        // Check if applicationId is in the request context
        else if (req && req.applicationId && req.applicationId !== 'global') {
            applicationId = req.applicationId
        }
        
        // Filter credentials by application if an applicationId is available
        if (applicationId) {
            try {
                logger.debug(`Filtering credentials by application ID: ${applicationId}`)
                const applicationcredentials = await import('../applicationcredentials')
                const credentialIds = await applicationcredentials.getCredentialIdsForApplication(applicationId)
                
                // Filter credentials by IDs from application_credentials
                return dbResponse.filter(cred => credentialIds.includes(cred.id))
            } catch (error) {
                logger.error(`Error filtering credentials by application: ${getErrorMessage(error)}`)
                // Return all credentials if filtering fails
            }
        }

        return dbResponse
    } catch (error) {
        // ... error handling ...
    }
}
```

#### API Keys

The API keys service (`packages/server/src/services/apikey/index.ts`) filters API keys by application:

```typescript
const getAllApiKeys = async (req?: any) => {
    try {
        // ... existing code to fetch API keys ...
        
        // Filter by application ID if provided in request context
        let filteredKeys = keys
        if (req && req.applicationId && req.applicationId !== 'global') {
            filteredKeys = keys.filter(key => key.applicationId === req.applicationId)
        }
        
        return await addChatflowsCount(filteredKeys)
    } catch (error) {
        // ... error handling ...
    }
}
```

When creating new API keys, they are associated with the current application:

```typescript
const createApiKey = async (keyName: string, req?: any) => {
    try {
        // ... existing code ...
        
        // Get application ID from request context
        const applicationId = req?.applicationId && req.applicationId !== 'global' ? req.applicationId : null
        
        // Store in Supabase
        await storeSecret(
            keyName,
            'api_key',
            { apiKey, apiSecret },
            { 
                keyName, 
                createdAt: new Date().toISOString(),
                applicationId
            },
            apiKey
        )
        
        // ... rest of the function ...
    } catch (error) {
        // ... error handling ...
    }
}
```

#### Users

The user controller (`packages/server/src/controllers/UserController.ts`) filters users by application:

```typescript
static async getAllUsers(req: Request, res: Response) {
    try {
        // ... existing code to fetch users ...
        
        // Get application ID from request context
        const applicationId = req.applicationId
        const isPlatformAdmin = (req.user as any)?.is_platform_admin === true
        
        // Filter users by application if an applicationId is specified and not 'global'
        let filteredUsers = authUsers.users
        
        // Only filter if not in global view or not a platform admin
        if (applicationId && applicationId !== 'global') {
            // Get organizations associated with this application
            const { data: organizations } = await supabase
                .from('organizations')
                .select('id')
                .eq('application_id', applicationId)
            
            if (organizations && organizations.length > 0) {
                const orgIds = organizations.map(org => org.id)
                
                // Get users from these organizations
                const { data: orgUsers } = await supabase
                    .from('organization_users')
                    .select('user_id')
                    .in('organization_id', orgIds)
                
                if (orgUsers && orgUsers.length > 0) {
                    const allowedUserIds = orgUsers.map(u => u.user_id)
                    
                    // Filter users by allowed IDs
                    filteredUsers = filteredUsers.filter(user => allowedUserIds.includes(user.id))
                } else {
                    // No users found in these organizations
                    filteredUsers = []
                }
            } else {
                // No organizations found for this application
                filteredUsers = []
            }
        } else if (!isPlatformAdmin) {
            // Non-platform admins can only see users they have access to
            filteredUsers = []
        } else {
            // Platform admin in global view - show all users
            // No filtering applied
        }
        
        // ... format and return filtered users ...
    } catch (error) {
        // ... error handling ...
    }
}
```

This implementation ensures that:

1. Platform admins in global view can see all users
2. Users in application-specific view can only see users associated with organizations belonging to that application
3. Non-platform admins without an application context see no users

The user-organization-application relationship is hierarchical:
- Applications contain Organizations
- Organizations contain Users
- Users are filtered based on their organization membership

## User Experience

From a user perspective, the application context filtering works as follows:

1. Users select an application from the ApplicationChooser dropdown in the header
2. The selected application ID is stored in localStorage and added to all API requests
3. Resources (chatflows, credentials, API keys, etc.) are filtered to show only those associated with the selected application
4. Platform admins can select "Global" to see all resources across all applications

## Special Cases

### Platform Admins

Platform admins have special privileges:
- They can access the "Global" context to see all resources
- They can see all applications in the ApplicationChooser dropdown
- They can create and manage resources across all applications

### Default Application

When no application is selected or for new users:
- The system attempts to find a default application (usually "Platform Sandbox")
- If no default is found, platform admins default to "Global" context
- Regular users default to their first available application

## Troubleshooting

If resources are not being properly filtered by application:

1. Check that the `X-Application-ID` header is being sent with API requests
2. Verify that the user has access to the selected application
3. Ensure that resources are properly associated with applications in the database
4. Check that the filtering logic in the service is working correctly

## Future Improvements

Potential improvements to the application context filtering:

1. Add more granular permissions for resource access within applications
2. Implement resource sharing between applications
3. Add application-specific settings and configurations
4. Improve the UI to better indicate the current application context 