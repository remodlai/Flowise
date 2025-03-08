# Implementation Details

This document provides detailed information about the implementation of the AWS Secrets to Supabase migration.

## Code Changes

### 1. Secrets Table Creation

The migration began with creating a `secrets` table in Supabase:

```sql
-- packages/server/src/migrations/multi-tenant/secrets_management/01_create_secrets_table.sql

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

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER update_secrets_updated_at
BEFORE UPDATE ON public.secrets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 2. RLS Policies Implementation

Row-Level Security policies were implemented to control access to the secrets:

```sql
-- packages/server/src/migrations/multi-tenant/secrets_management/02_create_rls_policies.sql

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

-- Users can manage their own secrets
CREATE POLICY "Users can manage their own secrets" 
ON public.secrets
FOR ALL
TO authenticated
USING (
    metadata->>'user_id' = auth.uid()::text
);

-- Create a function to check if a user has access to a secret
CREATE OR REPLACE FUNCTION authorize_secret_access(secret_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    secret_record RECORD;
    user_id UUID;
BEGIN
    -- Get the current user ID
    user_id := auth.uid();
    
    -- If no user is authenticated, deny access
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get the secret record
    SELECT * INTO secret_record FROM public.secrets WHERE id = secret_id;
    
    -- If the secret doesn't exist, deny access
    IF secret_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If the user is the owner of the secret, allow access
    IF secret_record.metadata->>'user_id' = user_id::text THEN
        RETURN TRUE;
    END IF;
    
    -- If the user has platform.global permission, allow access
    IF authorize('platform.global') THEN
        RETURN TRUE;
    END IF;
    
    -- If the user has secrets.access permission, allow access
    IF authorize('secrets.access') THEN
        RETURN TRUE;
    END IF;
    
    -- Otherwise, deny access
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Secrets Service Implementation

A new Secrets Service was created to provide a unified API for managing secrets:

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

// Store a secret
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

// Retrieve a secret
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

// Get a secret by key ID
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
        
        if (error) throw error
        if (!data || data.length === 0) {
            console.warn(`No secret found with key ID: ${keyId}${applicationId && applicationId !== 'global' ? ` and application ID: ${applicationId}` : ''}`)
            return null
        }
        
        // If multiple rows are found, use the first one but log a warning
        if (data.length > 1) {
            console.warn(`Multiple secrets found with key ID: ${keyId}, using the first one`)
        }
        
        const secretData = data[0]
        
        // Decrypt the value
        const masterKey = getMasterEncryptionKey()
        const decryptedBytes = AES.decrypt(secretData.value, masterKey)
        const decryptedValue = decryptedBytes.toString(enc.Utf8)
        
        return {
            id: secretData.id,
            value: JSON.parse(decryptedValue),
            metadata: secretData.metadata
        }
    } catch (error) {
        console.error(`Error retrieving secret by key ID: ${getErrorMessage(error)}`)
        return null
    }
}

// Update a secret
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

// Delete a secret
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

// List secrets
export const listSecrets = async (type: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('secrets')
            .select('id, key_id, name, metadata')
            .eq('type', type)
            .order('name')
        
        if (error) throw error
        
        return data || []
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error listing secrets: ${getErrorMessage(error)}`
        )
    }
}
```

### 4. API Key Service Update

The API Key Service was updated to use the Secrets Service:

```typescript
// packages/server/src/services/apikey/index.ts

import { StatusCodes } from 'http-status-codes'
import {
    generateAPIKey,
    generateSecretHash
} from '../../utils/apiKey'
import { addChatflowsCount } from '../../utils/addChatflowsCount'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { randomBytes } from 'crypto'
import { storeSecret, getSecret, getSecretByKeyId, updateSecret, deleteSecret, listSecrets } from '../secrets'

// Get all API keys
const getAllApiKeys = async () => {
    try {
        // Get all API keys from Supabase
        const secrets = await listSecrets('api_key')
        
        // Format the response to match the expected structure
        const keys = await Promise.all(secrets.map(async (item) => {
            const secretData = await getSecret(item.id)
            return {
                id: item.key_id,
                keyName: item.name,
                apiKey: item.key_id,
                apiSecret: secretData.apiSecret,
                createdAt: item.metadata.createdAt || new Date().toISOString()
            }
        }))
        
        // Create a default key if none exist
        if (keys.length === 0) {
            await createApiKey('DefaultKey')
            return getAllApiKeys()
        }
        
        return await addChatflowsCount(keys)
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getAllApiKeys - ${getErrorMessage(error)}`)
    }
}

