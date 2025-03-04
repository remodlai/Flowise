-- Diagnostic script to understand why permissions aren't showing up

-- Check the structure of the role_permissions table
\d public.role_permissions;

-- Check if the role_permissions table has the expected columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'role_permissions';

-- Check if there are any constraints on the role_permissions table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    conrelid = 'public.role_permissions'::regclass;

-- Try a direct insert with RETURNING to see if it works
INSERT INTO public.role_permissions (role_id, permission)
VALUES ('9076e5ba-17ea-48a2-acdd-623f16a19629', 'test.permission')
ON CONFLICT (role_id, permission) DO NOTHING
RETURNING id, role_id, permission;

-- Check if the insert worked
SELECT * FROM public.role_permissions 
WHERE role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629' 
AND permission = 'test.permission';

-- Check if the UI is querying a different table or view
-- Let's look at all tables that might be related to roles or permissions
SELECT 
    table_schema, 
    table_name
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' 
    AND (
        table_name LIKE '%role%' 
        OR table_name LIKE '%permission%'
    );

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
    AND tablename = 'role_permissions';

-- Check if the role exists with the expected ID
SELECT * FROM public.custom_roles 
WHERE id = '9076e5ba-17ea-48a2-acdd-623f16a19629';

-- Check if the permissions exist
SELECT * FROM public.permissions 
WHERE name IN ('platform.view', 'platform.edit', 'platform.manage_users');

-- Check if there's a view or function that the UI might be using
SELECT 
    routine_schema, 
    routine_name, 
    routine_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public' 
    AND (
        routine_name LIKE '%role%' 
        OR routine_name LIKE '%permission%'
    ); 