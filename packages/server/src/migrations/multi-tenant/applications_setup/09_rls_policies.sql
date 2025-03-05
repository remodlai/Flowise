-- Enable Row Level Security on all tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_runs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is a platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role') = 'platform_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a user belongs to an organization
CREATE OR REPLACE FUNCTION user_belongs_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_users
        WHERE user_id = auth.uid() AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a user has access to an application
CREATE OR REPLACE FUNCTION user_has_application_access(app_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organizations o
        JOIN public.organization_users ou ON o.id = ou.organization_id
        WHERE ou.user_id = auth.uid() AND o.application_id = app_id
    ) OR is_platform_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applications table policies
CREATE POLICY "Platform admins can manage all applications"
ON public.applications
USING (is_platform_admin());

CREATE POLICY "Users can view applications they have access to"
ON public.applications
FOR SELECT
USING (user_has_application_access(id));

-- Application settings policies
CREATE POLICY "Platform admins can manage all application settings"
ON public.application_settings
USING (is_platform_admin());

CREATE POLICY "Users can view application settings they have access to"
ON public.application_settings
FOR SELECT
USING (user_has_application_access(application_id));

-- Application stats policies
CREATE POLICY "Platform admins can manage all application stats"
ON public.application_stats
USING (is_platform_admin());

CREATE POLICY "Users can view application stats they have access to"
ON public.application_stats
FOR SELECT
USING (user_has_application_access(application_id));

-- Application billing plans policies
CREATE POLICY "Platform admins can manage all billing plans"
ON public.application_billing_plans
USING (is_platform_admin());

CREATE POLICY "Users can view billing plans they have access to"
ON public.application_billing_plans
FOR SELECT
USING (user_has_application_access(application_id));

-- Application API keys policies
CREATE POLICY "Platform admins can manage all API keys"
ON public.application_api_keys
USING (is_platform_admin());

CREATE POLICY "Users can manage API keys for their organizations"
ON public.application_api_keys
USING (
    user_has_application_access(application_id) AND
    (organization_id IS NULL OR user_belongs_to_organization(organization_id))
);

-- Chat sessions policies
CREATE POLICY "Platform admins can manage all chat sessions"
ON public.chat_sessions
USING (is_platform_admin());

CREATE POLICY "Users can manage their own chat sessions"
ON public.chat_sessions
USING (
    user_id = auth.uid() OR
    (user_has_application_access(application_id) AND
     (organization_id IS NULL OR user_belongs_to_organization(organization_id)))
);

-- Flow runs policies
CREATE POLICY "Platform admins can manage all flow runs"
ON public.flow_runs
USING (is_platform_admin());

CREATE POLICY "Users can view flow runs they have access to"
ON public.flow_runs
FOR SELECT
USING (
    user_id = auth.uid() OR
    (user_has_application_access(application_id) AND
     (organization_id IS NULL OR user_belongs_to_organization(organization_id)))
);

CREATE POLICY "Users can create flow runs for applications they have access to"
ON public.flow_runs
FOR INSERT
WITH CHECK (
    user_has_application_access(application_id) AND
    (organization_id IS NULL OR user_belongs_to_organization(organization_id))
);

CREATE POLICY "Users can update their own flow runs"
ON public.flow_runs
FOR UPDATE
USING (user_id = auth.uid());

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION user_belongs_to_organization(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_application_access(UUID) TO authenticated; 