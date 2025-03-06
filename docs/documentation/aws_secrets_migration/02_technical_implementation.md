# Technical Implementation Details

This document provides detailed technical information about the implementation of the AWS Secrets to Supabase migration.

## Database Schema

### Secrets Table

The core of the implementation is the `secrets` table in Supabase:

```sql
CREATE TABLE IF NOT EXISTS public.secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT UNIQUE, -- For API keys, this is the API key ID
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'api_key', 'credential', etc.
    value TEXT NOT NULL, -- Encrypted value
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Fields:**
- `id`: UUID primary key
- `key_id`: Unique identifier for API keys (optional, used for lookups)
- `name`: Human-readable name for the secret
- `type`: Type of secret ('api_key', 'credential', etc.)
- `value`: Encrypted value of the secret
- `metadata`: Additional metadata as JSON (e.g., creation date, owner, etc.)
- `created_at`: Timestamp when the secret was created
- `updated_at`: Timestamp when the secret was last updated

### Row-Level Security Policies

The following RLS policies will be applied to the `secrets` table:

```sql
-- Only platform admins can manage all secrets
CREATE POLICY "Platform admins can manage all secrets" 
ON public.secrets
FOR ALL
TO authenticated
USING (authorize('platform.global'));

-- Users can access secrets they have permission for
CREATE POLICY "Users can access authorized secrets" 
ON public.secrets
FOR SELECT
TO authenticated
USING (authorize('secrets.access'));
```

## Secrets Service

The Secrets Service provides a unified API for managing secrets in Supabase:

### Core Functions

#### 1. `storeSecret`

```typescript
/**
 * Store a secret in Supabase
 * @param name Name of the secret
 * @param type Type of secret (api_key, credential, etc.)
 * @param value Value to encrypt and store
 * @param metadata Additional metadata
 * @param keyId Optional key ID for API keys
 * @returns The ID of the stored secret
 */
export const storeSecret = async (
    name: string,
    type: string,
    value: any,
    metadata: any = {},
    keyId?: string
): Promise<string> => {
    // Implementation details...
}
```

#### 2. `getSecret`

```typescript
/**
 * Retrieve and decrypt a secret from Supabase
 * @param id ID of the secret to retrieve
 * @returns The decrypted secret value
 */
export const getSecret = async (id: string): Promise<any> => {
    // Implementation details...
}
```

#### 3. `getSecretByKeyId`

```typescript
/**
 * Get a secret by key ID (for API keys)
 * @param keyId The API key ID
 * @returns The secret data
 */
export const getSecretByKeyId = async (keyId: string): Promise<any> => {
    // Implementation details...
}
```

#### 4. `updateSecret`

```typescript
/**
 * Update an existing secret
 * @param id ID of the secret to update
 * @param value New value
 * @param metadata New metadata (optional)
 */
export const updateSecret = async (id: string, value: any, metadata?: any): Promise<void> => {
    // Implementation details...
}
```

#### 5. `deleteSecret`

```typescript
/**
 * Delete a secret
 * @param id ID of the secret to delete
 */
export const deleteSecret = async (id: string): Promise<void> => {
    // Implementation details...
}
```

### Encryption

All secrets are encrypted before being stored in Supabase:

```typescript
// Get the master encryption key from environment variable
const getMasterEncryptionKey = (): string => {
    return process.env.FLOWISE_SECRETKEY_OVERWRITE || 'flowise-default-key'
}

// Encrypt a value
const encryptedValue = AES.encrypt(JSON.stringify(value), masterKey).toString()

