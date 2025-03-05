-- Fix for circular dependency in RLS policies
-- This migration simplifies the RLS policies to avoid circular references

-- Drop the problematic policy that causes circular dependency
DROP POLICY IF EXISTS "Users can view roles they have been assigned" ON public.custom_roles;

-- Create a simpler policy for custom_roles
-- Only platform admins, app owners, and org admins can view roles
CREATE POLICY "Only admins can view all roles"
ON public.custom_roles
FOR SELECT
USING (
    EXISTS (SELECT 1 FROM rpc.is_platform_admin())
    OR
    (context_type = 'application' AND EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id)))
    OR
    (context_type = 'organization' AND EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id)))
);

-- Create a function to check if a user has a specific permission
-- This avoids the need for users to directly query roles
CREATE OR REPLACE FUNCTION rpc.user_has_permission(
    p_user_id UUID,
    p_permission TEXT,
    p_context_type TEXT DEFAULT NULL,
    p_context_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    -- Check if the user has the permission through any of their roles
    SELECT EXISTS (
        SELECT 1
        FROM public.user_custom_roles ucr
        JOIN public.custom_roles cr ON ucr.role_id = cr.id
        JOIN public.role_permissions rp ON rp.role_id = cr.id
        WHERE ucr.user_id = p_user_id
        AND rp.permission = p_permission
        AND (
            p_context_type IS NULL
            OR (
                cr.context_type = p_context_type
                AND (p_context_id IS NULL OR cr.context_id = p_context_id)
            )
        )
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA rpc TO authenticated;
GRANT EXECUTE ON FUNCTION rpc.user_has_permission(UUID, TEXT, TEXT, UUID) TO authenticated; 