-- Create a function that adds assigned roles to claims
CREATE OR REPLACE FUNCTION public.roles_hook(event jsonb)
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
BEGIN
  -- Extract the user_id and claims from the event
  user_id := (event->>'user_id')::uuid;
  claims := event->'claims';
  
  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{test_claim}', '"ROLES_HOOK_WORKING"');

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

  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.roles_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.roles_hook(jsonb) FROM authenticated, anon, public;

-- Grant access to necessary tables
GRANT SELECT ON public.user_profiles TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.roles TO supabase_auth_admin; 