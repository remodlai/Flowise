-- v6 debug version of custom_access_token_hook function
-- This version adds debugging to log any errors that might be occurring

-- Update the function in the public schema with debugging
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
    app_metadata jsonb;
    user_roles jsonb[];
    is_admin boolean = false;
    is_superadmin boolean = false;
    is_platform_admin boolean = false;
    base_role text;
    current_metadata jsonb;
    debug_info jsonb;
BEGIN
    -- Start with debug info
    debug_info := jsonb_build_object('event', event);
    
    -- Extract user_id from the event
    BEGIN
        user_id := (event->>'user_id')::uuid;
        debug_info := jsonb_set(debug_info, '{user_id}', to_jsonb(user_id));
    EXCEPTION WHEN OTHERS THEN
        debug_info := jsonb_set(debug_info, '{errors, user_id}', to_jsonb(SQLERRM));
    END;
    
    -- Get the original claims
    BEGIN
        original_claims := event->'claims';
        debug_info := jsonb_set(debug_info, '{original_claims}', original_claims);
    EXCEPTION WHEN OTHERS THEN
        debug_info := jsonb_set(debug_info, '{errors, original_claims}', to_jsonb(SQLERRM));
    END;
    
    -- Start with the original claims
    new_claims := original_claims;
    
    -- Get user metadata and app_metadata from the original claims
    BEGIN
        user_metadata := original_claims->'user_metadata';
        app_metadata := original_claims->'app_metadata';
        debug_info := jsonb_set(debug_info, '{user_metadata}', user_metadata);
        debug_info := jsonb_set(debug_info, '{app_metadata}', app_metadata);
    EXCEPTION WHEN OTHERS THEN
        debug_info := jsonb_set(debug_info, '{errors, metadata}', to_jsonb(SQLERRM));
    END;
    
    -- Get user metadata from profiles
    BEGIN
        SELECT meta INTO user_metadata 
        FROM public.user_profiles 
        WHERE user_id = user_id;

        debug_info := jsonb_set(debug_info, '{user_profiles_metadata}', COALESCE(user_metadata, 'null'::jsonb));

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
        debug_info := jsonb_set(debug_info, '{errors, user_profiles}', to_jsonb(SQLERRM));
    END;
    
    -- Try to get user roles using the direct function
    BEGIN
        -- Get user roles using the direct function
        SELECT rpc.get_user_roles_direct(user_id) INTO user_roles;
        debug_info := jsonb_set(debug_info, '{user_roles}', COALESCE(to_jsonb(user_roles), 'null'::jsonb));
        
        -- Check if user is a platform admin by looking at the roles
        SELECT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(user_roles, '{}'::jsonb[]))
            WHERE (value->>'base_role') = 'admin'
            AND (value->>'context_type') = 'platform'
        ) INTO is_admin;
        debug_info := jsonb_set(debug_info, '{is_admin}', to_jsonb(is_admin));
        
        -- Check if user is a superadmin
        SELECT EXISTS (
            SELECT 1
            FROM auth.users
            WHERE id = user_id
            AND raw_user_meta_data->>'role' = 'superadmin'
        ) INTO is_superadmin;
        debug_info := jsonb_set(debug_info, '{is_superadmin}', to_jsonb(is_superadmin));
        
        -- If user is a superadmin, set is_admin to true
        IF is_superadmin THEN
            is_admin := true;
        END IF;
        
        -- Determine if user is a platform admin (for the platform_admin claim)
        is_platform_admin := 
            is_admin OR 
            is_superadmin OR 
            (app_metadata->>'is_platform_admin')::boolean = true OR
            (user_metadata->>'role') = 'platform_admin' OR
            (user_metadata->>'role') = 'superadmin';
        debug_info := jsonb_set(debug_info, '{is_platform_admin}', to_jsonb(is_platform_admin));
        
        -- Get the base role from the first role with context_type = 'platform'
        SELECT value->>'base_role' INTO base_role
        FROM jsonb_array_elements(COALESCE(user_roles, '{}'::jsonb[]))
        WHERE (value->>'context_type') = 'platform'
        LIMIT 1;
        debug_info := jsonb_set(debug_info, '{base_role}', COALESCE(to_jsonb(base_role), 'null'::jsonb));
        
        -- If no platform role found but user is superadmin, set base_role to 'platform_admin'
        IF base_role IS NULL AND is_superadmin THEN
            base_role := 'platform_admin';
        -- If no platform role found, default to 'user'
        ELSIF base_role IS NULL THEN
            base_role := 'user';
        END IF;
        
        -- Add RBAC metadata to claims
        new_claims := jsonb_set(new_claims, '{app_metadata}', jsonb_build_object(
            'roles', COALESCE(user_roles, '{}'::jsonb[]),
            'is_platform_admin', is_platform_admin
        ));
        
        -- Add user_role to claims for backward compatibility
        new_claims := jsonb_set(new_claims, '{user_role}', to_jsonb(
            CASE 
                WHEN is_superadmin THEN 'platform_admin'
                ELSE base_role
            END
        ));
        
        -- Add platform_admin claim for RLS policies
        new_claims := jsonb_set(new_claims, '{platform_admin}', to_jsonb(is_platform_admin));
        
        -- Get current user metadata
        SELECT raw_user_meta_data INTO current_metadata
        FROM auth.users
        WHERE id = user_id;
        
        -- Update user_metadata in auth.users table with a direct UPDATE
        -- This ensures the UI will see the updated role
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            COALESCE(current_metadata, '{}'::jsonb),
            '{role}',
            to_jsonb(
                CASE 
                    WHEN is_superadmin THEN 'platform_admin'
                    ELSE base_role
                END
            )
        )
        WHERE id = user_id;
        
    EXCEPTION WHEN OTHERS THEN
        debug_info := jsonb_set(debug_info, '{errors, roles}', to_jsonb(SQLERRM));
    END;
    
    -- Update the event with the new claims
    BEGIN
        event := jsonb_set(event, '{claims}', new_claims);
        debug_info := jsonb_set(debug_info, '{new_claims}', new_claims);
    EXCEPTION WHEN OTHERS THEN
        debug_info := jsonb_set(debug_info, '{errors, update_claims}', to_jsonb(SQLERRM));
    END;
    
    -- Log debug info to a table if it exists
    BEGIN
        INSERT INTO public.hook_debug_logs (hook_name, debug_info)
        VALUES ('custom_access_token_hook', debug_info);
    EXCEPTION WHEN OTHERS THEN
        -- If table doesn't exist, just continue
        NULL;
    END;
    
    -- Return the modified event
    RETURN event;
END;
$$;

-- Create a debug table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hook_debug_logs (
    id SERIAL PRIMARY KEY,
    hook_name TEXT NOT NULL,
    debug_info JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT UPDATE ON auth.users TO supabase_auth_admin;
GRANT ALL ON public.hook_debug_logs TO supabase_auth_admin;

-- Revoke permissions from other roles
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public; 