-- Create a simple JWT hook function
CREATE OR REPLACE FUNCTION public.simple_jwt_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add a test claim directly to the event
  RETURN jsonb_set(event, '{claims, test_claim}', '"simple_hook_working"');
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.simple_jwt_hook(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.simple_jwt_hook(JSONB) FROM anon, authenticated, public; 