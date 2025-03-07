# AWS Secrets to Supabase Migration

## Overview

This document provides a comprehensive overview of the migration from AWS Secrets Manager to Supabase for secrets management in the Remodl AI platform. This migration unifies our authentication and secrets management systems, simplifies the architecture, and provides consistent access control across environments.

## Why We Migrated

The platform previously used multiple approaches for secrets management:

1. **API Keys**: Stored in either JSON files or a database table (`apikey`)
2. **Encryption Keys**: Stored locally or in AWS Secrets Manager
3. **Credentials**: Encrypted and stored in the database, with encryption keys from local storage or AWS Secrets Manager
4. **Supabase Credentials**: Stored in environment variables

This created complexity and inconsistency between development and production environments. By migrating to Supabase, we've:

- **Unified Authentication and Secrets Management**: Created a single system for both authentication and secrets management
- **Simplified Architecture**: Eliminated multiple storage mechanisms
- **Improved Security**: Implemented consistent encryption and access control
- **Ensured Backward Compatibility**: Maintained the same API for clients
- **Provided Consistent Environment Configuration**: Used the same approach in all environments

## How It Works

### Secrets Table

All secrets are now stored in a Supabase `secrets` table with the following structure:

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

### Row-Level Security Policies

The following RLS policies control access to the secrets:

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

### Secrets Service

A new Secrets Service provides a unified API for managing secrets:

```typescript
// Store a secret
const secretId = await storeSecret(
    'MySecret',
    'api_key',
    { apiKey: 'abc123', apiSecret: 'xyz789' },
    { keyName: 'MySecret', createdAt: new Date().toISOString() },
    'abc123'
);

// Retrieve a secret
const secretData = await getSecret(secretId);

// Update a secret
await updateSecret(secretId, newValue, newMetadata);

// Delete a secret
await deleteSecret(secretId);
```

### API Key Authentication

API keys are now authenticated using the same middleware as Supabase JWT tokens:

1. The `authenticateApiKey` middleware checks for API keys in the Authorization header
2. If a valid API key is found, it sets the user on the request and skips Supabase authentication
3. If no API key is found or it's invalid, it proceeds to Supabase authentication

```typescript
// API key authentication middleware
app.use('/api/v1', authenticateApiKey);

// Supabase authentication middleware
app.use('/api/v1', authenticateUser);
```

### Credential Management

Credentials are now encrypted and stored in Supabase:

```typescript
// Encrypt credential data
const secretId = await encryptCredentialData(plainDataObj);

// Decrypt credential data
const plainDataObj = await decryptCredentialData(secretId);
```

## Usage Instructions

### API Keys

API keys can be used to authenticate requests to the API:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/v1/user/applications
```

To verify an API key:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/v1/verify/apikey/YOUR_API_KEY
```

### Credentials

Credentials are automatically encrypted and stored in Supabase when created through the UI. The credential ID stored in the database is now a UUID that references the secret in Supabase.

### Environment Variables

The following environment variables are used:

```
# Master encryption key for secrets
FLOWISE_SECRETKEY_OVERWRITE=your-secure-master-key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Migration Scripts

Two migration scripts were created to move existing secrets to Supabase:

1. `migrateApiKeys.ts`: Migrates API keys from JSON or DB to Supabase
2. `migrateCredentials.ts`: Migrates credentials from local storage or AWS Secrets Manager to Supabase

To run the migration scripts:

```bash
cd packages/server
npx ts-node src/scripts/migrateApiKeys.ts
npx ts-node src/scripts/migrateCredentials.ts
```

## Troubleshooting

### API Key Authentication Issues

If API key authentication is not working:

1. Verify that the API key exists in the `secrets` table
2. Check that the API key is being sent in the Authorization header with the Bearer prefix
3. Ensure that the `authenticateApiKey` middleware is being applied before the `authenticateUser` middleware

### Credential Encryption/Decryption Issues

If credential encryption/decryption is not working:

1. Verify that the `FLOWISE_SECRETKEY_OVERWRITE` environment variable is set correctly
2. Check that the credential ID is a valid UUID that exists in the `secrets` table
3. Ensure that the Supabase connection is working correctly

## Further Reading

For more detailed information, refer to the following documentation:

1. [Migration Plan](../../aws_secrets_migration/01_migration_plan.md)
2. [Technical Implementation](../../aws_secrets_migration/02_technical_implementation.md)
3. [Benefits and Rationale](../../aws_secrets_migration/03_benefits_and_rationale.md) 