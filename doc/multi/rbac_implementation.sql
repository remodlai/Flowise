-- RBAC Implementation for Remodl Platform
-- This file contains the SQL needed to implement role-based access control

-- =============================================
-- 1. Create Schema for Role-Based Access Control
-- =============================================

-- Create schema for role-based access control functions
CREATE SCHEMA IF NOT EXISTS rpc;

-- =============================================
-- 2. Create Tables for Applications, Organizations, and User Roles
-- =============================================

-- Applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- 'platform', 'application', or 'organization'
    resource_id UUID, -- NULL for platform-level roles
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role, resource_type, resource_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_resource ON public.user_roles(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_organizations_application_id ON public.organizations(application_id);

-- =============================================
-- 3. Create RPC Functions for Role Checking
-- =============================================

-- Function to check if a user is a platform admin
CREATE OR REPLACE FUNCTION rpc.is_platform_admin()
RETURNS TABLE (uid UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT user_id FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND resource_type = 'platform';
END;
$$;

-- Function to check if a user is an app owner
CREATE OR REPLACE FUNCTION rpc.is_app_owner(app_id UUID)
RETURNS TABLE (uid UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT user_id FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'owner'
    AND resource_type = 'application'
    AND resource_id = app_id;
END;
$$;

-- Function to check if a user has access to an app
CREATE OR REPLACE FUNCTION rpc.user_has_app_access(app_id UUID)
RETURNS TABLE (uid UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- User has access if they are a platform admin
    IF EXISTS (SELECT 1 FROM rpc.is_platform_admin()) THEN
        RETURN QUERY SELECT auth.uid();
    ELSE
        -- User has access if they have any role for the app
        RETURN QUERY
        SELECT user_id FROM public.user_roles
        WHERE user_id = auth.uid()
        AND resource_type = 'application'
        AND resource_id = app_id;
    END IF;
END;
$$;

-- Function to check if a user is an org admin
CREATE OR REPLACE FUNCTION rpc.is_org_admin(org_id UUID)
RETURNS TABLE (uid UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Platform admins are considered org admins for all orgs
    IF EXISTS (SELECT 1 FROM rpc.is_platform_admin()) THEN
        RETURN QUERY SELECT auth.uid();
    ELSE
        -- Check if user has the admin role for this org
        RETURN QUERY
        SELECT user_id FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND resource_type = 'organization'
        AND resource_id = org_id;
    END IF;
END;
$$;

-- Function to check if a user is in an organization
CREATE OR REPLACE FUNCTION rpc.user_in_organization(org_id UUID)
RETURNS TABLE (uid UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Platform admins are considered members of all orgs
    IF EXISTS (SELECT 1 FROM rpc.is_platform_admin()) THEN
        RETURN QUERY SELECT auth.uid();
    ELSE
        -- Check if user has any role for this org
        RETURN QUERY
        SELECT user_id FROM public.user_roles
        WHERE user_id = auth.uid()
        AND resource_type = 'organization'
        AND resource_id = org_id;
    END IF;
END;
$$;

-- Function to check if a user has access to a file
CREATE OR REPLACE FUNCTION rpc.user_has_file_access(file_path TEXT)
RETURNS TABLE (uid UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For now, just return the user's ID if they're authenticated
    -- This can be expanded later to check file sharing permissions
    RETURN QUERY SELECT auth.uid();
END;
$$;

-- =============================================
-- 4. Create Custom Access Token Hook
-- =============================================

-- Function to get all user roles
CREATE OR REPLACE FUNCTION rpc.get_user_roles(user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    platform_roles jsonb;
    app_roles jsonb;
    org_roles jsonb;
    all_roles jsonb;
BEGIN
    -- Get platform roles
    SELECT jsonb_agg(jsonb_build_object('role', role))
    INTO platform_roles
    FROM public.user_roles
    WHERE user_roles.user_id = get_user_roles.user_id
    AND resource_type = 'platform';
    
    -- Get application roles
    SELECT jsonb_agg(jsonb_build_object(
        'role', role,
        'application_id', resource_id
    ))
    INTO app_roles
    FROM public.user_roles
    WHERE user_roles.user_id = get_user_roles.user_id
    AND resource_type = 'application';
    
    -- Get organization roles
    SELECT jsonb_agg(jsonb_build_object(
        'role', role,
        'organization_id', resource_id,
        'application_id', (
            SELECT application_id 
            FROM public.organizations 
            WHERE id = resource_id
        )
    ))
    INTO org_roles
    FROM public.user_roles
    WHERE user_roles.user_id = get_user_roles.user_id
    AND resource_type = 'organization';
    
    -- Combine all roles
    all_roles = jsonb_build_object(
        'platform', COALESCE(platform_roles, '[]'::jsonb),
        'applications', COALESCE(app_roles, '[]'::jsonb),
        'organizations', COALESCE(org_roles, '[]'::jsonb)
    );
    
    RETURN all_roles;
END;
$$;

-- Custom access token hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
    original_claims jsonb;
    new_claims jsonb;
    user_roles jsonb;
    is_admin boolean;
BEGIN
    user_id = (event->>'user_id')::uuid;
    original_claims = event->'claims';
    
    -- Start with the original claims
    new_claims = original_claims;
    
    -- Get all user roles
    user_roles = rpc.get_user_roles(user_id);
    
    -- Check if user is a platform admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = custom_access_token_hook.user_id
        AND role = 'admin'
        AND resource_type = 'platform'
    ) INTO is_admin;
    
    -- Add custom claims
    new_claims = jsonb_set(new_claims, '{app_metadata}', jsonb_build_object(
        'roles', user_roles,
        'is_platform_admin', is_admin
    ));
    
    -- Return the updated claims
    RETURN jsonb_build_object('claims', new_claims);
END;
$$;

-- =============================================
-- 5. Create Helper Functions for User Management
-- =============================================

-- Function to assign a role to a user
CREATE OR REPLACE FUNCTION public.assign_role(
    p_user_id UUID,
    p_role TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_id UUID;
BEGIN
    -- Validate resource type
    IF p_resource_type NOT IN ('platform', 'application', 'organization') THEN
        RAISE EXCEPTION 'Invalid resource type: %', p_resource_type;
    END IF;
    
    -- Validate resource ID for non-platform resources
    IF p_resource_type != 'platform' AND p_resource_id IS NULL THEN
        RAISE EXCEPTION 'Resource ID is required for % resources', p_resource_type;
    END IF;
    
    -- Insert or update the role
    INSERT INTO public.user_roles (user_id, role, resource_type, resource_id)
    VALUES (p_user_id, p_role, p_resource_type, p_resource_id)
    ON CONFLICT (user_id, role, resource_type, resource_id)
    DO UPDATE SET updated_at = now()
    RETURNING id INTO role_id;
    
    RETURN role_id;
END;
$$;

-- Function to remove a role from a user
CREATE OR REPLACE FUNCTION public.remove_role(
    p_user_id UUID,
    p_role TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = p_role
    AND resource_type = p_resource_type
    AND (
        (p_resource_id IS NULL AND resource_id IS NULL) OR
        resource_id = p_resource_id
    )
    RETURNING 1 INTO rows_deleted;
    
    RETURN rows_deleted > 0;
END;
$$;

-- =============================================
-- 6. Create RLS Policies for Tables
-- =============================================

-- Enable RLS on tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Applications policies
CREATE POLICY "Platform admins can do anything with applications"
ON public.applications
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()))
WITH CHECK (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

CREATE POLICY "App owners can view their applications"
ON public.applications
FOR SELECT
USING (EXISTS (SELECT 1 FROM rpc.is_app_owner(id)));

-- Organizations policies
CREATE POLICY "Platform admins can do anything with organizations"
ON public.organizations
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()))
WITH CHECK (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

CREATE POLICY "App owners can view organizations in their app"
ON public.organizations
FOR SELECT
USING (EXISTS (SELECT 1 FROM rpc.is_app_owner(application_id)));

CREATE POLICY "Org members can view their organization"
ON public.organizations
FOR SELECT
USING (EXISTS (SELECT 1 FROM rpc.user_in_organization(id)));

CREATE POLICY "Org admins can update their organization"
ON public.organizations
FOR UPDATE
USING (EXISTS (SELECT 1 FROM rpc.is_org_admin(id)))
WITH CHECK (EXISTS (SELECT 1 FROM rpc.is_org_admin(id)));

-- User roles policies
CREATE POLICY "Platform admins can do anything with user roles"
ON public.user_roles
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()))
WITH CHECK (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

CREATE POLICY "App owners can manage roles for their app"
ON public.user_roles
USING (
    resource_type = 'application' AND
    EXISTS (SELECT 1 FROM rpc.is_app_owner(resource_id))
)
WITH CHECK (
    resource_type = 'application' AND
    EXISTS (SELECT 1 FROM rpc.is_app_owner(resource_id))
);

CREATE POLICY "Org admins can manage roles for their org"
ON public.user_roles
USING (
    resource_type = 'organization' AND
    EXISTS (SELECT 1 FROM rpc.is_org_admin(resource_id))
)
WITH CHECK (
    resource_type = 'organization' AND
    EXISTS (SELECT 1 FROM rpc.is_org_admin(resource_id))
);

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- =============================================
-- 7. Create Initial Platform Admin
-- =============================================

-- This function creates the first platform admin
-- Call this after creating your first user
CREATE OR REPLACE FUNCTION public.create_initial_platform_admin(admin_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_id UUID;
    role_id UUID;
BEGIN
    -- Get the user ID from the email
    SELECT id INTO admin_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No user found with email %', admin_email;
    END IF;
    
    -- Assign platform admin role
    SELECT public.assign_role(admin_id, 'admin', 'platform') INTO role_id;
    
    RETURN admin_id;
END;
$$;

-- Example usage:
-- SELECT public.create_initial_platform_admin('admin@example.com'); 