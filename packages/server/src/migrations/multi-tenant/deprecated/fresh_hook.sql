-- Create a custom JWT hook function
CREATE OR REPLACE FUNCTION public.custom_jwt_claim_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_roles jsonb;
  user_permissions jsonb;
  is_platform_admin boolean := false;
BEGIN
  -- Get the original claims
  claims := event->'claims';

  -- Check if user is a platform admin
  BEGIN
    SELECT EXISTS (
      SELECT 1
      FROM public.user_custom_roles ucr
      JOIN public.custom_roles cr ON ucr.role_id = cr.id
      WHERE ucr.user_id = (event->>'user_id')::uuid
      AND cr.name = 'platform_admin'
    ) INTO is_platform_admin;

    -- Add platform_admin claim
    claims := jsonb_set(claims, '{is_platform_admin}', to_jsonb(is_platform_admin));
  EXCEPTION WHEN OTHERS THEN
    -- If tables don't exist, just continue
    NULL;
  END;

  -- Get user roles with resource information
  BEGIN
    SELECT jsonb_agg(
      jsonb_build_object(
        'role', cr.name,
        'resource_type', COALESCE(ucr.resource_type, cr.context_type),
        'resource_id', COALESCE(ucr.resource_id, cr.context_id)
      )
    )
    FROM public.user_custom_roles ucr
    JOIN public.custom_roles cr ON ucr.role_id = cr.id
    WHERE ucr.user_id = (event->>'user_id')::uuid
    INTO user_roles;

    -- Add roles with resource information to claims
    IF user_roles IS NOT NULL THEN
      claims := jsonb_set(claims, '{user_roles}', user_roles);
    ELSE
      claims := jsonb_set(claims, '{user_roles}', '[]'::jsonb);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If tables don't exist, just continue
    NULL;
  END;

  -- Get user permissions
  BEGIN
    SELECT jsonb_agg(DISTINCT p.name)
    FROM public.user_custom_roles ucr
    JOIN public.role_permissions rp ON ucr.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission = p.name
    WHERE ucr.user_id = (event->>'user_id')::uuid
    INTO user_permissions;

    -- Add permissions to claims
    IF user_permissions IS NOT NULL THEN
      claims := jsonb_set(claims, '{user_permissions}', user_permissions);
    ELSE
      claims := jsonb_set(claims, '{user_permissions}', '[]'::jsonb);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If tables don't exist, just continue
    NULL;
  END;

  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{test_claim}', to_jsonb('jwt_hook_working'));

  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);

  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.custom_jwt_claim_hook(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.custom_jwt_claim_hook(JSONB) TO supabase_auth_admin;

-- Revoke permissions from public roles
REVOKE EXECUTE ON FUNCTION public.custom_jwt_claim_hook(JSONB) FROM anon, authenticated, public;

-- Create policies to allow supabase_auth_admin to read from the necessary tables
DO $$
BEGIN
  -- Create policy for user_custom_roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_custom_roles' 
    AND policyname = 'auth_admin_select_policy'
  ) THEN
    CREATE POLICY auth_admin_select_policy ON public.user_custom_roles
    FOR SELECT TO supabase_auth_admin USING (true);
  END IF;

  -- Create policy for custom_roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'custom_roles' 
    AND policyname = 'auth_admin_select_policy'
  ) THEN
    CREATE POLICY auth_admin_select_policy ON public.custom_roles
    FOR SELECT TO supabase_auth_admin USING (true);
  END IF;

  -- Create policy for role_permissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_permissions' 
    AND policyname = 'auth_admin_select_policy'
  ) THEN
    CREATE POLICY auth_admin_select_policy ON public.role_permissions
    FOR SELECT TO supabase_auth_admin USING (true);
  END IF;

  -- Create policy for permissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'auth_admin_select_policy'
  ) THEN
    CREATE POLICY auth_admin_select_policy ON public.permissions
    FOR SELECT TO supabase_auth_admin USING (true);
  END IF;
END
$$; 