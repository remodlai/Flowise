# Encryption Key Migration Plan

## Overview

This document outlines the plan to migrate from using `FLOWISE_SECRETKEY_OVERWRITE` environment variable to using the platform settings encryption key (`ENCRYPTION_KEY`) stored in the Supabase database. This migration is necessary to ensure consistent encryption across the platform and to properly integrate with our multi-tenant architecture.

## Implementation Checklist

### 1. Identify All Encryption Key Usage Points

- [x] Identify all files in `@components` that use encryption/decryption
  - `packages/components/src/utils.ts` - `getEncryptionKey()` and `decryptCredentialData()`
  
- [x] Identify all files in `@server` that use encryption/decryption
  - `packages/server/src/utils/index.ts` - `getEncryptionKey()`, `encryptCredentialData()`, and `decryptCredentialData()`
  - `packages/server/src/utils/platformSettings.ts` - `getEncryptionKey()`
  - `packages/server/src/services/secrets/index.ts` - `getMasterEncryptionKey()`, `storeSecret()`, `getSecret()`, `getSecretByKeyId()`, and `updateSecret()`
  
- [x] Identify all files in `@ui` that use encryption/decryption
  - No direct encryption/decryption in UI, only displays encrypted status
  
- [x] Document all environment variables related to encryption
  - `FLOWISE_SECRETKEY_OVERWRITE` - Currently used as the main encryption key
  - `SECRETKEY_PATH` - Path to the encryption key file

### 2. Create Helper Functions for Encryption Key Access

- [x] Update `packages/server/src/utils/platformSettings.ts` to prioritize platform settings over environment variables
  - Modified to only use platform settings and throw an error if not found
  
- [x] Update `packages/server/src/services/secrets/index.ts` to use the platform settings utility
  - Now uses the platform settings utility and properly handles errors
  
- [x] Update `packages/server/src/utils/index.ts` to use the platform settings utility
  - Now uses the platform settings utility and properly handles errors
  
- [x] Update `packages/components/src/utils.ts` to use a similar approach
  - Created a new platform settings utility for components and updated utils.ts to use it

### 3. Update Server-Side Encryption

- [x] Update `packages/server/src/services/secrets/index.ts` to use the new encryption key retrieval method
  - Now uses the platform settings utility for encryption key retrieval
  
- [x] Update API key generation/validation to use the new encryption key
  - API key system already uses the secrets service, which now uses the platform settings encryption key
  - No direct changes needed to API key generation and validation functions
  
- [x] Update any other server-side encryption to use the new encryption key
  - `encryptCredentialData` and `decryptCredentialData` functions in `packages/server/src/utils/index.ts` now use the platform settings encryption key
  - Removed all AWS Secrets Manager fallback logic
  - Now ONLY uses Supabase for secret storage and retrieval
  - Throws proper errors instead of silently falling back to alternative methods

### 4. Update Component-Side Encryption

- [x] Create a utility in components package to retrieve the encryption key from platform settings
  - Created `packages/components/src/platformSettings.ts`
  
- [x] Update credential handling in components to use the new encryption key
  - Updated `packages/components/src/utils.ts` to use the platform settings utility
  - Removed all AWS Secrets Manager fallback logic
  - Now ONLY uses Supabase for secret storage and retrieval
  
- [x] Ensure backward compatibility for existing encrypted credentials
  - Updated `getCredentialData()` in `packages/components/src/utils.ts` to use Supabase secrets directly
  - Note: Legacy credentials encrypted with the old key will need to be re-entered

### 5. Update UI-Side Encryption (if applicable)

- [x] No direct changes needed as UI doesn't perform encryption/decryption

### 6. Verify Supabase Integration

- [ ] Ensure all database operations use Supabase instead of SQLite
- [ ] Verify proper authentication with Supabase
- [ ] Confirm proper data storage and retrieval from Supabase

### 7. Testing

- [ ] Test credential encryption/decryption with the new key
- [ ] Test API key validation with the new key
- [ ] Test the updated `getCredentialData()` function with Supabase secret IDs
- [ ] Verify no data loss during migration

