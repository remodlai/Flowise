-- Create a comprehensive hook that adds profile info, roles, and permissions to claims
CREATE OR REPLACE FUNCTION public.comprehensive_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  claims jsonb;
  user_id uuid;
  is_platform_admin boolean;
  user_roles jsonb;
  user_permissions jsonb;
  profile_data record;
BEGIN
  -- Extract the user_id and claims from the event
  user_id := (event->>'user_id')::uuid;
  claims := event->'claims';
  
  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{test_claim}', '"COMPREHENSIVE_HOOK_WORKING"');

  -- Check if user is platform admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = user_id AND up.meta->>'role' = 'platform_admin'
  ) INTO is_platform_admin;

  -- Set platform admin status
  claims := jsonb_set(claims, '{is_platform_admin}', to_jsonb(is_platform_admin));

  -- Get user roles with resource information
  SELECT jsonb_agg(
    jsonb_build_object(
      'role', r.name,
      'resource_type', ur.resource_type,
      'resource_id', ur.resource_id
    )
  )
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id
  INTO user_roles;

  -- Set user roles
  IF user_roles IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_roles}', user_roles);
  ELSE
    claims := jsonb_set(claims, '{user_roles}', '[]');
  END IF;

  -- Get user permissions
  WITH user_role_permissions AS (
    SELECT DISTINCT p.name
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id
  )
  SELECT jsonb_agg(name)
  FROM user_role_permissions
  INTO user_permissions;

  -- Set user permissions
  IF user_permissions IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_permissions}', user_permissions);
  ELSE
    claims := jsonb_set(claims, '{user_permissions}', '[]');
  END IF;

  -- Get profile information from user_profiles table
  BEGIN
    SELECT 
      up.meta->'first_name' AS first_name,
      up.meta->'last_name' AS last_name,
      up.meta->'organization_name' AS organization_name,
      up.meta->'role' AS role
    INTO profile_data
    FROM public.user_profiles AS up
    WHERE up.user_id = user_id;

    -- Add profile information to claims if available
    IF profile_data IS NOT NULL THEN
      claims := jsonb_set(claims, '{first_name}', profile_data.first_name);
      claims := jsonb_set(claims, '{last_name}', profile_data.last_name);
      claims := jsonb_set(claims, '{organization_name}', profile_data.organization_name);
      claims := jsonb_set(claims, '{profile_role}', profile_data.role);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, add error message to claims and continue
    claims := jsonb_set(claims, '{profile_error}', to_jsonb(SQLERRM));
  END;

  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.comprehensive_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.comprehensive_hook(jsonb) FROM authenticated, anon, public;

-- Grant access to necessary tables
GRANT SELECT ON public.user_profiles TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.roles TO supabase_auth_admin;
GRANT SELECT ON public.role_permissions TO supabase_auth_admin;
GRANT SELECT ON public.permissions TO supabase_auth_admin; 