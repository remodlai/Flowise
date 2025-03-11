-- Remove the unused Superadmin and Super Admin roles
DELETE FROM public.roles WHERE name IN ('Superadmin', 'Super Admin'); 