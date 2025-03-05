-- v2 of custom_access_token_hook function
-- This version uses the get_user_roles_direct function to get the user's roles

-- Update the function in the public schema with the correct implementation
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    original_claims jsonb;
    new_claims jsonb;
    user_metadata jsonb;
    user_roles jsonb[];
    is_admin boolean = false;
BEGIN
    -- Extract user_id from the event
    user_id := (event->>'user_id')::uuid;
    
    -- Get the original claims
    original_claims := event->'claims';
    
    -- Start with the original claims
    new_claims := original_claims;
    
    -- Get user metadata from profiles
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
            
            -- Add organization
            IF user_metadata->>'organization' IS NOT NULL THEN
                new_claims := jsonb_set(new_claims, '{organization}', to_jsonb(user_metadata->>'organization'));
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If user_profiles table doesn't exist, just continue
        NULL;
    END;
    
    -- Try to get user roles using the direct function
    BEGIN
        -- Get user roles using the direct function
        SELECT rpc.get_user_roles_direct(user_id) INTO user_roles;
        
        -- Check if user is a platform admin by looking at the roles
        SELECT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(user_roles, '{}'::jsonb[]))
            WHERE (value->>'base_role') = 'admin'
            AND (value->>'context_type') = 'platform'
        ) INTO is_admin;
        
        -- Add RBAC metadata
        new_claims := jsonb_set(new_claims, '{app_metadata}', jsonb_build_object(
            'roles', COALESCE(user_roles, '{}'::jsonb[]),
            'is_platform_admin', is_admin
        ));
    EXCEPTION WHEN OTHERS THEN
        -- If function doesn't exist or fails, just continue
        NULL;
    END;
    
    -- Update the event with the new claims
    event := jsonb_set(event, '{claims}', new_claims);
    
    -- Return the modified event
    RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin; 