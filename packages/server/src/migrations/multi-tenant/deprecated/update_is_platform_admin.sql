-- Update the is_platform_admin() function to match the new RLS policy
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN (auth.jwt() ->> 'platform_admin')::boolean = true;
END;
$function$; 