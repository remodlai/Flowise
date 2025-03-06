-- Update the is_platform_admin() function to use the platform_admin claim
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Check for the platform_admin claim in the JWT
    RETURN (auth.jwt() ->> 'platform_admin')::boolean = true;
END;
$function$; 