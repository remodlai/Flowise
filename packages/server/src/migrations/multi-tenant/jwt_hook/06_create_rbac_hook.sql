-- Create the authorize function for RLS policies
CREATE OR REPLACE FUNCTION public.authorize(
  requested_permission text,
  resource_type text DEFAULT NULL,
  resource_id text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  -- Check if user is platform admin first (they have all permissions)
  IF (auth.jwt() ->> 'is_platform_admin')::boolean = true THEN
    RETURN true;
  END IF;

  -- Check specific permissions from JWT
  IF auth.jwt() -> 'user_permissions' ? requested_permission THEN
    -- If resource_type and resource_id are provided, check if the user has permission for this specific resource
    IF resource_type IS NOT NULL AND resource_id IS NOT NULL THEN
      -- Check if user has role for this specific resource
      FOR i IN 0..jsonb_array_length(auth.jwt() -> 'user_roles') - 1 LOOP
        IF jsonb_extract_path_text(auth.jwt() -> 'user_roles' -> i, 'resource_type') = resource_type AND 
           jsonb_extract_path_text(auth.jwt() -> 'user_roles' -> i, 'resource_id') = resource_id THEN
          RETURN true;
        END IF;
      END LOOP;
      RETURN false;
    ELSE
      -- No resource specified, so general permission is sufficient
      RETURN true;
    END IF;
  END IF;

  -- If we get here, the user doesn't have the permission
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.authorize(text, text, text) TO authenticated, anon, public; 