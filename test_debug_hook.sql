CREATE OR REPLACE FUNCTION public.test_debug_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
BEGIN
  -- Get the original claims
  claims := event->'claims';
  
  -- Add a very distinctive test claim
  claims := jsonb_set(claims, '{debug_test}', to_jsonb('THIS_IS_A_TEST_CLAIM_123'));
  
  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.test_debug_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.test_debug_hook FROM authenticated, anon, public; 