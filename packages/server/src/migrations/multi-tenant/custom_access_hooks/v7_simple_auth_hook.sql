-- v7 Simple Auth Hook
-- This creates a simple hook in the auth schema

-- Create the function in the auth schema
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    original_claims jsonb;
    new_claims jsonb;
    user_metadata jsonb;
BEGIN
    -- Extract user_id from the event
    user_id := (event->>'user_id')::uuid;
    
    -- Get the original claims
    original_claims := event->'claims';
    
    -- Start with the original claims
    new_claims := original_claims;
    
    -- Get user profile data
    BEGIN
        SELECT meta INTO user_metadata 
        FROM public.user_profiles 
        WHERE user_id = user_id;

        -- Add profile metadata if available
        IF user_metadata IS NOT NULL THEN
            -- Add first_name
            IF user_metadata->>'first_name' IS NOT NULL THEN
                new_claims := jsonb_set(new_claims, '{first_name}', to_jsonb(user_metadata->>'first_name'));
            END IF;
            
            -- Add last_name
            IF user_metadata->>'last_name' IS NOT NULL THEN
                new_claims := jsonb_set(new_claims, '{last_name}', to_jsonb(user_metadata->>'last_name'));
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

-- Register the hook in auth.hooks
INSERT INTO auth.hooks (hook_name, hook_function_name, enabled)
VALUES ('jwt_claim', 'auth.custom_access_token_hook', true)
ON CONFLICT (hook_name) DO UPDATE
SET hook_function_name = 'auth.custom_access_token_hook',
    enabled = true; 