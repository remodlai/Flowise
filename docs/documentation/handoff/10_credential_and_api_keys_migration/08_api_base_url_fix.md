# API Base URL Fix for Credential Retrieval

## Overview

This document explains the issue discovered on March 11, 2025, where credentials could not be retrieved due to incorrect API URL construction in the components package. This was causing "API key not found" errors for all nodes that require credentials, regardless of the node type.

## Problem Description

After implementing the server-side credential retrieval fix documented in [07_server_side_credential_retrieval_fix.md](./07_server_side_credential_retrieval_fix.md), we encountered an issue where the system was still unable to retrieve credentials when executing flows. This resulted in errors like "Anthropic API key not found" for all nodes that require credentials.

The root cause was identified as follows:

1. The `decryptCredentialData` function in the components package was using a relative URL (`/api/v1/secrets/:id`) to make API calls.
2. When using a relative URL with axios, it attempts to connect to the default HTTP port (80) instead of port 3000 where our server is running.
3. This resulted in connection errors or failed API calls, preventing the system from retrieving credential data.

## Key Insights

1. **Axios URL Resolution**: When using a relative URL like `/api/v1/secrets/:id` with axios, it attempts to connect to the default HTTP port (80) of the current host, not the port where our server is running (3000).

2. **Environment Differences**: This issue was particularly problematic in development environments where the server runs on a non-standard port, but could also affect production environments with different port configurations.

3. **Consistent API Access**: We need a consistent way to access the API regardless of the environment (development, staging, production) and regardless of the port configuration.

## Solution Implemented

We implemented a configurable API base URL solution with the following components:

1. Added a new `getApiBaseUrl` function in `packages/components/src/utils.ts` that returns a configurable base URL:
   - It checks for an environment variable `REMODL_API_BASE_URL`
   - If not found, it defaults to `http://localhost:3000`

2. Updated the `decryptCredentialData` function to use this base URL when making API calls to retrieve secrets.

3. Also updated the `platformSettings.ts` file to use the same base URL function for consistency.

## Code Changes

### 1. Added the `getApiBaseUrl` function

```typescript
// Define a configurable API base URL
// This can be set via environment variable or default to localhost:3000
export const getApiBaseUrl = (): string => {
    // Check for environment variable
    if (typeof process !== 'undefined' && process.env && process.env.REMODL_API_BASE_URL) {
        return process.env.REMODL_API_BASE_URL
    }
    
    // Default to localhost:3000
    return 'http://localhost:3000'
}
```

### 2. Updated the `decryptCredentialData` function

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
        // Use the configurable base URL
        const baseUrl = getApiBaseUrl()
        let url = `${baseUrl}/api/v1/secrets/${encryptedData}`
        let decryptedDataStr: string
        
        // ... rest of the function remains the same
    }
    // ... rest of the function remains the same
}
```

### 3. Updated the `platformSettings.ts` file

```typescript
import axios from 'axios'
import { getApiBaseUrl } from './utils'

/**
 * Get a platform setting from the server
 * @param key The key of the setting to retrieve
 * @param defaultValue The default value to return if the setting is not found
 * @returns The value of the setting or the default value
 */
export const getPlatformSetting = async (key: string, defaultValue: string = ''): Promise<string> => {
    try {
        // Use the configurable base URL
        const baseUrl = getApiBaseUrl()
        const response = await axios.get(`${baseUrl}/api/v1/platform/settings/${key}`)
        
        // ... rest of the function remains the same
    }
    // ... rest of the function remains the same
}
```

## Benefits of the Fix

1. **Environment Flexibility**: The solution works across different environments (development, staging, production) regardless of the port configuration.

2. **Configurable via Environment Variable**: The API base URL can be easily configured via the `REMODL_API_BASE_URL` environment variable, making it adaptable to different deployment scenarios.

3. **Consistent API Access**: All API calls use the same base URL, ensuring consistency across the codebase.

4. **Default Fallback**: If the environment variable is not set, the system defaults to `http://localhost:3000`, which works for most development environments.

## Testing

To test this fix:

1. Set the `REMODL_API_BASE_URL` environment variable to the appropriate value for your environment.
2. Create a credential (e.g., Anthropic API key) in a specific application.
3. Create a chatflow that uses that credential.
4. Execute the chatflow via the API.
5. Verify that the credential is successfully retrieved and the flow executes without "API key not found" errors.

## Conclusion

This fix addresses a critical issue in our credential retrieval process by ensuring that API calls use the correct base URL. It enables flows to execute correctly without credential retrieval errors, regardless of the environment or port configuration.

## Related Issues

- Server-Side Credential Retrieval Fix (March 11, 2025)
- Credential Retrieval Fix in Canvas View (March 16, 2025)
- JWT Token Used as Key ID (March 13, 2025)
- API Key User UUID Issue (March 15, 2025)

## Next Steps

1. Update deployment scripts to set the `REMODL_API_BASE_URL` environment variable in production environments.
2. Consider adding a configuration option in the UI for setting the API base URL.
3. Monitor for any regressions or new issues.
4. Update related documentation as needed. 