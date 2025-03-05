-- Fix user roles
-- This script will check and fix the user's roles

-- Your user ID
DO $$
DECLARE
    current_user_id UUID := 'a2132fe6-bc0d-449f-8361-c5e5b598e0e6';
    platform_admin_role_id UUID;
    has_platform_admin BOOLEAN;
BEGIN
    -- Check if the platform_admin role exists
    SELECT id INTO platform_admin_role_id 
    FROM public.custom_roles 
    WHERE name = 'platform_admin';
    
    IF platform_admin_role_id IS NULL THEN
        -- Create the platform_admin role if it doesn't exist
        INSERT INTO public.custom_roles (name, description, base_role, context_type, created_by)
        VALUES ('platform_admin', 'Platform administrator with full access', 'admin', 'platform', current_user_id)
        RETURNING id INTO platform_admin_role_id;
        
        RAISE NOTICE 'Created platform_admin role with ID %', platform_admin_role_id;
    END IF;
    
    -- Check if the user already has the platform_admin role
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_custom_roles 
        WHERE user_id = current_user_id
        AND role_id = platform_admin_role_id
    ) INTO has_platform_admin;
    
    IF NOT has_platform_admin THEN
        -- Assign the platform_admin role to the user
        INSERT INTO public.user_custom_roles (user_id, role_id, created_by)
        VALUES (current_user_id, platform_admin_role_id, current_user_id);
        
        RAISE NOTICE 'Assigned platform_admin role to user %', current_user_id;
    ELSE
        RAISE NOTICE 'User % already has platform_admin role', current_user_id;
    END IF;
    
    -- Update the user's metadata to include the role
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"platform_admin"'
    )
    WHERE id = current_user_id;
    
    -- Force a token refresh
    UPDATE auth.users
    SET updated_at = NOW()
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Updated user metadata and forced token refresh for user %', current_user_id;
END $$; 