-- Create Super Admin Role Migration
-- This migration creates a super admin role with all permissions

-- First, create the super admin role
INSERT INTO public.custom_roles (
    name,
    description,
    context_type,
    created_by
)
VALUES (
    'Super Admin',
    'Super administrator with all permissions across the Remodl AI Platform',
    'platform',
    (SELECT id FROM auth.users WHERE email = 'brian+test@remodl.ai' LIMIT 1)
)
ON CONFLICT (name, context_type, context_id) DO NOTHING
RETURNING id;

-- Get the role ID
DO $$
DECLARE
    super_admin_role_id UUID;
BEGIN
    -- Get the super admin role ID
    SELECT id INTO super_admin_role_id
    FROM public.custom_roles
    WHERE name = 'Super Admin' AND context_type = 'platform';
    
    -- If the role doesn't exist, exit
    IF super_admin_role_id IS NULL THEN
        RAISE NOTICE 'Super Admin role not found';
        RETURN;
    END IF;
    
    -- Add all permissions to the super admin role
    INSERT INTO public.role_permissions (
        role_id,
        permission
    )
    SELECT 
        super_admin_role_id,
        name
    FROM 
        public.permissions
    ON CONFLICT (role_id, permission) DO NOTHING;
    
    -- Log success
    RAISE NOTICE 'Super Admin role created with ID: %', super_admin_role_id;
END $$;

-- Assign the super admin role to a specific user (replace with the actual user ID)
DO $$
DECLARE
    super_admin_role_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get the super admin role ID
    SELECT id INTO super_admin_role_id
    FROM public.custom_roles
    WHERE name = 'Super Admin' AND context_type = 'platform';
    
    -- Get the admin user ID (replace with the actual user email)
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'briantest@remodl.ai'
    LIMIT 1;
    
    -- If either the role or user doesn't exist, exit
    IF super_admin_role_id IS NULL OR admin_user_id IS NULL THEN
        RAISE NOTICE 'Super Admin role or user not found';
        RETURN;
    END IF;
    
    -- Assign the role to the user
    INSERT INTO public.user_custom_roles (
        user_id,
        role_id,
        created_by
    )
    VALUES (
        admin_user_id,
        super_admin_role_id,
        admin_user_id
    )
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Log success
    RAISE NOTICE 'Super Admin role assigned to user with ID: %', admin_user_id;
END $$; 