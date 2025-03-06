# AWS Secrets to Supabase Migration Plan

## Overview

This document outlines the plan to migrate from AWS Secrets Manager to Supabase for secrets management in the Remodl AI platform. This migration will unify our authentication and secrets management systems, simplify the architecture, and provide consistent access control across environments.

## Current State

The platform currently uses multiple approaches for secrets management:

1. **API Keys**: Stored in either JSON files or a database table (`apikey`)
2. **Encryption Keys**: Stored locally or in AWS Secrets Manager
3. **Credentials**: Encrypted and stored in the database, with encryption keys from local storage or AWS Secrets Manager
4. **Supabase Credentials**: Stored in environment variables

This creates complexity and inconsistency between development and production environments.

## Target State

After migration, all secrets will be stored in Supabase:

1. **API Keys**: Stored in a Supabase `secrets` table with appropriate RLS policies
2. **Encryption Keys**: A master encryption key stored as an environment variable
3. **Credentials**: Encrypted and stored in the Supabase `secrets` table
4. **Supabase Credentials**: Remain in environment variables

This will provide a unified approach to secrets management across all environments.

## Migration Checklist

### Phase 1: Setup and Preparation

- [x] 1.1. Create the `secrets` table in Supabase
- [x] 1.2. Implement RLS policies for the `secrets` table
- [ ] 1.3. Create the Secrets Service for managing secrets in Supabase
- [ ] 1.4. Update environment variables configuration

### Phase 2: API Key Migration

- [ ] 2.1. Update the API Key Service to use Supabase
- [ ] 2.2. Update API Key validation functions
- [ ] 2.3. Create a migration script for existing API keys
- [ ] 2.4. Test API Key CRUD operations with Supabase
- [ ] 2.5. Test API Key validation with existing endpoints

### Phase 3: Credential Migration

- [ ] 3.1. Update credential encryption/decryption functions
- [ ] 3.2. Create a migration script for existing credentials
- [ ] 3.3. Test credential CRUD operations with Supabase
- [ ] 3.4. Test credential usage in chatflows

### Phase 4: Testing and Validation

- [ ] 4.1. Comprehensive testing in development environment
- [ ] 4.2. Verify all API endpoints work with the new secrets management
- [ ] 4.3. Verify chatflows can access credentials properly
- [ ] 4.4. Performance testing for Supabase secrets retrieval

### Phase 5: Cleanup

- [ ] 5.1. Remove AWS Secrets Manager code
- [ ] 5.2. Remove local file-based secrets storage code
- [ ] 5.3. Update documentation
- [ ] 5.4. Remove unused environment variables

## Detailed Implementation Plan

### 1. Create the Secrets Table in Supabase

Create a SQL migration file:

```sql
-- packages/server/src/migrations/multi-tenant/secrets_management/01_create_secrets_table.sql

-- Create a table for storing all types of secrets
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

-- Add RLS policies
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

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

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER update_secrets_updated_at
BEFORE UPDATE ON public.secrets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create the Secrets Service

Create a new service for managing secrets:

```typescript
// packages/server/src/services/secrets/index.ts

import { supabase } from '../../utils/supabase'
import { AES, enc } from 'crypto-js'
import { randomBytes } from 'crypto'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import { getErrorMessage } from '../../errors/utils'

