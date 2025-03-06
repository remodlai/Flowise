-- Add platform_admin claim to JWT for platform admins
-- This ensures RLS policies can correctly identify platform admins

-- Create or replace the custom access token hook function
create or replace function auth.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  claims jsonb;
  user_metadata jsonb;
  app_metadata jsonb;
  is_platform_admin boolean;
begin
  -- Get the user metadata and app_metadata
  user_metadata := event->'claims'->'user_metadata';
  app_metadata := event->'claims'->'app_metadata';
  
  -- Extract the claims object
  claims := event->'claims';
  
  -- Check if user is a platform admin
  is_platform_admin := 
    (app_metadata->>'is_platform_admin')::boolean = true OR
    (user_metadata->>'role') = 'platform_admin' OR
    (user_metadata->>'role') = 'superadmin';
  
  -- Add platform_admin claim
  claims := jsonb_set(claims, '{platform_admin}', to_jsonb(is_platform_admin));
  
  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);
  
  -- Return the modified event
  return event;
end;
$$;

-- Update RLS policy for platform admins to use the new claim
CREATE OR REPLACE POLICY "Platform admins can manage all applications" 
ON public.applications
AS PERMISSIVE FOR ALL
TO public
USING (
  (auth.jwt() ->> 'platform_admin')::boolean = true
);

-- Log the change
INSERT INTO auth.hooks (hook_name, hook_function_name, enabled)
VALUES ('jwt_claim', 'auth.custom_access_token_hook', true)
ON CONFLICT (hook_name) DO UPDATE
SET hook_function_name = 'auth.custom_access_token_hook',
    enabled = true; 