// Get API key
const getApiKey = async (apiKey: string) => {
    try {
        // Get the secret by key ID
        const secretData = await getSecretByKeyId(apiKey)
        if (!secretData) return undefined
        
        return {
            id: apiKey,
            apiKey,
            apiSecret: secretData.value.apiSecret,
            keyName: secretData.metadata.keyName
        }
    } catch (error) {
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.getApiKey - ${getErrorMessage(error)}`)
    }
}

// Create API key
const createApiKey = async (keyName: string) => {
    try {
        // Generate API key and secret
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
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.createApiKey - ${getErrorMessage(error)}`)
    }
}

// Update API key
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
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.updateApiKey - ${getErrorMessage(error)}`)
    }
}

// Delete API key
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
        throw new InternalFlowiseError(StatusCodes.INTERNAL_SERVER_ERROR, `Error: apikeyService.deleteApiKey - ${getErrorMessage(error)}`)
    }
}

// Verify API key
const verifyApiKey = async (paramApiKey: string): Promise<string> => {
    try {
        const apiKey = await getSecretByKeyId(paramApiKey)
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

export default {
    getAllApiKeys,
    getApiKey,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    verifyApiKey
}
```

### 5. Credential Management Update

The credential management functions were updated to use the Secrets Service:

```typescript
// packages/server/src/utils/index.ts (partial)

/**
 * Encrypt credential data
 * @param {ICredentialDataDecrypted} plainDataObj
 * @returns {Promise<string>}
 */
export const encryptCredentialData = async (plainDataObj: ICredentialDataDecrypted): Promise<string> => {
    try {
        // Import the secrets service
        const { storeSecret } = await import('../services/secrets')
        
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
        
        // Fallback to existing methods if Supabase fails
        if (USE_AWS_SECRETS_MANAGER && secretsManagerClient) {
            // AWS Secrets Manager fallback
            // ...
        }

        const encryptKey = await getEncryptionKey()
        return AES.encrypt(JSON.stringify(plainDataObj), encryptKey).toString()
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
        // Check if this is a UUID (Supabase secret ID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(encryptedData)) {
            // Import the secrets service
            const { getSecret } = await import('../services/secrets')
            
            // Get from Supabase using the secrets service
            const plainDataObj = await getSecret(encryptedData)
            
            if (componentCredentialName && componentCredentials) {
                return redactCredentialWithPasswordType(componentCredentialName, plainDataObj, componentCredentials)
            }
            
            return plainDataObj
        }
        
        // Fallback to existing methods
        // ...
    } catch (error) {
        console.error('Error decrypting credential data:', error)
        return {}
    }
}
```

### 6. API Key Authentication Middleware

A new middleware was created to handle API key authentication:

```typescript
// packages/server/src/middleware/authenticateApiKey.ts

import { Request, Response, NextFunction } from 'express'
import { validateAPIKey } from '../utils/validateKey'
import logger from '../utils/logger'

/**
 * Middleware to authenticate API keys
 * This should be used before the Supabase authentication middleware
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip authentication for public routes and login-related routes
    if (
      req.path.includes('/public/') || 
      req.path === '/login' || 
      req.path === '/auth/login' || 
      req.path === '/auth/magic-link' ||
      req.path.includes('/auth/callback') ||
      req.path.includes('/node-icon/')
    ) {
      return next()
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // No API key, proceed to Supabase authentication
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1]
    
    // Validate the API key
    const isValidApiKey = await validateAPIKey(req)
    
    if (isValidApiKey) {
      // Set a minimal user object for API key authentication
      req.user = {
        userId: 'api-key-user',
        email: 'api-key@example.com',
        provider: 'api-key',
        userMetadata: {},
        app_metadata: {},
        isPlatformAdmin: true, // API keys have full access
        is_platform_admin: true
      }
      
      logger.info('User authenticated via API key')
      
      // Skip Supabase authentication
      return next()
    }
    
    // API key is invalid, proceed to Supabase authentication
    next()
  } catch (error) {
    logger.error('API key authentication error:', error)
    // Proceed to Supabase authentication
    next()
  }
}
```

### 7. Supabase Authentication Middleware Update

The Supabase authentication middleware was updated to skip authentication if the user is already authenticated via API key:

```typescript
// packages/server/src/utils/supabaseAuth.ts (partial)

/**
 * Middleware to authenticate user with Supabase
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip authentication for public routes and login-related routes
    if (
      req.path.includes('/public/') || 
      req.path === '/login' || 
      req.path === '/auth/login' || 
      req.path === '/auth/magic-link' ||
      req.path.includes('/auth/callback') ||
      req.path.includes('/node-icon/')
    ) {
      return next()
    }

    // Skip Supabase authentication if the user is already authenticated via API key
    if (req.user && req.user.provider === 'api-key') {
      return next()
    }

    // Extract token from Authorization header
    // ...
  } catch (error) {
    // ...
  }
}
```

### 8. Route Mounting Fix

The route mounting was fixed to avoid double mounting of API routes:

```typescript
// packages/server/src/index.ts (partial)

// Mount the main API router
this.app.use('/api/v1', flowiseApiV1Router)

// Mount the custom roles API router directly (not nested)
this.app.use('/api/v1', apiRoutes)
```

```typescript
// packages/server/src/routes/index.ts (partial)

// Remove the nested API route
// router.use('/api/v1', apiRouter)
```

## Migration Scripts

### API Key Migration Script

```typescript
// packages/server/src/scripts/migrateApiKeys.ts

import { getAPIKeys } from '../utils/apiKey'
import { storeSecret } from '../services/secrets'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { ApiKey } from '../database/entities/ApiKey'
import { appConfig } from '../AppConfig'
import logger from '../utils/logger'
import { ICommonObject } from 'flowise-components'

/**
 * One-time migration script to move API keys from JSON or DB to Supabase
 * 
 * This script should be run once to migrate existing API keys to Supabase.
 * After migration, all API key operations will use Supabase directly.
 */
const migrateApiKeys = async () => {
    try {
        console.log('Starting API key migration to Supabase...')
        
        let existingKeys: any[] = []
        let sourceType = 'unknown'
        
        // Get existing API keys from JSON
        if (appConfig.apiKeys.storageType === 'json') {
            console.log('Migrating API keys from JSON storage...')
            existingKeys = await getAPIKeys()
            sourceType = 'json'
        } 
        // Get existing API keys from DB
        else if (appConfig.apiKeys.storageType === 'db') {
            console.log('Migrating API keys from database storage...')
            const appServer = getRunningExpressApp()
            existingKeys = await appServer.AppDataSource.getRepository(ApiKey).find()
            sourceType = 'database'
        }
        else {
            console.log('Unknown storage type. Please set APIKEY_STORAGE_TYPE to "json" or "db".')
            return
        }
        
        console.log(`Found ${existingKeys.length} API keys to migrate from ${sourceType}`)
        
        // Migrate each key to Supabase
        for (const key of existingKeys) {
            console.log(`Migrating key: ${key.keyName}`)
            
            try {
                await storeSecret(
                    key.keyName,
                    'api_key',
                    { apiKey: key.apiKey, apiSecret: key.apiSecret },
                    { keyName: key.keyName, createdAt: key.createdAt || new Date().toISOString() },
                    key.apiKey
                )
                console.log(`Successfully migrated key: ${key.keyName}`)
            } catch (error) {
                console.error(`Error migrating key ${key.keyName}:`, error)
            }
        }
        
        console.log(`Migration completed. ${existingKeys.length} API keys migrated from ${sourceType} to Supabase.`)
        console.log('Please update your environment configuration to use Supabase for API keys.')
    } catch (error) {
        console.error('Error during migration:', error)
    }
}

// Run the migration
migrateApiKeys()
```