// Decrypt a value
const decryptedBytes = AES.decrypt(data.value, masterKey)
const decryptedValue = decryptedBytes.toString(enc.Utf8)
const plainDataObj = JSON.parse(decryptedValue)
```

## API Key Service Integration

The API Key Service will be updated to use the Secrets Service:

### 1. `getAllApiKeys`

```typescript
const getAllApiKeys = async () => {
    try {
        // Get all API keys from Supabase
        const { data, error } = await supabase
            .from('secrets')
            .select('id, key_id, name, metadata')
            .eq('type', 'api_key')
            .order('name')
        
        if (error) throw error
        
        // Format the response to match the expected structure
        const keys = await Promise.all(data.map(async (item) => {
            const secretData = await getSecret(item.id)
            return {
                id: item.key_id,
                keyName: item.name,
                apiKey: secretData.apiKey,
                apiSecret: secretData.apiSecret,
                createdAt: item.metadata.createdAt || new Date().toISOString()
            }
        }))
        
        return keys
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: apikeyService.getAllApiKeys - ${getErrorMessage(error)}`
        )
    }
}
```

### 2. `getApiKey`

```typescript
const getApiKey = async (apiKey: string) => {
    try {
        const secretData = await getSecretByKeyId(apiKey)
        if (!secretData) return undefined
        
        return {
            id: apiKey,
            apiKey,
            apiSecret: secretData.value.apiSecret,
            keyName: secretData.metadata.keyName
        }
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: apikeyService.getApiKey - ${getErrorMessage(error)}`
        )
    }
}
```

### 3. `createApiKey`

```typescript
const createApiKey = async (keyName: string) => {
    try {
        const apiKey = generateAPIKey()
        const apiSecret = generateSecretHash(apiKey)
        
        // Store in Supabase
        await storeSecret(
            keyName,
            'api_key',
            { apiKey, apiSecret },
            { keyName, createdAt: new Date().toISOString() },
            apiKey
        )
        
        return getAllApiKeys()
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: apikeyService.createApiKey - ${getErrorMessage(error)}`
        )
    }
}
```

### 4. `updateApiKey`

```typescript
const updateApiKey = async (id: string, keyName: string) => {
    try {
        // Get the secret by key ID
        const secretData = await getSecretByKeyId(id)
        if (!secretData) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `API key not found: ${id}`
            )
        }
        
        // Update the metadata
        const metadata = { ...secretData.metadata, keyName }
        await updateSecret(secretData.id, secretData.value, metadata)
        
        return getAllApiKeys()
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: apikeyService.updateApiKey - ${getErrorMessage(error)}`
        )
    }
}
```

### 5. `deleteApiKey`

```typescript
const deleteApiKey = async (id: string) => {
    try {
        // Get the secret by key ID
        const secretData = await getSecretByKeyId(id)
        if (!secretData) {
            throw new InternalFlowiseError(
                StatusCodes.NOT_FOUND,
                `API key not found: ${id}`
            )
        }
        
        // Delete the secret
        await deleteSecret(secretData.id)
        
        return getAllApiKeys()
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: apikeyService.deleteApiKey - ${getErrorMessage(error)}`
        )
    }
}
```

### 6. `verifyApiKey`

```typescript
const verifyApiKey = async (paramApiKey: string): Promise<string> => {
    try {
        const apiKey = await getApiKey(paramApiKey)
        if (!apiKey) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, `Unauthorized`)
        }
        return 'OK'
    } catch (error) {
        if (error instanceof InternalFlowiseError && error.statusCode === StatusCodes.UNAUTHORIZED) {
            throw error
        } else {
            throw new InternalFlowiseError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                `Error: apikeyService.verifyApiKey - ${getErrorMessage(error)}`
            )
        }
    }
}
```

## Credential Management Integration

The credential management functions will be updated to use the Secrets Service:

### 1. `encryptCredentialData`

```typescript
/**
 * Encrypt credential data
 * @param {ICredentialDataDecrypted} plainDataObj
 * @returns {Promise<string>}
 */
export const encryptCredentialData = async (plainDataObj: ICredentialDataDecrypted): Promise<string> => {
    try {
        // Generate a unique ID for the credential
        const credentialId = randomBytes(12).toString('hex')
        
        // Store in Supabase using the secrets service
        const secretId = await storeSecret(
            `Credential_${credentialId}`,
            'credential',
            plainDataObj,
            { credentialId }
        )
        
        return secretId
    } catch (error) {
        console.error('Error encrypting credential data:', error)
        throw new Error('Failed to encrypt credential data')
    }
}
```

### 2. `decryptCredentialData`

```typescript
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @returns {Promise<ICredentialDataDecrypted>}
 */
export const decryptCredentialData = async (
    encryptedData: string,
    componentCredentialName?: string,
    componentCredentials?: IComponentCredentials
): Promise<ICredentialDataDecrypted> => {
    try {
        // Get from Supabase using the secrets service
        const plainDataObj = await getSecret(encryptedData)
        
        if (componentCredentialName && componentCredentials) {
            return redactCredentialWithPasswordType(componentCredentialName, plainDataObj, componentCredentials)
        }
        
        return plainDataObj
    } catch (error) {
        console.error('Error decrypting credential data:', error)
        return {}
    }
}
```

## Migration Scripts

### API Key Migration

```typescript
const migrateApiKeys = async () => {
    try {
        console.log('Starting API key migration...')
        
        // Get existing API keys
        const existingKeys = await getAPIKeys()
        console.log(`Found ${existingKeys.length} API keys to migrate`)
        
        // Migrate each key to Supabase
        for (const key of existingKeys) {
            console.log(`Migrating key: ${key.keyName}`)
            
            await storeSecret(
                key.keyName,
                'api_key',
                { apiKey: key.apiKey, apiSecret: key.apiSecret },
                { keyName: key.keyName, createdAt: key.createdAt || new Date().toISOString() },
                key.apiKey
            )
        }
        
        console.log('API key migration completed successfully')
    } catch (error) {
        console.error('Error migrating API keys:', error)
    }
}
```

### Credential Migration

```typescript
const migrateCredentials = async () => {
    try {
        console.log('Starting credentials migration...')
        
        // Get the app server
        const appServer = getRunningExpressApp()
        
        // Get all credentials
        const credentials = await appServer.AppDataSource.getRepository(Credential).find()
        console.log(`Found ${credentials.length} credentials to migrate`)
        
        // Get the encryption key
        const encryptKey = await getEncryptionKey()
        
        // Migrate each credential to Supabase
        for (const credential of credentials) {
            console.log(`Migrating credential: ${credential.name}`)
            
            try {
                // Decrypt the credential data
                const decryptedData = AES.decrypt(credential.encryptedData, encryptKey)
                const decryptedDataStr = decryptedData.toString(enc.Utf8)
                const plainDataObj = JSON.parse(decryptedDataStr)
                
                // Store in Supabase
                const secretId = await storeSecret(
                    credential.name,
                    'credential',
                    plainDataObj,
                    { 
                        credentialId: credential.id,
                        type: credential.credentialName
                    }
                )
                
                // Update the credential with the new secret ID
                credential.encryptedData = secretId
                await appServer.AppDataSource.getRepository(Credential).save(credential)
            } catch (error) {
                console.error(`Error migrating credential ${credential.name}:`, error)
            }
        }
        
        console.log('Credentials migration completed successfully')
    } catch (error) {
        console.error('Error migrating credentials:', error)
    }
}
```

## API Key Validation

The API key validation functions will be updated to use the Secrets Service:

```typescript
/**
 * Validate API Key
 * @param {Request} req
 */
export const validateAPIKey = async (req: Request) => {
    const authorizationHeader = (req.headers['Authorization'] as string) ?? (req.headers['authorization'] as string) ?? ''
    if (!authorizationHeader) return false

    const suppliedKey = authorizationHeader.split(`Bearer `).pop()
    if (suppliedKey) {
        try {
            await apikeyService.verifyApiKey(suppliedKey)
            return true
        } catch (error) {
            return false
        }
    }
    return false
}
```

## Environment Variables

The following environment variables will be used:

```
# Master encryption key for secrets
FLOWISE_SECRETKEY_OVERWRITE=your-secure-master-key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## File Structure

The following files will be created or modified:

### New Files

- `packages/server/src/services/secrets/index.ts` - Secrets Service
- `packages/server/src/migrations/multi-tenant/secrets_management/01_create_secrets_table.sql` - SQL migration
- `packages/server/src/scripts/migrateSecrets.ts` - Migration script

### Modified Files

- `packages/server/src/services/apikey/index.ts` - API Key Service
- `packages/server/src/utils/index.ts` - Credential management functions
- `packages/server/src/utils/validateKey.ts` - API key validation functions

## Error Handling

All functions in the Secrets Service include proper error handling:

1. **Try-Catch Blocks**: All functions use try-catch blocks to handle errors
2. **Error Logging**: Errors are logged to the console
3. **Error Propagation**: Errors are propagated to the caller with appropriate status codes
4. **Custom Error Types**: The `InternalFlowiseError` class is used for custom errors

## Performance Considerations

1. **Caching**: Consider implementing caching for frequently accessed secrets
2. **Batch Operations**: Use batch operations for migrations to improve performance
3. **Pagination**: Implement pagination for listing large numbers of secrets
4. **Indexing**: Ensure proper indexing on the `secrets` table for efficient queries

## Security Considerations

1. **Encryption**: All secrets are encrypted before being stored in Supabase
2. **Master Key**: The master encryption key is stored as an environment variable
3. **RLS Policies**: Row-Level Security policies restrict access to secrets
4. **Audit Logging**: Consider implementing audit logging for secret access

## Testing

### Unit Tests

Create unit tests for the Secrets Service:

```typescript
// packages/server/test/services/secrets.test.ts

import { storeSecret, getSecret, updateSecret, deleteSecret } from '../../src/services/secrets'

describe('Secrets Service', () => {
    it('should store and retrieve a secret', async () => {
        const secretValue = { key: 'value' }
        const secretId = await storeSecret('test-secret', 'test', secretValue)
        const retrievedValue = await getSecret(secretId)
        expect(retrievedValue).toEqual(secretValue)
    })
    
    // More tests...
})
```

### Integration Tests

Create integration tests for the API Key Service:

```typescript
// packages/server/test/services/apikey.test.ts

import apikeyService from '../../src/services/apikey'

describe('API Key Service', () => {
    it('should create and retrieve an API key', async () => {
        const keyName = 'test-key'
        const keys = await apikeyService.createApiKey(keyName)
        const key = keys.find(k => k.keyName === keyName)
        expect(key).toBeDefined()
        expect(key.keyName).toBe(keyName)
    })
    
    // More tests...
})
```

## Conclusion

This technical implementation provides a unified approach to secrets management using Supabase. By storing all secrets in Supabase with proper encryption and access control, we simplify the architecture and improve security. The migration scripts ensure a smooth transition from the existing systems to the new approach. 