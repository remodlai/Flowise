-- Update the existing platform_admin role to be marked as built_in
UPDATE public.roles 
SET role_type = 'built_in',
    description = 'Administrator with full access to the platform'
WHERE name = 'platform_admin';

-- Add a unique constraint on the name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'roles_name_key'
    ) THEN
        ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name);
    END IF;
END $$;

-- Get a system user ID to use as created_by
DO $$
DECLARE
    system_user_id uuid;
BEGIN
    -- Try to get an existing user ID
    SELECT id INTO system_user_id FROM auth.users LIMIT 1;
    
    -- Add other predefined roles to the roles table
    INSERT INTO public.roles (name, description, context_type, role_type, created_by)
    VALUES 
        ('platform_owner', 'Owner with full access to the platform', 'platform', 'built_in', system_user_id),
        ('app_admin', 'Administrator with full access to an application', 'application', 'built_in', system_user_id),
        ('app_owner', 'Owner with full access to an application', 'application', 'built_in', system_user_id),
        ('organization_owner', 'Owner with full access to an organization', 'organization', 'built_in', system_user_id),
        ('organization_admin', 'Administrator with full access to an organization', 'organization', 'built_in', system_user_id),
        ('organization_member', 'Member with limited access to an organization', 'organization', 'built_in', system_user_id)
    ON CONFLICT (name) DO UPDATE 
    SET 
        description = EXCLUDED.description,
        context_type = EXCLUDED.context_type,
        role_type = EXCLUDED.role_type;
END $$;

-- Comment out these lines if you don't want to remove the unused roles
-- DELETE FROM public.roles WHERE name IN ('Superadmin', 'Super Admin'); 