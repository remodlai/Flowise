-- Create application_billing_plans table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_billing_plans') THEN
        CREATE TABLE public.application_billing_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL DEFAULT 0,
            interval TEXT DEFAULT 'monthly',
            feature_api_access BOOLEAN DEFAULT FALSE,
            feature_custom_domain BOOLEAN DEFAULT FALSE,
            feature_priority_support BOOLEAN DEFAULT FALSE,
            feature_advanced_analytics BOOLEAN DEFAULT FALSE,
            feature_unlimited_users BOOLEAN DEFAULT FALSE,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Create the updated_at trigger
        CREATE TRIGGER update_application_billing_plans_updated_at
        BEFORE UPDATE ON public.application_billing_plans
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create default billing plans for the Platform Sandbox application
DO $$
DECLARE
    sandbox_app_id UUID;
BEGIN
    -- Get the Platform Sandbox application ID
    SELECT id INTO sandbox_app_id FROM public.applications WHERE name = 'Platform Sandbox';
    
    -- Only proceed if we found the application and no plans exist for it
    IF sandbox_app_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.application_billing_plans WHERE application_id = sandbox_app_id
    ) THEN
        -- Create Free plan
        INSERT INTO public.application_billing_plans (
            application_id, name, description, price, interval,
            feature_api_access, feature_custom_domain, feature_priority_support,
            feature_advanced_analytics, feature_unlimited_users, is_default
        ) VALUES (
            sandbox_app_id, 'Free', 'Basic access to the platform', 0, 'monthly',
            TRUE, FALSE, FALSE, FALSE, FALSE, TRUE
        );
        
        -- Create Pro plan
        INSERT INTO public.application_billing_plans (
            application_id, name, description, price, interval,
            feature_api_access, feature_custom_domain, feature_priority_support,
            feature_advanced_analytics, feature_unlimited_users, is_default
        ) VALUES (
            sandbox_app_id, 'Pro', 'Advanced features for professionals', 49.99, 'monthly',
            TRUE, TRUE, TRUE, FALSE, FALSE, FALSE
        );
        
        -- Create Enterprise plan
        INSERT INTO public.application_billing_plans (
            application_id, name, description, price, interval,
            feature_api_access, feature_custom_domain, feature_priority_support,
            feature_advanced_analytics, feature_unlimited_users, is_default
        ) VALUES (
            sandbox_app_id, 'Enterprise', 'Full access to all features', 199.99, 'monthly',
            TRUE, TRUE, TRUE, TRUE, TRUE, FALSE
        );
    END IF;
END
$$;

-- Grant appropriate permissions
GRANT SELECT ON public.application_billing_plans TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.application_billing_plans TO authenticated; 