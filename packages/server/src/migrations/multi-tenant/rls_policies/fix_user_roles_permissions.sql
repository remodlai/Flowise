-- Grant SELECT permission on user_roles table to authenticated users
GRANT SELECT ON public.user_roles TO authenticated;

-- Create a policy to allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid() OR (auth.jwt() ->> 'is_platform_admin')::boolean = true);

-- Create a policy to allow platform admins to manage all roles
CREATE POLICY "Platform admins can manage all roles" ON public.user_roles
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

-- Grant SELECT permission on roles table to authenticated users
GRANT SELECT ON public.roles TO authenticated;

-- Create a policy to allow all authenticated users to view roles
CREATE POLICY "Authenticated users can view roles" ON public.roles
FOR SELECT
USING (true);

-- Grant SELECT permission on role_permissions table to authenticated users
GRANT SELECT ON public.role_permissions TO authenticated;

-- Create a policy to allow all authenticated users to view role permissions
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
FOR SELECT
USING (true); 