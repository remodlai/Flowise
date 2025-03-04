-- Role Builder System Migration
-- This migration creates the necessary tables for the dynamic role builder system
CREATE SCHEMA IF NOT EXISTS rpc;
-- Create tables for custom roles
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_role TEXT, -- Optional reference to a system role this extends
    context_type TEXT NOT NULL, -- 'platform', 'application', or 'organization'
    context_id UUID, -- NULL for platform-level roles
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name, context_type, context_id)
);

-- Create table for role permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL, -- The permission identifier
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(role_id, permission)
);

-- Create table for user custom roles
CREATE TABLE IF NOT EXISTS public.user_custom_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role_id)
);

-- Create table for permission categories
CREATE TABLE IF NOT EXISTS public.permission_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name)
);

-- Create table for permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES public.permission_categories(id),
    context_types TEXT[] NOT NULL, -- Array of contexts where this permission is applicable
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(name)
);
CREATE OR REPLACE FUNCTION rpc.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND resource_type = 'platform'
    );
END;
$$;

CREATE OR REPLACE FUNCTION rpc.is_app_owner(app_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND resource_type = 'application'
        AND resource_id = app_id
    );
END;
$$;

CREATE OR REPLACE FUNCTION rpc.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND resource_type = 'organization'
        AND resource_id = org_id
    );
END;
$$;
-- Enable RLS on all tables
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_roles table
-- Platform admins can do anything
CREATE POLICY "Platform admins can do anything with custom roles"
ON public.custom_roles
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

-- App owners can manage custom roles for their app
CREATE POLICY "App owners can manage custom roles for their app"
ON public.custom_roles
USING (
    context_type = 'application' AND
    EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))
)
WITH CHECK (
    context_type = 'application' AND
    EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))
);

-- Org admins can manage custom roles for their org
CREATE POLICY "Org admins can manage custom roles for their org"
ON public.custom_roles
USING (
    context_type = 'organization' AND
    EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id))
)
WITH CHECK (
    context_type = 'organization' AND
    EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id))
);

-- Users can view roles they have been assigned
CREATE POLICY "Users can view roles they have been assigned"
ON public.custom_roles
FOR SELECT
USING (
    id IN (
        SELECT role_id FROM public.user_custom_roles
        WHERE user_id = auth.uid()
    )
);

-- Create RLS policies for role_permissions table
-- Platform admins can do anything
CREATE POLICY "Platform admins can do anything with role permissions"
ON public.role_permissions
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

-- Users can manage permissions for roles they can manage
CREATE POLICY "Users can manage permissions for roles they can manage"
ON public.role_permissions
USING (
    role_id IN (
        SELECT id FROM public.custom_roles
        WHERE (
            (context_type = 'application' AND EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))) OR
            (context_type = 'organization' AND EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id)))
        )
    )
)
WITH CHECK (
    role_id IN (
        SELECT id FROM public.custom_roles
        WHERE (
            (context_type = 'application' AND EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))) OR
            (context_type = 'organization' AND EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id)))
        )
    )
);

-- Users can view permissions for roles they can view
CREATE POLICY "Users can view permissions for roles they can view"
ON public.role_permissions
FOR SELECT
USING (
    role_id IN (
        SELECT id FROM public.custom_roles
    )
);

-- Create RLS policies for user_custom_roles table
-- Platform admins can do anything
CREATE POLICY "Platform admins can do anything with user custom roles"
ON public.user_custom_roles
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

-- App owners can assign app-level roles
CREATE POLICY "App owners can assign app-level roles"
ON public.user_custom_roles
USING (
    role_id IN (
        SELECT id FROM public.custom_roles
        WHERE context_type = 'application' AND EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))
    )
)
WITH CHECK (
    role_id IN (
        SELECT id FROM public.custom_roles
        WHERE context_type = 'application' AND EXISTS (SELECT 1 FROM rpc.is_app_owner(context_id))
    )
);

-- Org admins can assign org-level roles
CREATE POLICY "Org admins can assign org-level roles"
ON public.user_custom_roles
USING (
    role_id IN (
        SELECT id FROM public.custom_roles
        WHERE context_type = 'organization' AND EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id))
    )
)
WITH CHECK (
    role_id IN (
        SELECT id FROM public.custom_roles
        WHERE context_type = 'organization' AND EXISTS (SELECT 1 FROM rpc.is_org_admin(context_id))
    )
);

