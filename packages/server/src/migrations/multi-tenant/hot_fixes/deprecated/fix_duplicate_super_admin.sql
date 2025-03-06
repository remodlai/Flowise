-- Script to fix duplicate Super Admin role issue

-- First, let's look at the duplicate roles
SELECT id, name, description, created_at 
FROM public.custom_roles 
WHERE name = 'Super Admin';

-- Option 1: Delete the duplicate role that has no permissions
-- This is safer if no users are assigned to this role
DELETE FROM public.custom_roles 
WHERE id = '84c47ec8-e841-4146-a817-1231035a4aad' 
AND name = 'Super Admin';

-- Option 2: If you prefer to keep both roles, add permissions to the duplicate role
-- Uncomment this section if you want to use this option instead
/*
INSERT INTO public.role_permissions (role_id, permission)
SELECT 
    '84c47ec8-e841-4146-a817-1231035a4aad', 
    permission
FROM 
    public.role_permissions
WHERE 
    role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629'
ON CONFLICT (role_id, permission) DO NOTHING;
*/

-- Check if any users are assigned to the duplicate role
-- If there are users, you might want to reassign them to the main Super Admin role
SELECT 
    ucr.user_id,
    u.email,
    cr.name AS role_name
FROM 
    public.user_custom_roles ucr
JOIN 
    public.custom_roles cr ON ucr.role_id = cr.id
JOIN 
    auth.users u ON ucr.user_id = u.id
WHERE 
    cr.id = '84c47ec8-e841-4146-a817-1231035a4aad';

-- Verify the results
SELECT id, name, description, 
    (SELECT COUNT(*) FROM public.role_permissions WHERE role_id = custom_roles.id) AS permission_count
FROM public.custom_roles 
WHERE name = 'Super Admin';

-- Check all roles and their permission counts
SELECT 
    cr.id,
    cr.name,
    cr.description,
    COUNT(rp.permission) AS permission_count
FROM 
    public.custom_roles cr
LEFT JOIN 
    public.role_permissions rp ON cr.id = rp.role_id
GROUP BY 
    cr.id, cr.name, cr.description
ORDER BY 
    cr.name; 