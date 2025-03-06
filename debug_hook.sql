-- Create a debug table to log hook execution
CREATE TABLE IF NOT EXISTS public.hook_debug_logs (
  id SERIAL PRIMARY KEY,
  hook_name TEXT,
  event_id TEXT,
  user_id UUID,
  error TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a debug JWT hook function with extensive error handling
CREATE OR REPLACE FUNCTION public.debug_jwt_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_id uuid;
  error_message text;
  debug_details jsonb := '{}'::jsonb;
BEGIN
  -- Log the start of hook execution
  BEGIN
    user_id := (event->>'user_id')::uuid;
    INSERT INTO public.hook_debug_logs (hook_name, event_id, user_id, details)
    VALUES ('debug_jwt_hook', event->>'session_id', user_id, jsonb_build_object('event', event));
  EXCEPTION WHEN OTHERS THEN
    -- Ignore logging errors
    NULL;
  END;

  -- Get the original claims
  BEGIN
    claims := event->'claims';
    debug_details := jsonb_set(debug_details, '{original_claims}', claims);
  EXCEPTION WHEN OTHERS THEN
    error_message := 'Error getting original claims: ' || SQLERRM;
    INSERT INTO public.hook_debug_logs (hook_name, event_id, user_id, error, details)
    VALUES ('debug_jwt_hook', event->>'session_id', user_id, error_message, debug_details);
    RETURN event;
  END;

  -- Add a test claim
  BEGIN
    claims := jsonb_set(claims, '{test_claim}', to_jsonb('debug_hook_working'));
    debug_details := jsonb_set(debug_details, '{updated_claims}', claims);
  EXCEPTION WHEN OTHERS THEN
    error_message := 'Error adding test claim: ' || SQLERRM;
    INSERT INTO public.hook_debug_logs (hook_name, event_id, user_id, error, details)
    VALUES ('debug_jwt_hook', event->>'session_id', user_id, error_message, debug_details);
    RETURN event;
  END;

  -- Update the event with the new claims
  BEGIN
    event := jsonb_set(event, '{claims}', claims);
    debug_details := jsonb_set(debug_details, '{final_event}', event);
  EXCEPTION WHEN OTHERS THEN
    error_message := 'Error updating event: ' || SQLERRM;
    INSERT INTO public.hook_debug_logs (hook_name, event_id, user_id, error, details)
    VALUES ('debug_jwt_hook', event->>'session_id', user_id, error_message, debug_details);
    RETURN event;
  END;

  -- Log successful execution
  BEGIN
    INSERT INTO public.hook_debug_logs (hook_name, event_id, user_id, details)
    VALUES ('debug_jwt_hook', event->>'session_id', user_id, jsonb_build_object('success', true, 'final_event', event));
  EXCEPTION WHEN OTHERS THEN
    -- Ignore logging errors
    NULL;
  END;

  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.debug_jwt_hook(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.debug_jwt_hook(JSONB) TO supabase_auth_admin;

-- Revoke permissions from public roles
REVOKE EXECUTE ON FUNCTION public.debug_jwt_hook(JSONB) FROM anon, authenticated, public;

-- Grant permissions on the debug table
GRANT SELECT, INSERT ON public.hook_debug_logs TO service_role;
GRANT SELECT, INSERT ON public.hook_debug_logs TO supabase_auth_admin;
GRANT USAGE ON SEQUENCE public.hook_debug_logs_id_seq TO service_role;
GRANT USAGE ON SEQUENCE public.hook_debug_logs_id_seq TO supabase_auth_admin; 