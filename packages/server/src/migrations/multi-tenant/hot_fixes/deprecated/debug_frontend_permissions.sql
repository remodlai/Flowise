-- Script to debug why the frontend isn't showing the correct permissions

-- Check the RLS policies on the role_permissions table
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

-- Check if the role_permissions table has the correct data
SELECT 
    role_id, 
    permission
FROM 
    public.role_permissions
WHERE 
    role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629'
LIMIT 5;

-- Count the permissions for the Super Admin role
SELECT 
    COUNT(*) 
FROM 
    public.role_permissions
WHERE 
    role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629';

-- Check if the RLS is blocking access to the role_permissions table
-- This simulates what the frontend might be seeing
BEGIN;
SET LOCAL ROLE authenticated;
SELECT 
    COUNT(*) 
FROM 
    public.role_permissions
WHERE 
    role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629';
RESET ROLE;
COMMIT;

-- Create a more permissive policy for the role_permissions table
-- This will allow anyone to view the permissions
DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;
CREATE POLICY "Anyone can view role permissions" 
ON public.role_permissions
FOR SELECT
USING (true);

-- Check if the policy was created
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
    AND tablename = 'role_permissions'
    AND policyname = 'Anyone can view role permissions';

-- Test the policy
BEGIN;
SET LOCAL ROLE authenticated;
SELECT 
    COUNT(*) 
FROM 
    public.role_permissions
WHERE 
    role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629';
RESET ROLE;
COMMIT; 