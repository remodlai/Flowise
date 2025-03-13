CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_id UUID;
    original_claims jsonb;
    new_claims jsonb;
    user_metadata jsonb;
    user_roles jsonb;
    is_platform_admin BOOLEAN := false;
    is_service_user BOOLEAN := false;
    user_status TEXT := 'active';
    creator_info jsonb := null;
    app_info jsonb := null;
    org_info jsonb := null;
BEGIN
    -- Extract user_id from the event
    user_id := (event->>'user_id')::uuid;
    
    -- Get the original claims
    original_claims := event->'claims';
    
    -- Start with the original claims
    new_claims := original_claims;
    
    -- Check if user is a service user based on metadata
    BEGIN
        SELECT raw_user_meta_data INTO user_metadata
        FROM auth.users
        WHERE id = user_id;
        
        -- Check if this is a service user
        IF user_metadata->>'is_service_user' IS NOT NULL AND 
           (user_metadata->>'is_service_user')::boolean = true THEN
            is_service_user := true;
        END IF;
        
        -- Get user status if available
        IF user_metadata->>'status' IS NOT NULL THEN
            user_status := user_metadata->>'status';
        END IF;
        
        -- Add creator information if available
        IF user_metadata->>'created_by' IS NOT NULL THEN
            creator_info := jsonb_build_object(
                'id', user_metadata->>'created_by',
                'first_name', COALESCE(user_metadata->>'creator_first_name', ''),
                'last_name', COALESCE(user_metadata->>'creator_last_name', '')
            );
        END IF;
        
        -- Add application information if available
        IF user_metadata->>'application_id' IS NOT NULL THEN
            app_info := jsonb_build_object(
                'id', user_metadata->>'application_id',
                'name', COALESCE(user_metadata->>'application_name', '')
            );
        END IF;
        
        -- Add organization information if available
        IF user_metadata->>'organization_id' IS NOT NULL THEN
            org_info := jsonb_build_object(
                'id', user_metadata->>'organization_id',
                'name', COALESCE(user_metadata->>'organization_name', '')
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If there's an error, just continue
        NULL;
    END;
    
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
            FROM public.user_roles ucr
            JOIN public.roles cr ON ucr.role_id = cr.id
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
        FROM public.user_roles ucr
        JOIN public.roles cr ON ucr.role_id = cr.id
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
    
    -- Add enhanced metadata to claims
    new_claims := jsonb_set(new_claims, '{is_service_user}', to_jsonb(is_service_user));
    new_claims := jsonb_set(new_claims, '{user_status}', to_jsonb(user_status));
    
    -- Add creator info if available
    IF creator_info IS NOT NULL THEN
        new_claims := jsonb_set(new_claims, '{creator}', creator_info);
    END IF;
    
    -- Add application info if available
    IF app_info IS NOT NULL THEN
        new_claims := jsonb_set(new_claims, '{application}', app_info);
    END IF;
    
    -- Add organization info if available
    IF org_info IS NOT NULL THEN
        new_claims := jsonb_set(new_claims, '{organization}', org_info);
    END IF;
    
    -- Add a test claim to see if the hook is working
    new_claims := jsonb_set(new_claims, '{test_claim}', to_jsonb('v9_enhanced_metadata'));
    
    -- Update the event with the new claims
    event := jsonb_set(event, '{claims}', new_claims);
    
    -- Return the modified event
    RETURN event;
END;
$function$; 