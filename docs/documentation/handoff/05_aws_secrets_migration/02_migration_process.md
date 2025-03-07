# Migration Process

This document outlines the step-by-step process for migrating secrets from AWS Secrets Manager to Supabase.

## Overview

The migration process was designed to be incremental and non-disruptive, allowing for a smooth transition from AWS Secrets Manager to Supabase for secrets management. The process was divided into several phases, each with specific objectives and tasks.

## Phase 1: Setup and Preparation

### 1.1 Create Secrets Table in Supabase

The first step was to create a `secrets` table in Supabase to store all types of secrets:

```sql
CREATE TABLE IF NOT EXISTS public.secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id TEXT UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
```

### 1.2 Implement RLS Policies

Row-Level Security (RLS) policies were implemented to control access to the secrets:

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

-- Users can manage their own secrets
CREATE POLICY "Users can manage their own secrets" 
ON public.secrets
FOR ALL
TO authenticated
USING (
    metadata->>'user_id' = auth.uid()::text
);
```

### 1.3 Create Secrets Service

A unified Secrets Service was developed to provide a consistent API for managing secrets:

```typescript
// Store a secret
export const storeSecret = async (
    name: string,
    type: string,
    value: any,
    metadata: any = {},
    keyId?: string
): Promise<string> => {
    // Implementation details...
}

// Retrieve a secret
export const getSecret = async (id: string): Promise<any> => {
    // Implementation details...
}

// Get a secret by key ID
export const getSecretByKeyId = async (keyId: string): Promise<any> => {
    // Implementation details...
}

// Update a secret
export const updateSecret = async (id: string, value: any, metadata?: any): Promise<void> => {
    // Implementation details...
}

// Delete a secret
export const deleteSecret = async (id: string): Promise<void> => {
    // Implementation details...
}

// List secrets
export const listSecrets = async (type: string): Promise<any[]> => {
    // Implementation details...
}
```

### 1.4 Update Environment Variables

Environment variables were updated to support the new Supabase-based secrets management:

```
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Secrets Management
SECRETS_STORAGE_TYPE=supabase  # Options: json, db, aws, supabase
```

## Phase 2: API Key Migration

### 2.1 Update API Key Service

The API Key Service was updated to use the Secrets Service:

```typescript
// Get all API keys
const getAllApiKeys = async () => {
    // Implementation using Secrets Service...
}

// Get API key
const getApiKey = async (apiKey: string) => {
    // Implementation using Secrets Service...
}

// Create API key
const createApiKey = async (keyName: string) => {
    // Implementation using Secrets Service...
}

// Update API key
const updateApiKey = async (id: string, keyName: string) => {
    // Implementation using Secrets Service...
}

// Delete API key
const deleteApiKey = async (id: string) => {
    // Implementation using Secrets Service...
}

// Verify API key
const verifyApiKey = async (paramApiKey: string): Promise<string> => {
    // Implementation using Secrets Service...
}
```

### 2.2 Update API Key Validation

The API key validation functions were updated to work with Supabase:

```typescript
// Validate API key
export const validateAPIKey = async (req: Request): Promise<boolean> => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false
        }
        
        const token = authHeader.split(' ')[1]
        
        // Check if this is a valid API key
        const apiKey = await getSecretByKeyId(token)
        if (!apiKey) {
            return false
        }
        
        return true
    } catch (error) {
        console.error('Error validating API key:', error)
        return false
    }
}
```

### 2.3 Create API Key Authentication Middleware

A new middleware was created to handle API key authentication:

```typescript
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Skip authentication for public routes
        if (
            req.path.includes('/public/') || 
            req.path === '/login' || 
            // Other public routes...
        ) {
            return next()
        }

        // Extract token from Authorization header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next() // No API key, proceed to Supabase authentication
        }
        
        // Validate the API key
        const isValidApiKey = await validateAPIKey(req)
        
        if (isValidApiKey) {
            // Set a minimal user object for API key authentication
            req.user = {
                userId: 'api-key-user',
                email: 'api-key@example.com',
                provider: 'api-key',
                // Other user properties...
            }
            
            // Skip Supabase authentication
            return next()
        }
        
        // API key is invalid, proceed to Supabase authentication
        next()
    } catch (error) {
        // Proceed to Supabase authentication
        next()
    }
}
```

### 2.4 Create API Key Migration Script

A migration script was created to move existing API keys to Supabase:

```typescript
const migrateApiKeys = async () => {
    try {
        console.log('Starting API key migration to Supabase...')
        
        let existingKeys: any[] = []
        let sourceType = 'unknown'
        
        // Get existing API keys from JSON or DB
        // ...
        
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
    } catch (error) {
        console.error('Error during migration:', error)
    }
}
```

## Phase 3: Credential Migration

### 3.1 Update Credential Encryption/Decryption

The credential encryption and decryption functions were updated to use the Secrets Service:

```typescript
// Encrypt credential data
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
        // Fallback to existing methods if Supabase fails
        // ...
    }
}

