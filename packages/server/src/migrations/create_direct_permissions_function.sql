-- Create a function to directly fetch role permissions
-- This bypasses RLS policies

CREATE OR REPLACE FUNCTION public.get_role_permissions_direct(input_role_id UUID)
RETURNS TABLE (permission TEXT)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT rp.permission
    FROM public.role_permissions rp
    WHERE rp.role_id = input_role_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_role_permissions_direct(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_role_permissions_direct(UUID) TO anon;

-- Test the function
SELECT * FROM public.get_role_permissions_direct('9076e5ba-17ea-48a2-acdd-623f16a19629'); 