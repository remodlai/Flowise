-- Fix permissions for the user_roles table

-- Grant permissions to the service role
GRANT ALL ON TABLE public.user_roles TO service_role;
GRANT ALL ON TABLE public.roles TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT SELECT ON TABLE public.roles TO authenticated;

-- Grant permissions to the supabase_auth_admin role for JWT hook
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;
GRANT ALL ON TABLE public.roles TO supabase_auth_admin;

-- Enable RLS on the user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Platform admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Organization admins can manage roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "Allow auth admin to read user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users with user_role.view permission" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users with user_role.create permission" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users with user_role.edit permission" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users with user_role.delete permission" ON public.user_roles;

-- Create policies for the user_roles table using our authorize functions
CREATE POLICY "Allow users with user_role.view permission" 
ON public.user_roles FOR SELECT 
USING (authorize('user_role.view') OR user_id = auth.uid());

CREATE POLICY "Allow users with user_role.create permission" 
ON public.user_roles FOR INSERT 
WITH CHECK (authorize('user_role.create'));

CREATE POLICY "Allow users with user_role.edit permission" 
ON public.user_roles FOR UPDATE 
USING (authorize('user_role.edit'))
WITH CHECK (authorize('user_role.edit'));

CREATE POLICY "Allow users with user_role.delete permission" 
ON public.user_roles FOR DELETE 
USING (authorize('user_role.delete'));

-- Allow auth admin to read user roles (for JWT hook)
CREATE POLICY "Allow auth admin to read user roles" 
ON public.user_roles FOR SELECT 
TO supabase_auth_admin
USING (true);

-- Enable RLS on the roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform admins can view all roles" ON public.roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.roles;
DROP POLICY IF EXISTS "Platform admins can manage all roles" ON public.roles;
DROP POLICY IF EXISTS "Allow auth admin to read roles" ON public.roles;
DROP POLICY IF EXISTS "Allow users with role.view permission" ON public.roles;
DROP POLICY IF EXISTS "Allow users with role.create permission" ON public.roles;
DROP POLICY IF EXISTS "Allow users with role.edit permission" ON public.roles;
DROP POLICY IF EXISTS "Allow users with role.delete permission" ON public.roles;

-- Create policies for the roles table using our authorize functions
CREATE POLICY "Allow users with role.view permission" 
ON public.roles FOR SELECT 
USING (authorize('role.view'));

CREATE POLICY "Allow users with role.create permission" 
ON public.roles FOR INSERT 
WITH CHECK (authorize('role.create'));

CREATE POLICY "Allow users with role.edit permission" 
ON public.roles FOR UPDATE 
USING (authorize('role.edit'))
WITH CHECK (authorize('role.edit'));

CREATE POLICY "Allow users with role.delete permission" 
ON public.roles FOR DELETE 
USING (authorize('role.delete'));

-- Allow auth admin to read roles (for JWT hook)
CREATE POLICY "Allow auth admin to read roles" 
ON public.roles FOR SELECT 
TO supabase_auth_admin
USING (true);

-- Create the User Management category if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM permission_categories WHERE name = 'User Management') THEN
        INSERT INTO permission_categories (name, description)
        VALUES ('User Management', 'Permissions related to user management');
    END IF;
END $$;

-- Insert the necessary permissions into the permissions table
INSERT INTO public.permissions (name, description, category_id, context_types)
VALUES 
('user_role.view', 'View user roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform', 'organization']),
('user_role.create', 'Create user roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform', 'organization']),
('user_role.edit', 'Edit user roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform', 'organization']),
('user_role.delete', 'Delete user roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform', 'organization']),
('role.view', 'View roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform']),
('role.create', 'Create roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform']),
('role.edit', 'Edit roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform']),
('role.delete', 'Delete roles', (SELECT id FROM permission_categories WHERE name = 'User Management'), ARRAY['platform'])
ON CONFLICT (name) DO NOTHING;

-- Get the platform_admin role ID
DO $$
DECLARE
    platform_admin_id uuid;
BEGIN
    SELECT id INTO platform_admin_id FROM roles WHERE name = 'platform_admin' LIMIT 1;
    
    IF platform_admin_id IS NOT NULL THEN
        -- Assign permissions to the platform_admin role
        INSERT INTO public.role_permissions (role_id, permission)
        VALUES 
        (platform_admin_id, 'user_role.view'),
        (platform_admin_id, 'user_role.create'),
        (platform_admin_id, 'user_role.edit'),
        (platform_admin_id, 'user_role.delete'),
        (platform_admin_id, 'role.view'),
        (platform_admin_id, 'role.create'),
        (platform_admin_id, 'role.edit'),
        (platform_admin_id, 'role.delete')
        ON CONFLICT (role_id, permission) DO NOTHING;
    END IF;
END $$; 