-- Users can view their own role assignments
CREATE POLICY "Users can view their own role assignments"
ON public.user_custom_roles
FOR SELECT
USING (user_id = auth.uid());

-- Create RLS policies for permission_categories table
-- Everyone can view permission categories
CREATE POLICY "Everyone can view permission categories"
ON public.permission_categories
FOR SELECT
TO authenticated
USING (true);

-- Only platform admins can manage permission categories
CREATE POLICY "Only platform admins can manage permission categories"
ON public.permission_categories
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()))
WITH CHECK (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

-- Create RLS policies for permissions table
-- Everyone can view permissions
CREATE POLICY "Everyone can view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

-- Only platform admins can manage permissions
CREATE POLICY "Only platform admins can manage permissions"
ON public.permissions
USING (EXISTS (SELECT 1 FROM rpc.is_platform_admin()))
WITH CHECK (EXISTS (SELECT 1 FROM rpc.is_platform_admin()));

-- Create RPC functions for custom roles

-- Function to get user custom roles
CREATE OR REPLACE FUNCTION rpc.get_user_custom_roles(user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    platform_custom_roles jsonb = '[]'::jsonb;
    app_custom_roles jsonb = '[]'::jsonb;
    org_custom_roles jsonb = '[]'::jsonb;
    all_custom_roles jsonb;
BEGIN
    -- Get platform-level custom roles
    SELECT jsonb_agg(jsonb_build_object(
        'id', cr.id,
        'name', cr.name,
        'permissions', (
            SELECT jsonb_agg(rp.permission)
            FROM public.role_permissions rp
            WHERE rp.role_id = cr.id
        )
    ))
    INTO platform_custom_roles
    FROM public.custom_roles cr
    JOIN public.user_custom_roles ucr ON cr.id = ucr.role_id
    WHERE ucr.user_id = get_user_custom_roles.user_id
    AND cr.context_type = 'platform';
    
    -- Get application-level custom roles
    SELECT jsonb_agg(jsonb_build_object(
        'id', cr.id,
        'name', cr.name,
        'context_id', cr.context_id,
        'permissions', (
            SELECT jsonb_agg(rp.permission)
            FROM public.role_permissions rp
            WHERE rp.role_id = cr.id
        )
    ))
    INTO app_custom_roles
    FROM public.custom_roles cr
    JOIN public.user_custom_roles ucr ON cr.id = ucr.role_id
    WHERE ucr.user_id = get_user_custom_roles.user_id
    AND cr.context_type = 'application';
    
    -- Get organization-level custom roles
    SELECT jsonb_agg(jsonb_build_object(
        'id', cr.id,
        'name', cr.name,
        'context_id', cr.context_id,
        'permissions', (
            SELECT jsonb_agg(rp.permission)
            FROM public.role_permissions rp
            WHERE rp.role_id = cr.id
        )
    ))
    INTO org_custom_roles
    FROM public.custom_roles cr
    JOIN public.user_custom_roles ucr ON cr.id = ucr.role_id
    WHERE ucr.user_id = get_user_custom_roles.user_id
    AND cr.context_type = 'organization';
    
    -- Handle null cases
    IF platform_custom_roles IS NULL THEN
        platform_custom_roles = '[]'::jsonb;
    END IF;
    
    IF app_custom_roles IS NULL THEN
        app_custom_roles = '[]'::jsonb;
    END IF;
    
    IF org_custom_roles IS NULL THEN
        org_custom_roles = '[]'::jsonb;
    END IF;
    
    -- Combine all roles
    all_custom_roles = jsonb_build_object(
        'platform', platform_custom_roles,
        'applications', app_custom_roles,
        'organizations', org_custom_roles
    );
    
    RETURN all_custom_roles;
END;
$$;

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION rpc.user_has_permission(
    p_user_id UUID,
    p_permission TEXT,
    p_context_type TEXT DEFAULT NULL,
    p_context_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_permission BOOLEAN;
BEGIN
    -- Check if user is platform admin (has all permissions)
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id
        AND role = 'admin'
        AND resource_type = 'platform'
    ) INTO has_permission;
    
    IF has_permission THEN
        RETURN TRUE;
    END IF;
    
    -- Check standard roles first
    -- This would check against the predefined role-permission mappings
    -- Implementation depends on how standard roles are mapped to permissions
    
    -- Then check custom roles
    SELECT EXISTS (
        SELECT 1
        FROM public.user_custom_roles ucr
        JOIN public.custom_roles cr ON ucr.role_id = cr.id
        JOIN public.role_permissions rp ON cr.id = rp.role_id
        WHERE ucr.user_id = p_user_id
        AND rp.permission = p_permission
        AND (
            -- Match context if provided
            (p_context_type IS NOT NULL AND cr.context_type = p_context_type AND 
             (p_context_id IS NULL OR cr.context_id = p_context_id))
            OR
            -- Platform roles apply everywhere
            (cr.context_type = 'platform')
            OR
            -- App roles apply to the app and all its orgs
            (cr.context_type = 'application' AND p_context_type = 'organization' AND
             EXISTS (
                 SELECT 1 FROM public.organizations
                 WHERE id = p_context_id AND application_id = cr.context_id
             ))
        )
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- Function to create a custom role
CREATE OR REPLACE FUNCTION public.create_custom_role(
    p_name TEXT,
    p_description TEXT,
    p_base_role TEXT,
    p_context_type TEXT,
    p_context_id UUID,
    p_permissions TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_id UUID;
    permission TEXT;
BEGIN
    -- Validate context type
    IF p_context_type NOT IN ('platform', 'application', 'organization') THEN
        RAISE EXCEPTION 'Invalid context type: %', p_context_type;
    END IF;
    
    -- Validate context ID for non-platform contexts
    IF p_context_type != 'platform' AND p_context_id IS NULL THEN
        RAISE EXCEPTION 'Context ID is required for % contexts', p_context_type;
    END IF;
    
    -- Create the custom role
    INSERT INTO public.custom_roles (
        name, description, base_role, context_type, context_id, created_by
    )
    VALUES (
        p_name, p_description, p_base_role, p_context_type, p_context_id, auth.uid()
    )
    RETURNING id INTO role_id;
    
    -- Add permissions to the role
    FOREACH permission IN ARRAY p_permissions
    LOOP
        INSERT INTO public.role_permissions (role_id, permission)
        VALUES (role_id, permission);
    END LOOP;
    
    RETURN role_id;
END;
$$;

-- Function to assign a custom role to a user
CREATE OR REPLACE FUNCTION public.assign_custom_role(
    p_user_id UUID,
    p_role_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Insert the role assignment
    INSERT INTO public.user_custom_roles (user_id, role_id, created_by)
    VALUES (p_user_id, p_role_id, auth.uid())
    RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$;

-- Update the custom access token hook to include custom roles
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    original_claims jsonb;
    new_claims jsonb;
    user_roles jsonb;
    user_custom_roles jsonb;
    is_admin boolean;
BEGIN
    user_id = (event->>'user_id')::uuid;
    original_claims = event->'claims';
    
    -- Start with the original claims
    new_claims = original_claims;
    
    -- Get all user roles
    user_roles = rpc.get_user_roles(user_id);
    
    -- Get all custom roles
    user_custom_roles = rpc.get_user_custom_roles(user_id);
    
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
        'custom_roles', user_custom_roles,
        'is_platform_admin', is_admin
    ));
    
    -- Return the updated claims
    RETURN jsonb_build_object('claims', new_claims);
END;
$$;

INSERT INTO public.permission_categories (name, description) VALUES 
('Platform', 'Platform-level permissions'),
('Application', 'Application-level permissions'),
('Organization', 'Organization-level permissions'),
('Chatflow', 'Chatflow-related permissions'),
('Document', 'Document-related permissions'),
('Analytics', 'Analytics-related permissions'),
('Integration', 'Integration-related permissions'),
('Credential', 'Credential-related permissions'),
('User', 'User management permissions'),
('DocumentStore', 'Document store permissions'),
('VectorStore', 'Vector store permissions'),
('Image', 'Image-related permissions'),
('File', 'File-related permissions'),
('Billing', 'Billing-related permissions'),
('Payment', 'Payment-related permissions');

-- Get category IDs for seeding permissions
DO $$
DECLARE
    platform_cat_id UUID;
    app_cat_id UUID;
    org_cat_id UUID;
    chatflow_cat_id UUID;
    document_cat_id UUID;
    analytics_cat_id UUID;
    integration_cat_id UUID;
    credential_cat_id UUID;
    user_cat_id UUID;
    doc_store_cat_id UUID;
    vector_store_cat_id UUID;
    image_cat_id UUID;
    file_cat_id UUID;
    billing_cat_id UUID;
    payment_cat_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO platform_cat_id FROM public.permission_categories WHERE name = 'Platform';
    SELECT id INTO app_cat_id FROM public.permission_categories WHERE name = 'Application';
    SELECT id INTO org_cat_id FROM public.permission_categories WHERE name = 'Organization';
    SELECT id INTO chatflow_cat_id FROM public.permission_categories WHERE name = 'Chatflow';
    SELECT id INTO document_cat_id FROM public.permission_categories WHERE name = 'Document';
    SELECT id INTO analytics_cat_id FROM public.permission_categories WHERE name = 'Analytics';
    SELECT id INTO integration_cat_id FROM public.permission_categories WHERE name = 'Integration';
    SELECT id INTO credential_cat_id FROM public.permission_categories WHERE name = 'Credential';
    SELECT id INTO user_cat_id FROM public.permission_categories WHERE name = 'User';
    SELECT id INTO doc_store_cat_id FROM public.permission_categories WHERE name = 'DocumentStore';
    SELECT id INTO vector_store_cat_id FROM public.permission_categories WHERE name = 'VectorStore';
    SELECT id INTO image_cat_id FROM public.permission_categories WHERE name = 'Image';
    SELECT id INTO file_cat_id FROM public.permission_categories WHERE name = 'File';
    SELECT id INTO billing_cat_id FROM public.permission_categories WHERE name = 'Billing';
    SELECT id INTO payment_cat_id FROM public.permission_categories WHERE name = 'Payment';
    
    -- Seed platform permissions
    INSERT INTO public.permissions (name, description, category_id, context_types)
    VALUES 
    ('platform.view', 'View platform settings and metrics', platform_cat_id, ARRAY['platform']),
    ('platform.edit', 'Modify platform settings', platform_cat_id, ARRAY['platform']),
    ('platform.manage_users', 'Assign platform-level roles', platform_cat_id, ARRAY['platform']);
    
    -- Seed application permissions
    INSERT INTO public.permissions (name, description, category_id, context_types)
    VALUES 
    ('app.create', 'Create new applications', app_cat_id, ARRAY['platform']),
    ('app.view', 'View application details and metrics', app_cat_id, ARRAY['platform', 'application']),
    ('app.edit', 'Modify application settings', app_cat_id, ARRAY['platform', 'application']),
    ('app.delete', 'Delete applications', app_cat_id, ARRAY['platform']),
    ('app.manage_users', 'Manage users in applications', app_cat_id, ARRAY['platform', 'application']);
    
    -- Seed organization permissions
    INSERT INTO public.permissions (name, description, category_id, context_types)
    VALUES 
    ('org.create', 'Create new organizations', org_cat_id, ARRAY['platform', 'application']),
    ('org.view', 'View organization details', org_cat_id, ARRAY['platform', 'application', 'organization']),
    ('org.edit', 'Modify organization settings', org_cat_id, ARRAY['platform', 'application', 'organization']),
    ('org.delete', 'Delete organizations', org_cat_id, ARRAY['platform', 'application']),
    ('org.manage_users', 'Manage users in organizations', org_cat_id, ARRAY['platform', 'application', 'organization']);
    
    -- Seed chatflow permissions
    INSERT INTO public.permissions (name, description, category_id, context_types)
    VALUES 
    ('chatflow.create', 'Create new chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.view', 'View chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.edit', 'Edit chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.delete', 'Delete chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.deploy', 'Deploy chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.run', 'Run/execute chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.clone', 'Clone chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.export', 'Export chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']),
    ('chatflow.import', 'Import chatflows', chatflow_cat_id, ARRAY['platform', 'application', 'organization']);
    
  
END $$; 