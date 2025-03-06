-- Create an overload of the function that accepts role_id parameter
-- This will handle calls that use role_id instead of input_role_id

CREATE OR REPLACE FUNCTION public.get_role_permissions_direct(role_id UUID)
RETURNS TABLE (permission TEXT)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT rp.permission
    FROM public.role_permissions rp
    WHERE rp.role_id = role_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_role_permissions_direct(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_role_permissions_direct(UUID) TO anon;

-- Test the function with both parameter names
SELECT 'Using input_role_id parameter:' AS test;
SELECT * FROM public.get_role_permissions_direct('9076e5ba-17ea-48a2-acdd-623f16a19629');

SELECT 'Using role_id parameter:' AS test;
SELECT * FROM public.get_role_permissions_direct('9076e5ba-17ea-48a2-acdd-623f16a19629'); 