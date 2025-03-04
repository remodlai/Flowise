-- Fix for infinite recursion in RLS policies
-- This migration adds direct SQL functions to bypass RLS when fetching data

-- Function to get all applications directly
CREATE OR REPLACE FUNCTION rpc.get_all_applications_direct()
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb[];
BEGIN
    SELECT array_agg(
        jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'description', a.description,
            'created_at', a.created_at,
            'updated_at', a.updated_at,
            'created_by', a.created_by,
            'status', a.status,
            'settings', a.settings
        )
    )
    INTO result
    FROM public.applications a
    ORDER BY a.name ASC;
    
    RETURN COALESCE(result, '{}'::jsonb[]);
END;
$$;

-- Function to get all organizations directly
CREATE OR REPLACE FUNCTION rpc.get_all_organizations_direct()
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb[];
BEGIN
    SELECT array_agg(
        jsonb_build_object(
            'id', o.id,
            'name', o.name,
            'description', o.description,
            'application_id', o.application_id,
            'created_at', o.created_at,
            'updated_at', o.updated_at,
            'created_by', o.created_by,
            'settings', o.settings
        )
    )
    INTO result
    FROM public.organizations o
    ORDER BY o.name ASC;
    
    RETURN COALESCE(result, '{}'::jsonb[]);
END;
$$;

-- Function to get all custom roles directly
CREATE OR REPLACE FUNCTION rpc.get_all_custom_roles_direct()
RETURNS jsonb[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb[];
BEGIN
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
            'created_by', cr.created_by
        )
    )
    INTO result
    FROM public.custom_roles cr
    ORDER BY cr.name ASC;
    
    RETURN COALESCE(result, '{}'::jsonb[]);
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA rpc TO authenticated;
GRANT EXECUTE ON FUNCTION rpc.get_all_applications_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc.get_all_organizations_direct() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc.get_all_custom_roles_direct() TO authenticated; 