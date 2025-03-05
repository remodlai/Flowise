-- Script to check and fix role permissions

-- First, let's check if there are any role permissions
SELECT 
    rp.id,
    cr.name AS role_name,
    rp.permission,
    COUNT(*) OVER() AS total_permissions
FROM 
    public.role_permissions rp
JOIN 
    public.custom_roles cr ON rp.role_id = cr.id
LIMIT 10;

-- Check if the Super Admin role has the correct ID
SELECT 
    id, 
    name, 
    description 
FROM 
    public.custom_roles 
WHERE 
    name = 'Super Admin';

-- Check if permissions exist in the permissions table
SELECT 
    id, 
    name, 
    description, 
    category_id,
    context_types
FROM 
    public.permissions
LIMIT 10;

-- Add permissions to the Super Admin role (ID: 9076e5ba-17ea-48a2-acdd-623f16a19629)
DO $$
DECLARE
    super_admin_role_id UUID := '9076e5ba-17ea-48a2-acdd-623f16a19629';
    permission_count INT;
BEGIN
    -- Check if permissions exist
    SELECT COUNT(*) INTO permission_count FROM public.permissions;
    
    IF permission_count = 0 THEN
        RAISE NOTICE 'No permissions found in the permissions table';
        RETURN;
    END IF;
    
    -- Add all permissions to the Super Admin role
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
    
    -- Get the count of permissions added
    GET DIAGNOSTICS permission_count = ROW_COUNT;
    RAISE NOTICE 'Added % permissions to the Super Admin role', permission_count;
END $$; 