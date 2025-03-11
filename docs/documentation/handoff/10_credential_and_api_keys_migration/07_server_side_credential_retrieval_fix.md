# Server-Side Credential Retrieval Fix

## Overview

This document explains the issue discovered on March 11, 2025, where credentials could not be retrieved when executing flows on the server side. This was causing "API key not found" errors for all nodes that require credentials, regardless of the node type.

## Problem Description

After migrating to Supabase for credential storage, we encountered an issue where the system was unable to retrieve credentials when executing flows on the server side. This resulted in errors like "Anthropic API key not found" for all nodes that require credentials.

The root cause was identified as follows:

1. The `decryptCredentialData` function in the components package was trying to get the application ID from localStorage.
2. Since the components package runs on the server (not in a browser), localStorage is undefined in this environment.
3. Without the application ID, the API call to retrieve secrets from Supabase was failing or returning empty results.

## Key Insights

1. **Components Package Environment**: Although the components package is a separate package from the server package, it always runs on the server, not in the browser. The separation is for maintenance reasons only.

2. **Flow Execution Context**: During flow execution, the application ID (`appId`) is available in the `flowConfig` object, which is passed to the `initEndingNode` function in `packages/server/src/utils/buildChatflow.ts`.

3. **Missing Context in Credential Retrieval**: The application ID is not being passed from the flow execution context to the credential retrieval functions.

## Proposed Solution

We need to modify the credential retrieval process to use the application ID from the flow execution context instead of trying to get it from localStorage:

1. Update the `getCredentialData` function in `packages/components/src/utils.ts` to accept and use the application ID from the options parameter.

2. Modify the `decryptCredentialData` function to use the application ID from the options parameter instead of trying to get it from localStorage.

3. Ensure that the application ID is properly passed from the flow execution context to the credential retrieval functions.

## Code Changes

### 1. Update the `getCredentialData` function

```typescript
export const getCredentialData = async (selectedCredentialId: string, options: ICommonObject): Promise<ICommonObject> => {
    logger.debug('========= Start of getCredentialData =========')
    logger.debug(`selectedCredentialId: ${selectedCredentialId}`)
    logger.debug(`options: ${options ? JSON.stringify(options) : 'none'}`)
    
    try {
        if (!selectedCredentialId) {
            logger.debug('No credential ID provided, returning empty object')
            return {}
        }

        // Extract application ID from options if available
        const applicationId = options?.appId || ''
        logger.debug(`Application ID from options: ${applicationId}`)

        // In our Supabase implementation, the selectedCredentialId is the secret ID
        // So we can directly decrypt it without needing to query the database
        try {
            logger.debug(`Calling decryptCredentialData with ID: ${selectedCredentialId}`)
            // Pass the application ID to decryptCredentialData
            const decryptedCredentialData = await decryptCredentialData(selectedCredentialId, undefined, undefined, applicationId)
            logger.debug(`Decrypted credential data: ${decryptedCredentialData ? JSON.stringify(decryptedCredentialData) : 'empty'}`)
            return decryptedCredentialData
        } catch (error) {
            logger.error(`Error decrypting credential data: ${error}`)
            logger.debug(`Full error: ${JSON.stringify(error)}`)
            logger.debug(`Stack trace: ${error.stack}`)
            return {}
        }
    } catch (e) {
        logger.error(`Error in getCredentialData: ${e}`)
        logger.debug(`Full error: ${JSON.stringify(e)}`)
        logger.debug(`Stack trace: ${e.stack}`)
        // Return empty object instead of throwing to avoid breaking flows
        return {}
    } finally {
        logger.debug('========= End of getCredentialData =========')
    }
}
```

### 2. Update the `decryptCredentialData` function

```typescript
export const decryptCredentialData = async (
    encryptedData: string,
    componentCredentialName?: string,
    componentCredentials?: IComponentCredentials,
    applicationId?: string
): Promise<ICommonObject> => {
    logger.debug('========= Start of decryptCredentialData (components) =========')
    logger.debug(`encryptedData: ${encryptedData}`)
    logger.debug(`componentCredentialName: ${componentCredentialName || 'none'}`)
    logger.debug(`componentCredentials: ${componentCredentials ? 'provided' : 'none'}`)
    logger.debug(`applicationId from parameter: ${applicationId || 'none'}`)
    
    try {
        if (!encryptedData) {
            logger.debug('No encrypted data provided, returning empty object')
            return {}
        }
        
        // For our Supabase implementation, the encryptedData is actually the secret ID
        // So we make a direct API call to get the secret
        let url = `/api/v1/secrets/${encryptedData}`
        let decryptedDataStr: string
        
        try {
            // Use application ID from parameter if available
            if (applicationId) {
                logger.debug(`Using applicationId from parameter: ${applicationId}`)
                url = `${url}?applicationId=${applicationId}`
            } else {
                // Fallback to localStorage if in browser environment
                try {
                    // Check if we're in a browser environment
                    if (typeof localStorage !== 'undefined') {
                        const localStorageAppId = localStorage.getItem('selectedApplicationId') || ''
                        if (localStorageAppId) {
                            logger.debug(`Using applicationId from localStorage: ${localStorageAppId}`)
                            url = `${url}?applicationId=${localStorageAppId}`
                        }
                    }
                } catch (e) {
                    logger.debug(`Error getting application ID from localStorage: ${e}`)
                    // Continue without application ID if there's an error
                }
            }
            
            logger.debug(`Making API call to ${url}`)
            // Call the API to get the secret from Supabase
            const response = await axios.get(url)
            // ... rest of the function remains the same
        }
        // ... rest of the function remains the same
    }
    // ... rest of the function remains the same
}
```

### 3. Ensure application ID is passed from flow execution context

The application ID is already available in the `flowConfig` object in the `executeFlow` function. We need to ensure it's passed to the node initialization functions and ultimately to the `getCredentialData` function.

## Benefits of the Fix

1. **Server-Side Compatibility**: The credential retrieval process will work correctly in server-side environments where localStorage is not available.

2. **Consistent Behavior**: The behavior will be consistent across all environments, whether browser or server.

3. **Proper Application Context**: The system will correctly pass the application context when retrieving credentials, ensuring that the right credentials are found.

4. **Improved Error Handling**: Better error handling and logging will help diagnose any future issues with credential retrieval.

## Testing

To test this fix:

1. Create a credential (e.g., Anthropic API key) in a specific application.
2. Create a chatflow that uses that credential.
3. Execute the chatflow via the API.
4. Verify that the credential is successfully retrieved and the flow executes without "API key not found" errors.

## Conclusion

This fix addresses a critical issue in our credential retrieval process by ensuring that the application context is properly passed when retrieving secrets from Supabase in server-side environments. It enables flows to execute correctly without credential retrieval errors.

## Related Issues

- Credential Retrieval Fix in Canvas View (March 16, 2025)
- JWT Token Used as Key ID (March 13, 2025)
- API Key User UUID Issue (March 15, 2025)
- Application Context Filtering (March 15, 2025)

## Next Steps

1. Implement the proposed changes
2. Test thoroughly in both server and browser environments
3. Monitor for any regressions or new issues
4. Update related documentation as needed 