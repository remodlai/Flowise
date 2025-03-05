-- Create application_settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_settings') THEN
        CREATE TABLE public.application_settings (
            application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
            api_calls_daily_limit INTEGER DEFAULT 10000,
            api_calls_monthly_limit INTEGER DEFAULT 300000,
            storage_max_gb INTEGER DEFAULT 50,
            users_max_count INTEGER DEFAULT 25,
            file_uploads_enabled BOOLEAN DEFAULT TRUE,
            custom_domains_enabled BOOLEAN DEFAULT FALSE,
            sso_enabled BOOLEAN DEFAULT FALSE,
            api_access_enabled BOOLEAN DEFAULT TRUE,
            advanced_analytics_enabled BOOLEAN DEFAULT FALSE,
            enabled_models TEXT[] DEFAULT ARRAY['gpt-3.5-turbo', 'gpt-4'],
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Create the updated_at trigger
        CREATE TRIGGER update_application_settings_updated_at
        BEFORE UPDATE ON public.application_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create default settings for the Platform Sandbox application
INSERT INTO public.application_settings (
    application_id,
    api_calls_daily_limit,
    api_calls_monthly_limit,
    storage_max_gb,
    users_max_count,
    file_uploads_enabled,
    custom_domains_enabled,
    sso_enabled,
    api_access_enabled,
    advanced_analytics_enabled,
    enabled_models
)
SELECT 
    id,
    50000, -- Higher limits for the sandbox
    1500000,
    100,
    100,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    ARRAY['gpt-3.5-turbo', 'gpt-4', 'claude-3-opus', 'claude-3-sonnet']
FROM 
    public.applications 
WHERE 
    name = 'Platform Sandbox'
AND NOT EXISTS (
    SELECT 1 FROM public.application_settings 
    WHERE application_id = (SELECT id FROM public.applications WHERE name = 'Platform Sandbox')
);

-- Grant appropriate permissions
GRANT SELECT ON public.application_settings TO authenticated;
GRANT UPDATE ON public.application_settings TO authenticated; 