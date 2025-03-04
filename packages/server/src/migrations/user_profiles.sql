-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow platform admins to read all profiles
CREATE POLICY "Platform admins can read all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Allow platform admins to update all profiles
CREATE POLICY "Platform admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create the auth hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_metadata jsonb;
BEGIN
  -- Get the user metadata from the users table or any other source
  SELECT meta INTO user_metadata 
  FROM public.user_profiles 
  WHERE user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_metadata IS NOT NULL THEN
    -- Add first_name
    IF user_metadata->>'first_name' IS NOT NULL THEN
      claims := jsonb_set(claims, '{first_name}', to_jsonb(user_metadata->>'first_name'));
    END IF;
    
    -- Add last_name
    IF user_metadata->>'last_name' IS NOT NULL THEN
      claims := jsonb_set(claims, '{last_name}', to_jsonb(user_metadata->>'last_name'));
    END IF;
    
    -- Add organization
    IF user_metadata->>'organization' IS NOT NULL THEN
      claims := jsonb_set(claims, '{organization}', to_jsonb(user_metadata->>'organization'));
    END IF;
    
    -- Add role
    IF user_metadata->>'role' IS NOT NULL THEN
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_metadata->>'role'));
    END IF;
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  -- Return the modified event
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE
  ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin;

REVOKE EXECUTE
  ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;

-- Register the hook
SELECT
  supabase_functions.create_hook(
    'CUSTOM_ACCESS_TOKEN',
    'public.custom_access_token_hook'
  );

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); 