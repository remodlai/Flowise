# Application Service Users and API Keys Implementation

## Overview

This document outlines the implementation plan for creating application-specific service users and associated API keys. This approach replaces the current implementation where API keys are associated with a global platform admin user.

## Current Implementation

Currently, API keys are associated with a single platform admin user with an ID of all zeros. This approach lacks granularity and doesn't follow the principle of least privilege.

## Proposed Implementation

### Conceptual Flow

1. When a user clicks "Create API Key" (either during application creation or separately):
   - A modal appears with two options: "Create Personal Key" or "Create Service Key"
   
2. If "Create Personal Key" is selected:
   - The API key will be directly tied to the user's ID
   - The permissions will be based on the user's existing permissions
   - The modal will show options for key name and expiry date

3. If "Create Service Key" is selected:
   - The modal will show available permissions
   - Default permission level is view-only (lowest access)
   - User can select additional permissions or choose "global" which grants all permissions
   - User can set key name and expiry date

4. On the backend for Personal Keys:
   - Generate an API key with the specified expiry (default: 1 year)
   - Associate this API key directly with the user's ID
   - Return the API key to the UI for the user to save

5. On the backend for Service Keys:
   - Create a new service user with a name format like `{application_id}_{api_key_name}_service_user`
   - Grant the selected permissions to this service user
   - Generate an API key with the specified expiry
   - Associate this API key with the newly created service user
   - Return the API key to the UI for the user to save

### Database Changes

1. Create a new table for application service users:
   ```sql
   CREATE TABLE IF NOT EXISTS public.application_service_users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     created_by UUID NOT NULL REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE(application_id, name)
   );

   -- Add RLS policies
   ALTER TABLE public.application_service_users ENABLE ROW LEVEL SECURITY;

   -- Platform admins can manage all service users
   CREATE POLICY "Platform admins can manage all service users"
     ON public.application_service_users
     USING (is_platform_admin());

   -- Application admins can manage service users for their applications
   CREATE POLICY "Application admins can manage service users for their applications"
     ON public.application_service_users
     USING (user_has_application_access(application_id));
   ```

2. Modify the application_api_keys table to associate with either regular users or service users:
   ```sql
   -- Add service_user_id column to application_api_keys
   ALTER TABLE public.application_api_keys 
   ADD COLUMN service_user_id UUID REFERENCES application_service_users(id) ON DELETE CASCADE;
   
   -- Add is_personal_key flag to distinguish between personal and service keys
   ALTER TABLE public.application_api_keys
   ADD COLUMN is_personal_key BOOLEAN NOT NULL DEFAULT false;
   ```

3. Create a function to generate API keys:
   ```sql
   CREATE OR REPLACE FUNCTION public.generate_api_key(
     p_application_id UUID,
     p_key_name TEXT,
     p_is_personal_key BOOLEAN,
     p_service_user_name TEXT DEFAULT NULL,
     p_permissions TEXT[] DEFAULT NULL,
     p_expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 year')
   )
   RETURNS TEXT
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_service_user_id UUID;
     v_api_key TEXT;
     v_hashed_key TEXT;
     v_permission TEXT;
   BEGIN
     -- Generate API key
     v_api_key := encode(gen_random_bytes(32), 'base64');
     v_hashed_key := crypt(v_api_key, gen_salt('bf'));
     
     -- Handle personal key
     IF p_is_personal_key THEN
       -- Store API key as personal key
       INSERT INTO public.application_api_keys (
         application_id,
         key_name,
         api_key,
         hashed_key,
         expires_at,
         created_by,
         is_personal_key
       ) VALUES (
         p_application_id,
         p_key_name,
         v_api_key,
         v_hashed_key,
         p_expires_at,
         auth.uid(),
         true
       );
     ELSE
       -- Create service user
       INSERT INTO public.application_service_users (
         application_id,
         name,
         description,
         created_by
       ) VALUES (
         p_application_id,
         p_service_user_name,
         'Service user for API key: ' || p_key_name,
         auth.uid()
       )
       RETURNING id INTO v_service_user_id;
       
       -- Grant permissions to service user
       IF p_permissions IS NOT NULL THEN
         FOREACH v_permission IN ARRAY p_permissions
         LOOP
           -- Grant permission logic here
           -- This will depend on how permissions are stored and managed
         END LOOP;
       END IF;
       
       -- Store API key
       INSERT INTO public.application_api_keys (
         application_id,
         key_name,
         api_key,
         hashed_key,
         expires_at,
         created_by,
         service_user_id,
         is_personal_key
       ) VALUES (
         p_application_id,
         p_key_name,
         v_api_key,
         v_hashed_key,
         p_expires_at,
         auth.uid(),
         v_service_user_id,
         false
       );
     END IF;
     
     RETURN v_api_key;
   END;
   $$;
   ```

### Backend Implementation

1. Create a new controller for managing service users and API keys:
   - `ServiceUserController.ts` - Handles CRUD operations for service users
   - `ApiKeyController.ts` - Handles CRUD operations for API keys

2. Update the authentication middleware to handle API key authentication:
   - Verify API key against the database
   - Determine if it's a personal key or service key
   - For personal keys, use the associated user's ID and permissions
   - For service keys, retrieve associated service user and its permissions
   - Set up user context with appropriate permissions

3. Create services for managing service users and permissions:
   - `ServiceUserService.ts` - Business logic for service users
   - `ApiKeyService.ts` - Business logic for API keys

4. Review existing authentication code:
   - Ensure the auth code can handle both regular users and service users
   - Verify that permission checks work correctly with service users
   - Confirm that JWT claims processing works with service users
   - No major changes should be needed as we're working with the user claims

### Frontend Implementation

1. Create a modal component for API key creation:
   - Initial option to choose between Personal Key and Service Key
   - For Personal Keys:
     - Key name input
     - Expiry date selection (default: 1 year)
   - For Service Keys:
     - Permission selection UI
     - Key name input
     - Expiry date selection (default: 1 year)

2. Update the application settings page to include API key management:
   - List existing API keys (both personal and service)
   - Create new API keys
   - Revoke existing API keys

3. Add API key creation option during application creation flow

## Implementation Checklist

- [ ] Database schema changes
  - [ ] Create application_service_users table
  - [ ] Update application_api_keys table
  - [ ] Create necessary functions and triggers

- [ ] Backend implementation
  - [ ] Create ServiceUserController
  - [ ] Create ApiKeyController
  - [ ] Update authentication middleware
  - [ ] Create service user and API key services
  - [ ] Review existing auth code for compatibility

- [ ] Frontend implementation
  - [ ] Create API key creation modal with Personal/Service options
  - [ ] Update application settings page
  - [ ] Add API key creation to application creation flow

- [ ] Testing
  - [ ] Unit tests for new controllers and services
  - [ ] Integration tests for API key creation and authentication
  - [ ] UI tests for API key management
  - [ ] Test both personal and service keys

- [ ] Documentation
  - [ ] Update API documentation
  - [ ] Create user guide for API key management
  - [ ] Update developer documentation

## Security Considerations

- API keys should be securely stored (hashed in the database)
- API keys should have an expiration date
- API keys should be revocable
- Service users should follow the principle of least privilege
- All API key operations should be logged for audit purposes
- Personal keys inherit the user's permissions and are tied to the user's account

## Future Enhancements

- Support for API key rotation
- Support for API key usage tracking
- Support for API key rate limiting
- Support for API key scopes (limiting access to specific endpoints) 