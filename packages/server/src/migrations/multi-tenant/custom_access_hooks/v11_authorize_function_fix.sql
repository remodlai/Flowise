-- v11_authorize_function_fix.sql
-- Date: 2024-07-XX

-- Fix the authorize function to use the correct column names
CREATE OR REPLACE FUNCTION public.authorize(requested_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  bind_permissions int;
  user_roles jsonb;
BEGIN
  -- Get user_roles from JWT claims
  user_roles := auth.jwt() -> 'user_roles';
  
  -- If user is a platform admin, they have all permissions
  IF (auth.jwt() ->> 'is_platform_admin')::boolean = true THEN
    RETURN true;
  END IF;
  
  -- Check if any of the user's roles has the requested permission
  SELECT COUNT(*)
  INTO bind_permissions
  FROM public.role_permissions rp
  JOIN public.roles r ON r.id = rp.role_id
  JOIN jsonb_array_elements(user_roles) AS jr ON
    (jr ->> 'role')::text = r.name
  WHERE rp.permission = requested_permission;
  
  RETURN bind_permissions > 0;
END;
$function$;

-- Create the platform.global permission if it doesn't exist
DO $$
DECLARE
  platform_category_id uuid;
  platform_admin_role_id uuid;
BEGIN
  -- Get the Platform category ID
  SELECT id INTO platform_category_id FROM permission_categories WHERE name = 'Platform';
  
  -- Create the platform.global permission if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM permissions WHERE name = 'platform.global') THEN
    INSERT INTO permissions (name, description, category_id, context_types)
    VALUES ('platform.global', 'Global access to all platform resources', platform_category_id, ARRAY['platform']);
  END IF;
  
  -- Get the platform_admin role ID
  SELECT id INTO platform_admin_role_id FROM roles WHERE name = 'platform_admin';
  
  -- Assign the platform.global permission to the platform_admin role if not already assigned
  IF NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = platform_admin_role_id AND permission = 'platform.global') THEN
    INSERT INTO role_permissions (role_id, permission)
    VALUES (platform_admin_role_id, 'platform.global');
  END IF;
  
  -- Create the RLS policy for global platform access if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Global platform access') THEN
    EXECUTE 'CREATE POLICY "Global platform access" ON applications FOR SELECT USING (authorize(''platform.global''))';
  END IF;
  
  -- Create the get_all_applications_direct function if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_applications_direct') THEN
    CREATE OR REPLACE FUNCTION public.get_all_applications_direct()
    RETURNS SETOF applications
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    BEGIN
      RETURN QUERY SELECT * FROM public.applications ORDER BY name;
    END;
    $func$;
  END IF;
END $$; 