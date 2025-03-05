-- Fix for infinite recursion in RLS policies
-- This migration fixes the infinite recursion in the RLS policies for custom_roles and user_custom_roles tables

-- Create a function to get all custom roles directly without using RLS
CREATE OR REPLACE FUNCTION rpc.get_all_custom_roles_direct()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    base_role TEXT,
    context_type TEXT,
    context_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.name,
        cr.description,
        cr.base_role,
        cr.context_type,
        cr.context_id,
        cr.created_at,
        cr.updated_at
    FROM public.custom_roles cr;
END;
$$;

-- Create a function to get all user custom roles directly without using RLS
CREATE OR REPLACE FUNCTION rpc.get_all_user_custom_roles_direct()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    role_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ucr.id,
        ucr.user_id,
        ucr.role_id,
        ucr.created_at
    FROM public.user_custom_roles ucr;
END;
$$;

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view roles they have been assigned" ON public.custom_roles;
DROP POLICY IF EXISTS "App owners can assign app-level roles" ON public.user_custom_roles;
DROP POLICY IF EXISTS "Org admins can assign org-level roles" ON public.user_custom_roles;

-- Create new policies that don't cause infinite recursion
-- For custom_roles
CREATE POLICY "Users can view roles they have been assigned (fixed)"
ON public.custom_roles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM rpc.get_all_user_custom_roles_direct() ucr
        WHERE ucr.role_id = public.custom_roles.id AND ucr.user_id = auth.uid()
    )
);

-- For user_custom_roles
CREATE POLICY "App owners can assign app-level roles (fixed)"
ON public.user_custom_roles
USING (
    EXISTS (
        SELECT 1 FROM rpc.get_all_custom_roles_direct() cr
        WHERE cr.id = public.user_custom_roles.role_id
        AND cr.context_type = 'application' 
        AND EXISTS (SELECT 1 FROM rpc.is_app_owner(cr.context_id))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rpc.get_all_custom_roles_direct() cr
        WHERE cr.id = public.user_custom_roles.role_id
        AND cr.context_type = 'application' 
        AND EXISTS (SELECT 1 FROM rpc.is_app_owner(cr.context_id))
    )
);

CREATE POLICY "Org admins can assign org-level roles (fixed)"
ON public.user_custom_roles
USING (
    EXISTS (
        SELECT 1 FROM rpc.get_all_custom_roles_direct() cr
        WHERE cr.id = public.user_custom_roles.role_id
        AND cr.context_type = 'organization' 
        AND EXISTS (SELECT 1 FROM rpc.is_org_admin(cr.context_id))
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM rpc.get_all_custom_roles_direct() cr
        WHERE cr.id = public.user_custom_roles.role_id
        AND cr.context_type = 'organization' 
        AND EXISTS (SELECT 1 FROM rpc.is_org_admin(cr.context_id))
    )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA rpc TO authenticated;
GRANT EXECUTE ON FUNCTION rpc.get_all_custom_roles_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc.get_all_user_custom_roles_direct() TO authenticated; 