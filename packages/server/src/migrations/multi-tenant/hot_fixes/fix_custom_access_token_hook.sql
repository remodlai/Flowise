-- Fix for custom_access_token_hook function
-- This migration fixes the custom_access_token_hook function that's causing login issues

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
    user_roles jsonb = '[]'::jsonb;
    user_custom_roles jsonb = '[]'::jsonb;
    is_admin boolean = false;
    legacy_role text;
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
            
            -- Get legacy role from metadata
            legacy_role := user_metadata->>'role';
            IF legacy_role IS NOT NULL THEN
                new_claims := jsonb_set(new_claims, '{user_role}', to_jsonb(legacy_role));
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If user_profiles table doesn't exist, just continue
        NULL;
    END;
    
    -- Try to get RBAC roles if the tables exist
    BEGIN
        -- Check if user is a platform admin
        SELECT EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = user_id
            AND role = 'admin'
            AND resource_type = 'platform'
        ) INTO is_admin;
        
        -- Try to use the RPC functions if they exist
        BEGIN
            SELECT rpc.get_user_roles(user_id) INTO user_roles;
            SELECT rpc.get_user_custom_roles(user_id) INTO user_custom_roles;
        EXCEPTION WHEN OTHERS THEN
            -- If RPC functions don't exist, try direct queries
            SELECT jsonb_agg(
                jsonb_build_object(
                    'role', role,
                    'resource_type', resource_type,
                    'resource_id', resource_id
                )
            ) INTO user_roles
            FROM public.user_roles
            WHERE user_roles.user_id = user_id;
            
            -- Get custom roles directly
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', cr.id,
                    'name', cr.name,
                    'description', cr.description,
                    'context_type', cr.context_type,
                    'context_id', cr.context_id
                )
            ) INTO user_custom_roles
            FROM public.user_custom_roles ucr
            JOIN public.custom_roles cr ON ucr.role_id = cr.id
            WHERE ucr.user_id = user_id;
            
            -- Default empty array for custom roles if we can't get them
            IF user_custom_roles IS NULL THEN
                user_custom_roles := '[]'::jsonb;
            END IF;
        END;
        
        -- Add RBAC metadata
        new_claims := jsonb_set(new_claims, '{app_metadata}', jsonb_build_object(
            'roles', COALESCE(user_roles, '[]'::jsonb),
            'custom_roles', COALESCE(user_custom_roles, '[]'::jsonb),
            'is_platform_admin', is_admin,
            'legacy_role', legacy_role
        ));
    EXCEPTION WHEN OTHERS THEN
        -- If RBAC tables don't exist, just continue
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