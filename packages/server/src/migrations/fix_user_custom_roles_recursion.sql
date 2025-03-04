-- Fix for infinite recursion in user_custom_roles and custom_roles policies
-- This migration adds a direct SQL function to bypass RLS when fetching user roles

-- Create a function to get user roles directly without using RLS
CREATE OR REPLACE FUNCTION rpc.get_user_roles_direct(input_user_id UUID)
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb[];
BEGIN
    -- Get all roles for the user with their permissions in a single query
    SELECT array_agg(
        jsonb_build_object(
            'id', cr.id,
            'name', cr.name,
            'description', cr.description,
            'base_role', cr.base_role,
            'context_type', cr.context_type,
            'context_id', cr.context_id,
            'created_at', cr.created_at,
            'updated_at', cr.updated_at,
            'permissions', (
                SELECT jsonb_agg(rp.permission)
                FROM public.role_permissions rp
                WHERE rp.role_id = cr.id
            )
        )
    )
    INTO result
    FROM public.custom_roles cr
    JOIN public.user_custom_roles ucr ON cr.id = ucr.role_id
    WHERE ucr.user_id = input_user_id;
    
    -- Return empty array if null
    RETURN COALESCE(result, '{}'::jsonb[]);
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA rpc TO authenticated;
GRANT EXECUTE ON FUNCTION rpc.get_user_roles_direct(UUID) TO authenticated; 