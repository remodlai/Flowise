-- Create the authorize function to check permissions based on JWT claims
CREATE OR REPLACE FUNCTION public.authorize(
  requested_permission text
)
RETURNS boolean AS $$
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
  JOIN jsonb_array_elements(user_roles) AS jr ON 
    (jr ->> 'role')::text = rp.role_name
  WHERE rp.permission_name = requested_permission;
  
  RETURN bind_permissions > 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.authorize TO authenticated;
GRANT EXECUTE ON FUNCTION public.authorize TO anon;
GRANT EXECUTE ON FUNCTION public.authorize TO service_role;

-- Grant access to the role_permissions table for the function
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO anon;
GRANT SELECT ON public.role_permissions TO service_role;

COMMENT ON FUNCTION public.authorize IS 'Checks if the current user has the requested permission based on their roles in the JWT claims'; 