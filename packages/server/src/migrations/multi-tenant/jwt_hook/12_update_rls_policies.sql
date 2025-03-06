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
-- View policy (SELECT)
CREATE POLICY "Platform admins can view all applications" 
ON public.applications FOR SELECT 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Users can view applications they have access to" 
ON public.applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = id
  )
);

-- Insert policy
CREATE POLICY "Platform admins can create applications" 
ON public.applications FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

-- Update policy
CREATE POLICY "Platform admins can update all applications" 
ON public.applications FOR UPDATE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true)
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Users can update applications they manage" 
ON public.applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner')
  )
);

-- Delete policy
CREATE POLICY "Platform admins can delete applications" 
ON public.applications FOR DELETE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

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
CREATE POLICY "Platform admins can view all folders" 
ON public.application_folders FOR SELECT 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Users can view folders of applications they have access to" 
ON public.application_folders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id
  )
);

-- Insert policy
CREATE POLICY "Platform admins can create folders" 
ON public.application_folders FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Application managers can create folders" 
ON public.application_folders FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner', 'application_editor')
  )
);

-- Update policy
CREATE POLICY "Platform admins can update all folders" 
ON public.application_folders FOR UPDATE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true)
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Application managers can update folders" 
ON public.application_folders FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner', 'application_editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner', 'application_editor')
  )
);

-- Delete policy
CREATE POLICY "Platform admins can delete folders" 
ON public.application_folders FOR DELETE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Application managers can delete folders" 
ON public.application_folders FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner')
  )
);

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
CREATE POLICY "Platform admins can view all chatflows" 
ON public.application_chatflows FOR SELECT 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Users can view chatflows of applications they have access to" 
ON public.application_chatflows FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id
  )
);

-- Insert policy
CREATE POLICY "Platform admins can create chatflows" 
ON public.application_chatflows FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Application managers can create chatflows" 
ON public.application_chatflows FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner', 'application_editor')
  )
);

-- Update policy
CREATE POLICY "Platform admins can update all chatflows" 
ON public.application_chatflows FOR UPDATE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true)
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Application managers can update chatflows" 
ON public.application_chatflows FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner', 'application_editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner', 'application_editor')
  )
);

-- Delete policy
CREATE POLICY "Platform admins can delete chatflows" 
ON public.application_chatflows FOR DELETE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Application managers can delete chatflows" 
ON public.application_chatflows FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'application' AND 
      (jr ->> 'resource_id')::uuid = application_id AND
      (jr ->> 'role')::text IN ('application_admin', 'application_owner')
  )
);

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
CREATE POLICY "Platform admins can view all organizations" 
ON public.organizations FOR SELECT 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'organization' AND 
      (jr ->> 'resource_id')::uuid = id
  )
);

-- Insert policy
CREATE POLICY "Platform admins can create organizations" 
ON public.organizations FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

-- Update policy
CREATE POLICY "Platform admins can update all organizations" 
ON public.organizations FOR UPDATE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true)
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Organization admins can update their organization" 
ON public.organizations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'organization' AND 
      (jr ->> 'resource_id')::uuid = id AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'organization' AND 
      (jr ->> 'resource_id')::uuid = id AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
);

-- Delete policy
CREATE POLICY "Platform admins can delete organizations" 
ON public.organizations FOR DELETE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

-- =============================================
-- User Profiles Table Policies
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Platform admins can manage all profiles" ON public.user_profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Platform admins can view all profiles" 
ON public.user_profiles FOR SELECT 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Organization admins can view profiles in their organization" 
ON public.user_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'organization' AND 
      (jr ->> 'resource_id')::uuid = organization_id AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
);

-- Update policy
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Platform admins can update all profiles" 
ON public.user_profiles FOR UPDATE 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true)
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Organization admins can update profiles in their organization" 
ON public.user_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'organization' AND 
      (jr ->> 'resource_id')::uuid = organization_id AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr
    WHERE 
      (jr ->> 'resource_type')::text = 'organization' AND 
      (jr ->> 'resource_id')::uuid = organization_id AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
);

-- =============================================
-- User Roles Table Policies
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Platform admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Organization admins can manage roles in their organization" ON public.user_roles;

-- Create new policies
CREATE POLICY "Platform admins can view all user roles" 
ON public.user_roles FOR SELECT 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view roles in their organization" 
ON public.user_roles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr 
    ON up.organization_id = (jr ->> 'resource_id')::uuid
    WHERE 
      up.user_id = user_roles.user_id AND
      (jr ->> 'resource_type')::text = 'organization' AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
);

-- Insert/Update/Delete policies
CREATE POLICY "Platform admins can manage all user roles" 
ON public.user_roles FOR ALL 
USING ((auth.jwt() ->> 'is_platform_admin')::boolean = true)
WITH CHECK ((auth.jwt() ->> 'is_platform_admin')::boolean = true);

CREATE POLICY "Organization admins can manage roles in their organization" 
ON public.user_roles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr 
    ON up.organization_id = (jr ->> 'resource_id')::uuid
    WHERE 
      up.user_id = user_roles.user_id AND
      (jr ->> 'resource_type')::text = 'organization' AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN jsonb_array_elements(auth.jwt() -> 'user_roles') AS jr 
    ON up.organization_id = (jr ->> 'resource_id')::uuid
    WHERE 
      up.user_id = user_roles.user_id AND
      (jr ->> 'resource_type')::text = 'organization' AND
      (jr ->> 'role')::text IN ('organization_admin', 'organization_owner')
  )
); 