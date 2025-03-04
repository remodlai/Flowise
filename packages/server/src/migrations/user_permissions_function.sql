-- Function to get all permissions for the current user
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS TABLE (permission TEXT)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT rp.permission
  FROM public.role_permissions rp
  JOIN public.custom_roles cr ON rp.role_id = cr.id
  JOIN public.user_roles ur ON ur.role_id = cr.id
  WHERE ur.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.get_user_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions() TO anon; 