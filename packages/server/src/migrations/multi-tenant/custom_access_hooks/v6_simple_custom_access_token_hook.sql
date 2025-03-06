-- v6 simple version of custom_access_token_hook function
-- This version just adds first_name and last_name from user_profiles.meta as claims

-- Update the function in the public schema with a simple implementation
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    original_claims jsonb;
    new_claims jsonb;
    user_profile jsonb;
BEGIN
    -- Extract user_id from the event
    user_id := (event->>'user_id')::uuid;
    
    -- Get the original claims
    original_claims := event->'claims';
    
    -- Start with the original claims
    new_claims := original_claims;
    
    -- Get user profile metadata
    BEGIN
        SELECT meta INTO user_profile 
        FROM public.user_profiles 
        WHERE user_id = user_id;

        -- Add profile metadata if available
        IF user_profile IS NOT NULL THEN
            -- Add first_name
            IF user_profile->>'first_name' IS NOT NULL THEN
                new_claims := jsonb_set(new_claims, '{first_name}', to_jsonb(user_profile->>'first_name'));
            END IF;
            
            -- Add last_name
            IF user_profile->>'last_name' IS NOT NULL THEN
                new_claims := jsonb_set(new_claims, '{last_name}', to_jsonb(user_profile->>'last_name'));
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If user_profiles table doesn't exist, just continue
        NULL;
    END;
    
    -- Add a test claim to see if the hook is working
    new_claims := jsonb_set(new_claims, '{test_claim}', to_jsonb('test_value'));
    
    -- Update the event with the new claims
    event := jsonb_set(event, '{claims}', new_claims);
    
    -- Return the modified event
    RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Revoke permissions from other roles
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public; 