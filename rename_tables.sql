-- Rename custom_roles to roles
ALTER TABLE public.custom_roles RENAME TO roles;

-- Drop the existing user_roles view
DROP VIEW IF EXISTS public.user_roles;

-- Rename user_custom_roles to user_roles
ALTER TABLE public.user_custom_roles RENAME TO user_roles;

-- Add a type column to roles table to distinguish between custom and built-in roles
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'custom';

-- Update existing roles to be marked as custom
UPDATE public.roles SET role_type = 'custom';

-- Create an index on the role_type column
CREATE INDEX IF NOT EXISTS idx_roles_role_type ON public.roles(role_type);

-- Recreate the user_roles view for backward compatibility
CREATE OR REPLACE VIEW public.user_custom_roles_view AS
SELECT 
    ur.id,
    ur.user_id,
    r.name AS role,
    ur.resource_type,
    ur.resource_id,
    ur.created_at
FROM 
    public.user_roles ur
JOIN 
    public.roles r ON ur.role_id = r.id; 