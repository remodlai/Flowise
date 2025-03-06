-- v7 Reset Custom Access Token Hook
-- This script drops the existing hook and recreates it with a new name

-- First, check and drop the existing hook
DO $$
BEGIN
    -- Drop the hook from supabase_functions.hooks if it exists
    DELETE FROM supabase_functions.hooks 
    WHERE hook_table_id = 'auth.jwt'
    AND (hook_name = 'custom_access_token_hook' OR hook_name = 'jwt_claim');
    
    RAISE NOTICE 'Existing hooks removed';
    
    -- Drop the existing function if it exists
    DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);
    DROP FUNCTION IF EXISTS auth.custom_access_token_hook(jsonb);
    
    RAISE NOTICE 'Existing functions dropped';
END $$;

-- Create a new function with a different name
CREATE OR REPLACE FUNCTION public.flowise_jwt_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    original_claims jsonb;
    new_claims jsonb;
    user_metadata jsonb;
    app_metadata jsonb;
BEGIN
    -- Extract user_id from the event
    BEGIN
        user_id := (event->>'user_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error extracting user_id: %', SQLERRM;
        RETURN event;
    END;
    
    -- Get the original claims
    original_claims := event->'claims';
    
    -- Start with the original claims
    new_claims := original_claims;
    
    -- Get user metadata and app_metadata from the original claims
    user_metadata := original_claims->'user_metadata';
    app_metadata := original_claims->'app_metadata';
    
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
        RAISE NOTICE 'Error getting user profile: %', SQLERRM;
        -- If user_profiles table doesn't exist or other error, just continue
    END;
    
    -- Add a test claim to see if the hook is working
    new_claims := jsonb_set(new_claims, '{test_claim}', to_jsonb('hook_is_working'));
    
    -- Check if user is a platform admin
    DECLARE
        is_platform_admin boolean := false;
    BEGIN
        is_platform_admin := 
            (app_metadata->>'is_platform_admin')::boolean = true OR
            (user_metadata->>'role') = 'platform_admin' OR
            (user_metadata->>'role') = 'superadmin';
            
        -- Add platform_admin claim for RLS policies
        new_claims := jsonb_set(new_claims, '{platform_admin}', to_jsonb(is_platform_admin));
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error checking platform admin: %', SQLERRM;
    END;
    
    -- Update the event with the new claims
    event := jsonb_set(event, '{claims}', new_claims);
    
    -- Return the modified event
    RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.flowise_jwt_hook(jsonb) TO supabase_auth_admin;

-- Revoke permissions from other roles
REVOKE EXECUTE ON FUNCTION public.flowise_jwt_hook(jsonb) FROM authenticated, anon, public;

-- Register the new hook
DO $$
BEGIN
    -- Register the hook
    INSERT INTO supabase_functions.hooks (
        hook_table_id,
        hook_name,
        hook_function_name,
        hook_function_schema,
        hook_events,
        enabled
    )
    VALUES (
        'auth.jwt',
        'flowise_jwt_hook',
        'flowise_jwt_hook',
        'public',
        '{"event":"jwt","phase":"transform"}'::jsonb,
        true
    );
    
    RAISE NOTICE 'New hook registered successfully';
END $$;

-- Create a debug table to log hook execution
CREATE TABLE IF NOT EXISTS public.hook_debug_logs (
    id SERIAL PRIMARY KEY,
    hook_name TEXT NOT NULL,
    debug_info JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant access to the debug table
GRANT ALL ON public.hook_debug_logs TO supabase_auth_admin;
GRANT USAGE, SELECT ON SEQUENCE public.hook_debug_logs_id_seq TO supabase_auth_admin;

-- Force a refresh of all user tokens to apply the new hook
-- Uncomment this line to force refresh for all users (use with caution)
-- UPDATE auth.users SET updated_at = NOW(); 