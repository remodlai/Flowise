-- Update RLS policies to use our new authorize functions
-- This script updates policies for key tables in the system

-- =============================================
-- Applications Table Policies
-- =============================================

-- First, ensure RLS is enabled
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Platform admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Users can view applications they have access to" ON public.applications;
DROP POLICY IF EXISTS "Platform admins can manage all applications" ON public.applications;
DROP POLICY IF EXISTS "Application owners can manage their applications" ON public.applications;

-- Create new policies using our authorize functions
CREATE POLICY "Allow users with app.view permission" 
ON public.applications FOR SELECT 
USING (public.authorize('app.view'));

CREATE POLICY "Allow users with app.create permission" 
ON public.applications FOR INSERT 
WITH CHECK (public.authorize('app.create'));

CREATE POLICY "Allow users with app.edit permission" 
ON public.applications FOR UPDATE 
USING (public.authorize_resource('app.edit', 'application', id))
WITH CHECK (public.authorize_resource('app.edit', 'application', id));

CREATE POLICY "Allow users with app.delete permission" 
ON public.applications FOR DELETE 
USING (public.authorize_resource('app.delete', 'application', id));

-- =============================================
-- Application Folders Table Policies
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.application_folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Platform admins can view all folders" ON public.application_folders;
DROP POLICY IF EXISTS "Users can view folders of applications they have access to" ON public.application_folders;
DROP POLICY IF EXISTS "Platform admins can manage all folders" ON public.application_folders;
DROP POLICY IF EXISTS "Application managers can manage folders" ON public.application_folders;

-- Create new policies
CREATE POLICY "Allow users with folder.view permission" 
ON public.application_folders FOR SELECT 
USING (public.authorize_resource('folder.view', 'application', application_id));

CREATE POLICY "Allow users with folder.create permission" 
ON public.application_folders FOR INSERT 
WITH CHECK (public.authorize_resource('folder.create', 'application', application_id));

CREATE POLICY "Allow users with folder.edit permission" 
ON public.application_folders FOR UPDATE 
USING (public.authorize_resource('folder.edit', 'application', application_id))
WITH CHECK (public.authorize_resource('folder.edit', 'application', application_id));

CREATE POLICY "Allow users with folder.delete permission" 
ON public.application_folders FOR DELETE 
USING (public.authorize_resource('folder.delete', 'application', application_id));

-- =============================================
-- Application Chatflows Table Policies
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.application_chatflows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Platform admins can view all chatflows" ON public.application_chatflows;
DROP POLICY IF EXISTS "Users can view chatflows of applications they have access to" ON public.application_chatflows;
DROP POLICY IF EXISTS "Platform admins can manage all chatflows" ON public.application_chatflows;
DROP POLICY IF EXISTS "Application managers can manage chatflows" ON public.application_chatflows;

-- Create new policies
CREATE POLICY "Allow users with chatflow.view permission" 
ON public.application_chatflows FOR SELECT 
USING (public.authorize_resource('chatflow.view', 'application', application_id));

CREATE POLICY "Allow users with chatflow.create permission" 
ON public.application_chatflows FOR INSERT 
WITH CHECK (public.authorize_resource('chatflow.create', 'application', application_id));

CREATE POLICY "Allow users with chatflow.edit permission" 
ON public.application_chatflows FOR UPDATE 
USING (public.authorize_resource('chatflow.edit', 'application', application_id))
WITH CHECK (public.authorize_resource('chatflow.edit', 'application', application_id));

CREATE POLICY "Allow users with chatflow.delete permission" 
ON public.application_chatflows FOR DELETE 
USING (public.authorize_resource('chatflow.delete', 'application', application_id));

-- =============================================
-- Organizations Table Policies
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Platform admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Platform admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization admins can manage their organization" ON public.organizations;

-- Create new policies
CREATE POLICY "Allow users with org.view permission" 
ON public.organizations FOR SELECT 
USING (public.authorize('org.view'));

CREATE POLICY "Allow users with org.create permission" 
ON public.organizations FOR INSERT 
WITH CHECK (public.authorize('org.create'));

CREATE POLICY "Allow users with org.edit permission" 
ON public.organizations FOR UPDATE 
USING (public.authorize_resource('org.edit', 'organization', id))
WITH CHECK (public.authorize_resource('org.edit', 'organization', id));

CREATE POLICY "Allow users with org.delete permission" 
ON public.organizations FOR DELETE 
USING (public.authorize_resource('org.delete', 'organization', id)); 