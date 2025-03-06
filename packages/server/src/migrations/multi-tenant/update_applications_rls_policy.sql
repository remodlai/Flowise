-- Update the RLS policy for platform admins to use the platform_admin claim
DROP POLICY IF EXISTS "Platform admins can manage all applications" ON public.applications;

CREATE POLICY "Platform admins can manage all applications"  ON public.applications for alter to authenticated using ( (SELECT authorize('')))