### Credential Migration Script

```typescript
// packages/server/src/scripts/migrateCredentials.ts

import { storeSecret } from '../services/secrets'
import { DataSource } from 'typeorm'
import { Credential } from '../database/entities/Credential'
import { AES, enc } from 'crypto-js'
import { getEncryptionKey } from '../utils'
import logger from '../utils/logger'
import path from 'path'

/**
 * One-time migration script to move credentials from local storage or AWS Secrets Manager to Supabase
 * 
 * This script should be run once to migrate existing credentials to Supabase.
 * After migration, all credential operations will use Supabase directly.
 */
const migrateCredentials = async () => {
    try {
        console.log('Starting credentials migration to Supabase...')
        
        // Create a new DataSource instance
        const appDataSource = new DataSource({
            type: process.env.DATABASE_TYPE as any || 'sqlite',
            database: process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite'),
            synchronize: true,
            entities: [Credential],
            migrations: [],
            subscribers: []
        })
        
        // Initialize the DataSource
        await appDataSource.initialize()
        console.log('Database connection initialized')
        
        // Get all credentials
        const credentials = await appDataSource.getRepository(Credential).find()
        console.log(`Found ${credentials.length} credentials to migrate`)
        
        // Get the encryption key for local credentials
        const encryptKey = await getEncryptionKey()
        
        // Migrate each credential to Supabase
        let successCount = 0
        let failCount = 0
        
        for (const credential of credentials) {
            console.log(`Migrating credential: ${credential.name} (${credential.credentialName})`)
            
            try {
                let plainDataObj: any = {}
                
                // Check if this is an AWS Secrets Manager secret
                if (credential.encryptedData.startsWith('FlowiseCredential_')) {
                    console.log(`  - AWS Secrets Manager credential detected`)
                    // Skip for now as we don't have direct access to AWS Secrets Manager in this script
                    console.log(`  - Skipping AWS Secrets Manager credential: ${credential.name}`)
                    failCount++
                    continue
                } else {
                    // Decrypt the credential data using the local encryption key
                    try {
                        const decryptedData = AES.decrypt(credential.encryptedData, encryptKey)
                        const decryptedDataStr = decryptedData.toString(enc.Utf8)
                        plainDataObj = JSON.parse(decryptedDataStr)
                    } catch (error) {
                        console.error(`  - Error decrypting credential ${credential.name}:`, error)
                        failCount++
                        continue
                    }
                }
                
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
                await appDataSource.getRepository(Credential).save(credential)
                
                console.log(`  - Successfully migrated credential: ${credential.name}`)
                successCount++
            } catch (error) {
                console.error(`  - Error migrating credential ${credential.name}:`, error)
                failCount++
            }
        }
        
        console.log(`Migration completed. ${successCount} credentials migrated successfully, ${failCount} failed.`)
        if (failCount > 0) {
            console.log('Please check the logs for details on failed migrations.')
        }
        
        // Close the database connection
        await appDataSource.destroy()
        console.log('Database connection closed')
    } catch (error) {
        console.error('Error during migration:', error)
    }
}

// Run the migration
migrateCredentials()
```

## Testing

The migration was tested by:

1. Creating and verifying API keys in Supabase
2. Testing API key authentication with various endpoints
3. Creating and using credentials stored in Supabase
4. Running the migration scripts to move existing secrets to Supabase

All tests were successful, confirming that the migration was implemented correctly. 