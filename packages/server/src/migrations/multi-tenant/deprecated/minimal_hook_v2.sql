-- Create a minimal hook function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.minimal_hook_v2(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Add a test claim directly to the event
  RETURN jsonb_set(event, '{claims, minimal_test}', '"MINIMAL_HOOK_V2_WORKING"');
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.minimal_hook_v2 TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.minimal_hook_v2 FROM authenticated, anon, public; 