// Decrypt credential data
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
            
            // ...
            
            return plainDataObj
        }
        
        // Fallback to existing methods
        // ...
    } catch (error) {
        // ...
    }
}
```

### 3.2 Create Credential Migration Script

A migration script was created to move existing credentials to Supabase:

```typescript
const migrateCredentials = async () => {
    try {
        console.log('Starting credentials migration to Supabase...')
        
        // Initialize database connection
        // ...
        
        // Get all credentials
        const credentials = await appDataSource.getRepository(Credential).find()
        console.log(`Found ${credentials.length} credentials to migrate`)
        
        // Migrate each credential to Supabase
        for (const credential of credentials) {
            console.log(`Migrating credential: ${credential.name} (${credential.credentialName})`)
            
            try {
                // Decrypt the credential data
                // ...
                
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
            } catch (error) {
                console.error(`  - Error migrating credential ${credential.name}:`, error)
            }
        }
        
        console.log(`Migration completed.`)
    } catch (error) {
        console.error('Error during migration:', error)
    }
}
```

## Phase 4: Testing and Validation

### 4.1 Test API Key Storage

API keys were tested to ensure they were properly stored in Supabase:

1. Create a new API key using the API
2. Verify the API key exists in the Supabase `secrets` table
3. Retrieve the API key using the API
4. Update the API key name
5. Delete the API key

### 4.2 Test API Key Authentication

API key authentication was tested to ensure it worked correctly:

1. Create a new API key
2. Use the API key to access a protected endpoint
3. Verify the request is authenticated
4. Use an invalid API key and verify authentication fails

### 4.3 Test Credential Storage

Credentials were tested to ensure they were properly stored in Supabase:

1. Create a new credential using the API
2. Verify the credential exists in the Supabase `secrets` table
3. Retrieve the credential using the API
4. Update the credential
5. Delete the credential

## Phase 5: Cleanup

### 5.1 Fix Route Mounting

The route mounting was fixed to avoid double mounting of API routes:

```typescript
// Mount the main API router
this.app.use('/api/v1', flowiseApiV1Router)

// Mount the custom roles API router directly (not nested)
this.app.use('/api/v1', apiRoutes)
```

### 5.2 Update Documentation

Documentation was updated to reflect the new secrets management system:

1. Create a new documentation folder for the AWS Secrets to Supabase migration
2. Document the migration plan
3. Document the technical implementation
4. Document the benefits and rationale
5. Create a README file

## Running the Migration

To run the migration, follow these steps:

1. Ensure Supabase is properly configured with the required tables and RLS policies
2. Update environment variables to include Supabase configuration
3. Run the API key migration script:
   ```
   npm run migrate:apikeys
   ```
4. Run the credential migration script:
   ```
   npm run migrate:credentials
   ```
5. Test the migration to ensure everything is working correctly
6. Update the environment configuration to use Supabase for secrets management:
   ```
   SECRETS_STORAGE_TYPE=supabase
   ```

## Rollback Plan

In case of issues, a rollback plan was prepared:

1. Revert environment variables to use the previous storage type:
   ```
   SECRETS_STORAGE_TYPE=aws  # or json, db
   ```
2. Revert code changes if necessary
3. Continue using the previous secrets management system until issues are resolved

## Conclusion

The migration from AWS Secrets Manager to Supabase was completed successfully, resulting in a unified, simplified, and more secure secrets management system. The incremental approach allowed for a smooth transition without disrupting existing functionality. 