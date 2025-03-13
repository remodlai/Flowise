# Database Migration Plan for Service Users and API Keys

## Overview

This document outlines the database migration steps required to implement the application service users and API keys feature. The migration will create new tables, modify existing ones, and add necessary functions and policies.

## Migration Steps

### 1. Create Application Service Users Table

```sql
-- Create the application_service_users table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_service_users_application_id ON public.application_service_users(application_id);
CREATE INDEX IF NOT EXISTS idx_application_service_users_created_by ON public.application_service_users(created_by);

-- Add updated_at trigger
CREATE TRIGGER update_application_service_users_updated_at
BEFORE UPDATE ON public.application_service_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.application_service_users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Platform admins can manage all service users"
  ON public.application_service_users
  USING (is_platform_admin());

CREATE POLICY "Application admins can manage service users for their applications"
  ON public.application_service_users
  USING (user_has_application_access(application_id));
```

### 2. Modify Application API Keys Table

```sql
-- Add service_user_id column to application_api_keys
ALTER TABLE public.application_api_keys 
ADD COLUMN service_user_id UUID REFERENCES application_service_users(id) ON DELETE CASCADE;

-- Add is_personal_key flag
ALTER TABLE public.application_api_keys
ADD COLUMN is_personal_key BOOLEAN NOT NULL DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_application_api_keys_service_user_id ON public.application_api_keys(service_user_id);
CREATE INDEX IF NOT EXISTS idx_application_api_keys_is_personal_key ON public.application_api_keys(is_personal_key);
```

### 3. Create API Key Generation Function

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
SET search_path = ''
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
        -- Insert into user_roles table
        INSERT INTO public.user_roles (
          user_id,
          role_id,
          resource_type,
          resource_id,
          created_by
        )
        SELECT 
          v_service_user_id,
          r.id,
          'application',
          p_application_id,
          auth.uid()
        FROM public.roles r
        JOIN public.role_permissions rp ON r.id = rp.role_id
        WHERE rp.permission = v_permission
        LIMIT 1;
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

### 4. Create API Key Verification Function

```sql
CREATE OR REPLACE FUNCTION public.verify_api_key(
  p_api_key TEXT
)
RETURNS TABLE (
  user_id UUID,
  is_personal_key BOOLEAN,
  application_id UUID,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH api_key_info AS (
    SELECT
      ak.created_by,
      ak.service_user_id,
      ak.is_personal_key,
      ak.application_id
    FROM public.application_api_keys ak
    WHERE ak.api_key = p_api_key
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now())
  )
  SELECT
    CASE
      WHEN aki.is_personal_key THEN aki.created_by
      ELSE aki.service_user_id
    END AS user_id,
    aki.is_personal_key,
    aki.application_id,
    CASE
      WHEN aki.is_personal_key THEN
        (SELECT jsonb_agg(jsonb_build_object(
          'permission', rp.permission,
          'resource_type', ur.resource_type,
          'resource_id', ur.resource_id
        ))
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        JOIN public.role_permissions rp ON r.id = rp.role_id
        WHERE ur.user_id = aki.created_by)
      ELSE
        (SELECT jsonb_agg(jsonb_build_object(
          'permission', rp.permission,
          'resource_type', ur.resource_type,
          'resource_id', ur.resource_id
        ))
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        JOIN public.role_permissions rp ON r.id = rp.role_id
        WHERE ur.user_id = aki.service_user_id)
    END AS permissions
  FROM api_key_info aki;
END;
$$;
```

### 5. Update API Key Usage Tracking

```sql
-- Create function to update last_used_at timestamp
CREATE OR REPLACE FUNCTION public.update_api_key_usage(
  p_api_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.application_api_keys
  SET last_used_at = now()
  WHERE api_key = p_api_key;
END;
$$;
```

## Rollback Plan

In case the migration needs to be rolled back, the following steps should be taken:

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

## Testing

After applying the migration, the following tests should be performed:

1. Create a personal API key and verify it works
2. Create a service API key with specific permissions and verify it works
3. Verify that expired API keys are rejected
4. Verify that revoked API keys are rejected
5. Verify that the last_used_at timestamp is updated when an API key is used

## Notes

- The migration should be applied during a maintenance window to minimize disruption
- Existing API keys will be treated as personal keys (is_personal_key = true)
- The migration does not affect existing API key functionality 