// Get the master encryption key from environment variable
const getMasterEncryptionKey = (): string => {
    return process.env.FLOWISE_SECRETKEY_OVERWRITE || 'flowise-default-key'
}

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
    try {
        // Encrypt the value
        const masterKey = getMasterEncryptionKey()
        const encryptedValue = AES.encrypt(JSON.stringify(value), masterKey).toString()
        
        // Store in Supabase
        const { data, error } = await supabase
            .from('secrets')
            .insert({
                key_id: keyId || null,
                name,
                type,
                value: encryptedValue,
                metadata
            })
            .select('id')
            .single()
        
        if (error) throw error
        
        return data.id
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error storing secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Retrieve and decrypt a secret from Supabase
 * @param id ID of the secret to retrieve
 * @returns The decrypted secret value
 */
export const getSecret = async (id: string): Promise<any> => {
    try {
        // Get from Supabase
        const { data, error } = await supabase
            .from('secrets')
            .select('value')
            .eq('id', id)
            .single()
        
        if (error) throw error
        if (!data) throw new Error('Secret not found')
        
        // Decrypt the value
        const masterKey = getMasterEncryptionKey()
        const decryptedBytes = AES.decrypt(data.value, masterKey)
        const decryptedValue = decryptedBytes.toString(enc.Utf8)
        
        return JSON.parse(decryptedValue)
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error retrieving secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Get a secret by key ID (for API keys)
 * @param keyId The API key ID
 * @returns The secret data
 */
export const getSecretByKeyId = async (keyId: string): Promise<any> => {
    try {
        // Get from Supabase
        const { data, error } = await supabase
            .from('secrets')
            .select('id, value, metadata')
            .eq('key_id', keyId)
            .single()
        
        if (error) throw error
        if (!data) return null
        
        // Decrypt the value
        const masterKey = getMasterEncryptionKey()
        const decryptedBytes = AES.decrypt(data.value, masterKey)
        const decryptedValue = decryptedBytes.toString(enc.Utf8)
        
        return {
            id: data.id,
            value: JSON.parse(decryptedValue),
            metadata: data.metadata
        }
    } catch (error) {
        console.error(`Error retrieving secret by key ID: ${getErrorMessage(error)}`)
        return null
    }
}

/**
 * Update an existing secret
 * @param id ID of the secret to update
 * @param value New value
 * @param metadata New metadata (optional)
 */
export const updateSecret = async (id: string, value: any, metadata?: any): Promise<void> => {
    try {
        // Encrypt the value
        const masterKey = getMasterEncryptionKey()
        const encryptedValue = AES.encrypt(JSON.stringify(value), masterKey).toString()
        
        // Update in Supabase
        const updateData: any = { value: encryptedValue }
        if (metadata !== undefined) {
            updateData.metadata = metadata
        }
        
        const { error } = await supabase
            .from('secrets')
            .update(updateData)
            .eq('id', id)
        
        if (error) throw error
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error updating secret: ${getErrorMessage(error)}`
        )
    }
}

/**
 * Delete a secret
 * @param id ID of the secret to delete
 */
export const deleteSecret = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('secrets')
            .delete()
            .eq('id', id)
        
        if (error) throw error
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error deleting secret: ${getErrorMessage(error)}`
        )
    }
}

export {
    storeSecret,
    getSecret,
    getSecretByKeyId,
    updateSecret,
    deleteSecret
}
```

### 3. Update API Key Service

Modify the API key service to use Supabase:

```typescript
// packages/server/src/services/apikey/index.ts

import { StatusCodes } from 'http-status-codes'
import { generateAPIKey, generateSecretHash } from '../../utils/apiKey'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { randomBytes } from 'crypto'
import { supabase } from '../../utils/supabase'
import { storeSecret, getSecret, getSecretByKeyId, updateSecret, deleteSecret } from '../secrets'

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

// Other functions (getApiKey, createApiKey, updateApiKey, deleteApiKey, verifyApiKey)
// ...

export default {
    getAllApiKeys,
    getApiKey,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    verifyApiKey
}
```

### 4. Update Credential Management

Modify the credential management functions:

```typescript
// packages/server/src/utils/index.ts (modified functions)

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

### 5. Create Migration Scripts

Create scripts to migrate existing secrets:

```typescript
// packages/server/src/scripts/migrateSecrets.ts

import { getAPIKeys } from '../utils/apiKey'
import { storeSecret } from '../services/secrets'
import { supabase } from '../utils/supabase'
import { Credential } from '../database/entities/Credential'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { AES, enc } from 'crypto-js'
import { getEncryptionKey } from '../utils'

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

// Run the migrations
const runMigrations = async () => {
    await migrateApiKeys()
    await migrateCredentials()
    console.log('All migrations completed')
}

runMigrations()
```

## Environment Variables

Update the environment variables:

```
# Remove these variables
# SECRETKEY_STORAGE_TYPE=aws
# SECRETKEY_AWS_REGION
# SECRETKEY_AWS_ACCESS_KEY
# SECRETKEY_AWS_SECRET_KEY
# APIKEY_STORAGE_TYPE
# APIKEY_PATH

# Add/keep these variables
FLOWISE_SECRETKEY_OVERWRITE=your-secure-master-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Testing Strategy

1. **Unit Testing**:
   - Test the Secrets Service functions
   - Test the updated API Key Service functions
   - Test the updated credential encryption/decryption functions

2. **Integration Testing**:
   - Test API Key CRUD operations
   - Test credential CRUD operations
   - Test API Key validation with existing endpoints
   - Test credential usage in chatflows

3. **End-to-End Testing**:
   - Test the complete flow from creating an API key to using it for authentication
   - Test the complete flow from creating a credential to using it in a chatflow

## Rollback Plan

If issues are encountered during migration:

1. Keep the old code paths intact during initial deployment
2. Add feature flags to switch between old and new implementations
3. If problems occur, switch back to the old implementation
4. Fix issues and retry the migration

## Timeline

1. **Phase 1 (Setup)**: 1-2 days
2. **Phase 2 (API Key Migration)**: 2-3 days
3. **Phase 3 (Credential Migration)**: 2-3 days
4. **Phase 4 (Testing)**: 2-3 days
5. **Phase 5 (Cleanup)**: 1 day

Total estimated time: 8-12 days

## Conclusion

This migration will simplify our architecture, unify our authentication and secrets management systems, and provide consistent access control across environments. By using Supabase for both authentication and secrets management, we'll reduce complexity and improve maintainability. 