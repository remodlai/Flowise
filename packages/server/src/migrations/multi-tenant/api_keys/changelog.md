# API Keys Migration Changelog

## Migration: Create Application Service Users and Update API Keys

**Date**: 2025-03-13

**Description**: This migration creates the application_service_users table and updates the application_api_keys table to support both personal and service API keys.

### Changes

1. Created a new table `application_service_users` to store service users associated with API keys
2. Added columns to `application_api_keys` table:
   - `service_user_id` - Reference to the service user
   - `is_personal_key` - Flag to distinguish between personal and service keys
3. Created functions:
   - `generate_api_key` - Generates API keys for both personal and service users
   - `verify_api_key` - Verifies API keys and retrieves associated permissions
   - `update_api_key_usage` - Updates the last_used_at timestamp for API keys

### Impact

- Existing API keys will be treated as personal keys (is_personal_key = false)
- New API keys can be created as either personal or service keys
- API key authentication will now support both personal and service keys
- Service keys can have specific permissions assigned to them

### Rollback Plan

If issues are encountered, the following rollback steps should be taken:

```sql
-- Drop functions
DROP FUNCTION IF EXISTS public.update_api_key_usage(TEXT);
DROP FUNCTION IF EXISTS public.verify_api_key(TEXT);
DROP FUNCTION IF EXISTS public.generate_api_key(UUID, TEXT, BOOLEAN, TEXT, TEXT[], TIMESTAMPTZ);

-- Remove columns from application_api_keys
ALTER TABLE public.application_api_keys DROP COLUMN IF EXISTS service_user_id;
ALTER TABLE public.application_api_keys DROP COLUMN IF EXISTS is_personal_key;

-- Drop application_service_users table
DROP TABLE IF EXISTS public.application_service_users;
``` 