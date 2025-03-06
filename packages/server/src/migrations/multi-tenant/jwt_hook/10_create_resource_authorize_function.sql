-- Create the resource-based authorize function
CREATE OR REPLACE FUNCTION public.authorize_resource(
  requested_permission text,
  resource_type text,
  resource_id uuid
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
  
  -- Check if any of the user's roles has the requested permission for the specific resource
  SELECT COUNT(*)
  INTO bind_permissions
  FROM public.role_permissions rp
  JOIN jsonb_array_elements(user_roles) AS jr ON 
    (jr ->> 'role')::text = rp.role_name
  WHERE 
    rp.permission_name = requested_permission
    AND (
      -- Match if the role is for this specific resource
      ((jr ->> 'resource_type')::text = resource_type AND (jr ->> 'resource_id')::uuid = resource_id)
      -- Or if the role is global (null resource_type and resource_id)
      OR ((jr ->> 'resource_type') IS NULL AND (jr ->> 'resource_id') IS NULL)
    );
  
  RETURN bind_permissions > 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.authorize_resource TO authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_resource TO anon;
GRANT EXECUTE ON FUNCTION public.authorize_resource TO service_role;

COMMENT ON FUNCTION public.authorize_resource IS 'Checks if the current user has the requested permission for a specific resource based on their roles in the JWT claims'; 