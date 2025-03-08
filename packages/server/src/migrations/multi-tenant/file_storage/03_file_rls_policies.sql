-- File RLS Policies Migration
-- This migration adds Row Level Security policies to the files table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform admins can access all files" ON public.files;
DROP POLICY IF EXISTS "Users can access their own files" ON public.files;
DROP POLICY IF EXISTS "Users can access organization files" ON public.files;
DROP POLICY IF EXISTS "Users can access application files" ON public.files;
DROP POLICY IF EXISTS "Anyone can access public files" ON public.files;

-- Platform admins can access all files
CREATE POLICY "Platform admins can access all files" 
ON public.files
FOR ALL
TO authenticated
USING (public.authorize('platform.admin'));

-- Users can access their own files
CREATE POLICY "Users can access their own files" 
ON public.files
FOR ALL
TO authenticated
USING (created_by = auth.uid());

-- Users can access files shared with their organization
CREATE POLICY "Users can access organization files" 
ON public.files
FOR SELECT
TO authenticated
USING (
  context_type = 'organization' 
  AND access_level IN ('shared', 'public')
  AND public.authorize_resource('file.read', 'organization', context_id)
);

-- Users can access files shared with their application
CREATE POLICY "Users can access application files" 
ON public.files
FOR SELECT
TO authenticated
USING (
  context_type = 'application' 
  AND access_level IN ('shared', 'public')
  AND public.authorize_resource('file.read', 'application', context_id)
);

-- Anyone can access public files
CREATE POLICY "Anyone can access public files" 
ON public.files
FOR SELECT
TO authenticated, anon
USING (
  is_public = true 
  AND access_level = 'public'
); 