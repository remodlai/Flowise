-- Create a function that adds profile information to claims
CREATE OR REPLACE FUNCTION public.name_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  claims jsonb;
  remodl_user_id uuid;
  profile_data record;
BEGIN
  -- Extract the user_id and claims from the event
  remodl_user_id := (event->>'user_id')::uuid;
  claims := event->'claims';
  
  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{test_claim}', '"NAME_HOOK_WORKING"');

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

  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.name_hook(jsonb) TO supabase_auth_admin;

-- Revoke execute from other roles
REVOKE EXECUTE ON FUNCTION public.name_hook(jsonb) FROM authenticated, anon, public;

-- Grant access to user_profiles table
GRANT SELECT ON public.user_profiles TO supabase_auth_admin; 