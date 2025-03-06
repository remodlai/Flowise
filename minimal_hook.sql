-- Create a minimal JWT hook function that just adds a test claim
CREATE OR REPLACE FUNCTION public.minimal_jwt_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
BEGIN
  -- Get the original claims
  claims := event->'claims';

  -- Add a test claim to see if the hook is working
  claims := jsonb_set(claims, '{test_claim}', to_jsonb('minimal_hook_working'));

  -- Update the event with the new claims
  event := jsonb_set(event, '{claims}', claims);

  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.minimal_jwt_hook(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.minimal_jwt_hook(JSONB) TO supabase_auth_admin;

-- Revoke permissions from public roles
REVOKE EXECUTE ON FUNCTION public.minimal_jwt_hook(JSONB) FROM anon, authenticated, public; 