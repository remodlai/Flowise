-- Fix user_roles view to include entity_id column
-- This script updates the user_roles view to map resource_id to entity_id

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.user_roles;

-- Create the updated view
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
    ucr.id,
    ucr.user_id,
    cr.name AS role,
    ucr.resource_id AS entity_id,
    ucr.resource_type AS entity_type,
    ucr.created_at,
    ucr.updated_at
FROM 
    public.user_custom_roles ucr
JOIN 
    public.custom_roles cr ON ucr.custom_role_id = cr.id;

-- Grant permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO service_role;

-- Test the view
SELECT * FROM public.user_roles LIMIT 5; 