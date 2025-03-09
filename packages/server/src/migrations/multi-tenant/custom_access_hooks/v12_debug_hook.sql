-- Debug version of the custom access token hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  claims jsonb;
  remodl_user_id uuid;
  profile_data record;
  user_roles jsonb;
  org_id uuid;
  debug_info jsonb := '{}'::jsonb;
BEGIN
  -- Extract the user_id and claims from the event
  remodl_user_id := (event->>'user_id')::uuid;
  claims := event->'claims';
  
  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{test_claim}', '"CUSTOM_ACCESS_TOKEN_HOOK_WORKING"');

  -- Add userId directly to claims (copy of sub)
  claims := jsonb_set(claims, '{userId}', to_jsonb(remodl_user_id::text));

  -- Check if user is platform admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.user_id = remodl_user_id AND up.meta->>'role' = 'platform_admin'
  ) INTO profile_data;

  -- Set platform admin status if found
  IF profile_data IS NOT NULL THEN
    claims := jsonb_set(claims, '{is_platform_admin}', 'true');
  ELSE
    claims := jsonb_set(claims, '{is_platform_admin}', 'false');
  END IF;

  -- Get profile information from user_profiles table
  BEGIN
    -- Use a more explicit query to avoid ambiguous column references
    SELECT 
      up.meta->'first_name' AS first_name,
      up.meta->'last_name' AS last_name,
      up.meta->'organization_name' AS organization_name,
      up.meta->'role' AS role
    INTO profile_data
    FROM public.user_profiles AS up
    WHERE up.user_id = remodl_user_id;

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

  -- Get user's primary organization ID with detailed debugging
  BEGIN
    debug_info := jsonb_set(debug_info, '{org_lookup_started}', 'true');
    
    -- Try to get the organization ID from user_profiles.meta
    SELECT (up.meta->>'organization_id')::uuid
    INTO org_id
    FROM public.user_profiles AS up
    WHERE up.user_id = remodl_user_id;
    
    debug_info := jsonb_set(debug_info, '{org_id_from_profile}', COALESCE(to_jsonb(org_id::text), 'null'));
    
    -- If not found in meta, try to get from organization_users table
    IF org_id IS NULL THEN
      debug_info := jsonb_set(debug_info, '{checking_org_users}', 'true');
      
      -- Get the count of organization_users entries for this user
      DECLARE
        org_count integer;
      BEGIN
        SELECT COUNT(*)
        INTO org_count
        FROM public.organization_users ou
        WHERE ou.user_id = remodl_user_id;
        
        debug_info := jsonb_set(debug_info, '{org_users_count}', to_jsonb(org_count));
      END;
      
      -- Now try to get the first organization
      SELECT ou.organization_id
      INTO org_id
      FROM public.organization_users ou
      WHERE ou.user_id = remodl_user_id
      ORDER BY ou.created_at ASC
      LIMIT 1;
      
      debug_info := jsonb_set(debug_info, '{org_id_from_org_users}', COALESCE(to_jsonb(org_id::text), 'null'));
    END IF;
    
    -- Add organizationId to claims if found
    IF org_id IS NOT NULL THEN
      claims := jsonb_set(claims, '{organizationId}', to_jsonb(org_id::text));
      debug_info := jsonb_set(debug_info, '{org_id_found}', 'true');
    ELSE
      debug_info := jsonb_set(debug_info, '{org_id_found}', 'false');
    END IF;
    
    -- Add the debug info to claims
    claims := jsonb_set(claims, '{org_debug_info}', debug_info);
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, add error message to claims and continue
    claims := jsonb_set(claims, '{organization_error}', to_jsonb(SQLERRM));
    claims := jsonb_set(claims, '{org_debug_info}', debug_info);
  END;

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
  WHERE ur.user_id = remodl_user_id
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
$function$;

-- Grant necessary permissions
GRANT EXECUTE
  ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin; 