-- Create the auth hook function for Remodl AI
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  claims jsonb;
  user_id uuid;
  user_roles jsonb;
  user_permissions jsonb;
  is_platform_admin boolean := false;
begin
  -- Extract the user_id and claims from the event
  user_id := (event->>'user_id')::uuid;
  claims := event->'claims';
  
  -- Check if user is a platform_admin by looking at the roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id
    AND r.name = 'platform_admin'
  ) INTO is_platform_admin;
  
  -- Get user roles with resource information
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'role', r.name,
        'resource_type', COALESCE(ur.resource_type, ''),
        'resource_id', COALESCE(ur.resource_id::text, '')
      )
    )
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id
  INTO user_roles;
  
  -- Get user permissions
  SELECT 
    jsonb_agg(p.name)
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = user_id
  INTO user_permissions;
  
  -- Add claims to the JWT
  IF is_platform_admin THEN
    claims := jsonb_set(claims, '{is_platform_admin}', 'true');
  ELSE
    claims := jsonb_set(claims, '{is_platform_admin}', 'false');
  END IF;
  
  IF user_roles IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_roles}', user_roles);
  ELSE
    claims := jsonb_set(claims, '{user_roles}', '[]'::jsonb);
  END IF;
  
  IF user_permissions IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_permissions}', user_permissions);
  ELSE
    claims := jsonb_set(claims, '{user_permissions}', '[]'::jsonb);
  END IF;
  
  -- Add a test claim to verify the hook is working
  claims := jsonb_set(claims, '{test_claim}', '"HOOK_WORKING"');
  
  -- Update the claims in the event
  event := jsonb_set(event, '{claims}', claims);
  
  return event;
end;
$$;

-- Grant necessary permissions
grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

-- Create policy for user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles'
    AND policyname = 'Allow auth admin to read user roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow auth admin to read user roles" ON public.user_roles
      AS permissive FOR SELECT
      TO supabase_auth_admin
      USING (true)';
  END IF;
END
$$;

-- Grant access to user_roles table
grant all
  on table public.user_roles
  to supabase_auth_admin;

-- Grant access to roles table
grant all
  on table public.roles
  to supabase_auth_admin;

-- Grant access to role_permissions table
grant all
  on table public.role_permissions
  to supabase_auth_admin;

-- Grant access to permissions table
grant all
  on table public.permissions
  to supabase_auth_admin; 