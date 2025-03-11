# Credential Retrieval Fix in Canvas View

## Overview

This document explains the fix implemented on March 16, 2025, to address the issue where credentials could not be retrieved when testing agents in the canvas view. This was causing "API key not found" errors for all nodes that require credentials.

## Problem Description

After migrating to Supabase for credential storage, we encountered an issue where the system was unable to retrieve credentials when testing agents in the canvas view. This resulted in errors like "Anthropic API key not found" for all nodes that require credentials.

The root cause was that the application context (application ID) was not being passed to the API call that retrieves secrets from Supabase. Without the application ID, the system couldn't find the credentials associated with the selected application.

## Solution Implemented

We modified the credential retrieval process to include the application ID from localStorage when making API calls to retrieve secrets:

1. Updated the `decryptCredentialData` function in `packages/components/src/utils.ts` to include the application ID as a query parameter in the API request.

2. Added logic to check if we're in a browser environment before trying to access localStorage.

3. Added error handling to continue without the application ID if there's an error accessing localStorage.

## Code Changes

### Updated the `decryptCredentialData` function

```typescript
export const decryptCredentialData = async (
    encryptedData: string,
    componentCredentialName?: string,
    componentCredentials?: IComponentCredentials
): Promise<ICommonObject> => {
    logger.debug('========= Start of decryptCredentialData (components) =========')
    logger.debug(`encryptedData: ${encryptedData}`)
    logger.debug(`componentCredentialName: ${componentCredentialName || 'none'}`)
    logger.debug(`componentCredentials: ${componentCredentials ? 'provided' : 'none'}`)
    
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
            // Get application ID from localStorage if available
            let applicationId = ''
            try {
                // Check if we're in a browser environment
                if (typeof localStorage !== 'undefined') {
                    applicationId = localStorage.getItem('selectedApplicationId') || ''
                    if (applicationId) {
                        logger.debug(`Adding applicationId query parameter: ${applicationId}`)
                        // Add applicationId as a query parameter
                        url = `${url}?applicationId=${applicationId}`
                    }
                }
            } catch (e) {
                logger.debug(`Error getting application ID from localStorage: ${e}`)
                // Continue without application ID if there's an error
            }
            
            logger.debug(`Making API call to ${url}`)
            // Call the API to get the secret from Supabase
            const response = await axios.get(url)
            // ... rest of the function
        }
        // ... rest of the function
    }
    // ... rest of the function
}
```

## Benefits of the Fix

1. **Proper Application Context**: The system now correctly passes the application context when retrieving credentials, ensuring that the right credentials are found.

2. **Consistent Behavior**: The behavior in the canvas view now matches the behavior in the API and other parts of the application.

3. **Improved Error Handling**: Added error handling to gracefully continue if localStorage is not available or if there's an error accessing it.

4. **Better Logging**: Added more detailed logging to help diagnose any future issues with credential retrieval.

## Testing

To test this fix:

1. Create a credential (e.g., Anthropic API key) in a specific application.
2. Create a chatflow that uses that credential.
3. Test the chatflow in the canvas view using the internal chat window.
4. Verify that the credential is successfully retrieved and the flow executes without "API key not found" errors.

## Conclusion

This fix addresses a critical issue in our credential retrieval process by ensuring that the application context is properly passed when retrieving secrets from Supabase. It enables users to test agents in the canvas view without encountering credential retrieval errors.

## Related Issues

- JWT Token Used as Key ID (March 13, 2025)
- API Key User UUID Issue (March 15, 2025)
- Application Context Filtering (March 15, 2025)

## Next Steps

1. Update RLS policies to match our JWT claims structure
2. Implement proper token refresh
3. Standardize application ID handling throughout the codebase 