-- v8 Resource Auth Hook
-- This creates a hook that includes resource information from user_custom_roles

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
    user_roles jsonb;
    is_platform_admin BOOLEAN := false;
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
    
    -- Check if user is a platform admin
    BEGIN
        SELECT EXISTS (
            SELECT 1 
            FROM public.user_custom_roles ucr
            JOIN public.custom_roles cr ON ucr.role_id = cr.id
            WHERE ucr.user_id = user_id
            AND cr.name = 'platform_admin'
        ) INTO is_platform_admin;
        
        -- Add platform_admin claim
        new_claims := jsonb_set(new_claims, '{is_platform_admin}', to_jsonb(is_platform_admin));
    EXCEPTION WHEN OTHERS THEN
        -- If tables don't exist, just continue
        NULL;
    END;
    
    -- Get user roles with resource information
    BEGIN
        SELECT jsonb_agg(
            jsonb_build_object(
                'role', cr.name,
                'resource_type', COALESCE(ucr.resource_type, ''),
                'resource_id', COALESCE(ucr.resource_id::text, '')
            )
        )
        FROM public.user_custom_roles ucr
        JOIN public.custom_roles cr ON ucr.role_id = cr.id
        WHERE ucr.user_id = user_id
        INTO user_roles;
        
        -- Add roles with resource information to claims
        IF user_roles IS NOT NULL THEN
            new_claims := jsonb_set(new_claims, '{user_roles}', user_roles);
        ELSE
            new_claims := jsonb_set(new_claims, '{user_roles}', '[]'::jsonb);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If tables don't exist, just continue
        NULL;
    END;
    
    -- Add a test claim to see if the hook is working
    new_claims := jsonb_set(new_claims, '{test_claim}', to_jsonb('v8_resource_hook'));
    
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