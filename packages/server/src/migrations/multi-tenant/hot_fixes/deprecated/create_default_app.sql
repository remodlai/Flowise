-- Create default application and roles
-- This script will create a default application and the necessary roles if they don't exist

-- Create platform_admin role if it doesn't exist
INSERT INTO public.custom_roles (name, description, base_role, context_type)
VALUES ('platform_admin', 'Platform administrator with full access', 'admin', 'platform')
ON CONFLICT (name) DO NOTHING;

-- Create app_admin role if it doesn't exist
INSERT INTO public.custom_roles (name, description, base_role, context_type)
VALUES ('app_admin', 'Application administrator with full access to an application', 'admin', 'application')
ON CONFLICT (name) DO NOTHING;

-- Create app_user role if it doesn't exist
INSERT INTO public.custom_roles (name, description, base_role, context_type)
VALUES ('app_user', 'Regular application user', 'user', 'application')
ON CONFLICT (name) DO NOTHING;

-- Create a default application if none exists
INSERT INTO public.applications (name, description)
SELECT 'Default Application', 'Default application for testing'
WHERE NOT EXISTS (SELECT 1 FROM public.applications LIMIT 1);

-- Get the application ID
DO $$
DECLARE
    app_id UUID;
    platform_admin_role_id UUID;
    user_id UUID := 'a2132fe6-bc0d-449f-8361-c5e5b598e0e6'; -- Your user ID
BEGIN
    -- Get the application ID
    SELECT id INTO app_id FROM public.applications WHERE name = 'Default Application' LIMIT 1;
    
    -- Get the platform_admin role ID
    SELECT id INTO platform_admin_role_id FROM public.custom_roles WHERE name = 'platform_admin' LIMIT 1;
    
    -- Associate the user with the platform_admin role if not already
    INSERT INTO public.user_custom_roles (user_id, role_id, created_by)
    VALUES (user_id, platform_admin_role_id, user_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Created default application with ID % and assigned platform_admin role to user %', app_id, user_id;
END $$; 