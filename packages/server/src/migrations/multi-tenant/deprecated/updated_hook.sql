-- Create the hook function in the public schema
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
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
        'resource_type', COALESCE(ucr.resource_type, ''),
        'resource_id', COALESCE(ucr.resource_id::text, '')
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
  claims := jsonb_set(claims, '{test_claim}', to_jsonb('v9_permissions_hook'));
  
  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE
  ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin;

REVOKE EXECUTE
  ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;

-- Grant access to necessary tables
GRANT ALL ON TABLE public.user_custom_roles TO supabase_auth_admin;
GRANT ALL ON TABLE public.custom_roles TO supabase_auth_admin;
GRANT ALL ON TABLE public.role_permissions TO supabase_auth_admin;
GRANT ALL ON TABLE public.permissions TO supabase_auth_admin;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_custom_roles' 
    AND policyname = 'Allow auth admin to read user custom roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow auth admin to read user custom roles" ON public.user_custom_roles
    AS PERMISSIVE FOR SELECT
    TO supabase_auth_admin
    USING (true)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'custom_roles' 
    AND policyname = 'Allow auth admin to read custom roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow auth admin to read custom roles" ON public.custom_roles
    AS PERMISSIVE FOR SELECT
    TO supabase_auth_admin
    USING (true)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'role_permissions' 
    AND policyname = 'Allow auth admin to read role permissions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow auth admin to read role permissions" ON public.role_permissions
    AS PERMISSIVE FOR SELECT
    TO supabase_auth_admin
    USING (true)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'permissions' 
    AND policyname = 'Allow auth admin to read permissions'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow auth admin to read permissions" ON public.permissions
    AS PERMISSIVE FOR SELECT
    TO supabase_auth_admin
    USING (true)';
  END IF;
END
$$;

-- Create the authorize function
CREATE OR REPLACE FUNCTION public.authorize(
  requested_permission text
)
RETURNS boolean AS $$
BEGIN
  -- Check if the user has the requested permission in their JWT claims
  RETURN requested_permission = ANY(
    (SELECT array_agg(jsonb_array_elements_text(auth.jwt()->'user_permissions')))
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''; 