-- Test script to check if the roles table has data

-- Check if the custom_roles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'custom_roles'
);

-- Check if there are any roles in the custom_roles table
SELECT COUNT(*) FROM public.custom_roles;

-- List all roles in the custom_roles table
SELECT id, name, description, context_type, context_id FROM public.custom_roles;

-- Check if the Super Admin role exists
SELECT id, name, description FROM public.custom_roles WHERE name = 'Super Admin';

-- Check if there are any permissions for the Super Admin role
SELECT 
    cr.name AS role_name,
    COUNT(rp.permission) AS permission_count
FROM 
    public.custom_roles cr
LEFT JOIN 
    public.role_permissions rp ON cr.id = rp.role_id
WHERE 
    cr.name = 'Super Admin'
GROUP BY 
    cr.name;

-- Check if there are any RLS policies that might be blocking access
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename = 'custom_roles'; 