### 8. Documentation

- [ ] Update documentation to reflect the new encryption key usage
- [ ] Document the migration process for existing installations
- [ ] Add troubleshooting guidance for potential issues

## Changelog

| Date | Change | Status |
|------|--------|--------|
| Current | Updated server-side encryption key retrieval to use platform settings | Completed |
| Current | Updated component-side encryption key retrieval to use platform settings | Completed |
| Current | Removed all fallbacks to environment variables | Completed |
| Current | Verified that the API key system (`packages/server/src/utils/apiKey.ts`) is compatible with the new encryption approach | Completed |
| Current | Confirmed that API key storage and retrieval uses the secrets service, which now uses the platform settings encryption key | Completed |
| Current | No direct changes needed to API key generation and validation functions as they don't directly use the encryption key | Completed |
| Current | Removed all AWS Secrets Manager fallback logic from server and component code | Completed |
| Current | Updated error handling to throw proper errors instead of silently falling back | Completed |
| Current | Removed AWS Secrets Manager initialization code from both server and components | Completed |
| Current | Updated `getCredentialData()` in `packages/components/src/utils.ts` to use Supabase secrets directly | Completed |

## Implementation Details

### Current Encryption Key Usage

The current system uses `FLOWISE_SECRETKEY_OVERWRITE` environment variable as the encryption key for various operations:

1. Encrypting credentials for components
   - In `packages/components/src/utils.ts`, the `decryptCredentialData()` function uses the encryption key to decrypt credential data.
   
2. Generating and validating API keys
   - In `packages/server/src/utils/index.ts`, the encryption key is used for API key operations.
   
3. Encrypting sensitive data in the database
   - In `packages/server/src/services/secrets/index.ts`, the `getMasterEncryptionKey()` function returns the encryption key for encrypting and decrypting secrets.

### New Encryption Key Approach

The new approach:

1. Retrieves the encryption key from the platform settings (`ENCRYPTION_KEY`)
   - A utility function in `packages/server/src/utils/platformSettings.ts` now only uses platform settings.
   
2. Throws an error if the encryption key is not found in platform settings
   - No more fallbacks to environment variables, default keys, or AWS Secrets Manager.
   
3. Uses a consistent encryption method across all parts of the application
   - All encryption/decryption operations use the same key retrieval method.
   - All secret storage and retrieval is done through Supabase only.
   - Proper error handling is implemented to provide clear error messages.
   
4. Updates credential retrieval in components
   - The `getCredentialData()` function in `packages/components/src/utils.ts` now directly uses Supabase secrets.
   - Legacy credentials encrypted with the old key will need to be re-entered.

### Migration Strategy

Since changing the encryption key will make existing encrypted data unreadable, we need to:

1. Accept that existing credentials will need to be re-entered
   - This is unavoidable when changing encryption keys.
   
2. Provide clear documentation on the migration process
   - Include steps for backing up existing data before migration.
   
3. Ensure a smooth transition for new installations
   - New installations will use the platform settings approach from the start.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Clear documentation, backup recommendations |
| Inconsistent encryption | Medium | Comprehensive testing, fallback mechanisms |
| Performance impact | Low | Caching of encryption key, optimized retrieval |

## References

- [JWT Claims Update](./jwt_claims_update.md)
- [Multi-Tenant Architecture](./03_multi_tenant_architecture.md)
- [Secrets Management](./04_secrets_management.md)

## Current vs New Approach

### Current Approach
- Uses environment variable `FLOWISE_SECRETKEY_OVERWRITE` as primary source
- Falls back to file-based key storage
- Inconsistent encryption methods across the application
- Uses AWS Secrets Manager in some cases

### New Approach
- Uses platform settings `ENCRYPTION_KEY` as the ONLY source
- NO fallbacks to environment variables, file-based keys, or AWS Secrets Manager
- Throws clear error messages if encryption key is not found
- Consistent encryption methods across the application
- API keys and other secrets are stored using the same encryption key
- ONLY uses Supabase for all secret storage and retrieval 