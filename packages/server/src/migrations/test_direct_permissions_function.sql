-- Test the direct permissions function

-- Test with the Super Admin role ID
SELECT * FROM public.get_role_permissions_direct('9076e5ba-17ea-48a2-acdd-623f16a19629');

-- Count the permissions
SELECT COUNT(*) FROM public.get_role_permissions_direct('9076e5ba-17ea-48a2-acdd-623f16a19629');

-- Compare with direct query (this might be blocked by RLS)
SELECT permission FROM public.role_permissions WHERE role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629';
SELECT COUNT(*) FROM public.role_permissions WHERE role_id = '9076e5ba-17ea-48a2-acdd-623f16a19629'; 