-- Create application_stats table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'application_stats') THEN
        CREATE TABLE public.application_stats (
            application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
            organization_count INTEGER DEFAULT 0,
            user_count INTEGER DEFAULT 0,
            flow_count INTEGER DEFAULT 0,
            credential_count INTEGER DEFAULT 0,
            database_count INTEGER DEFAULT 0,
            image_count INTEGER DEFAULT 0,
            file_count INTEGER DEFAULT 0,
            api_calls_count INTEGER DEFAULT 0,
            storage_used_bytes BIGINT DEFAULT 0,
            growth_percentage DECIMAL DEFAULT 0,
            revenue_amount DECIMAL DEFAULT 0,
            run_count INTEGER DEFAULT 0,
            last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        -- Create the updated_at trigger
        CREATE TRIGGER update_application_stats_updated_at
        BEFORE UPDATE ON public.application_stats
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ELSE
        -- If table exists, add columns if they don't exist
        ALTER TABLE public.application_stats
        ADD COLUMN IF NOT EXISTS credential_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS database_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS growth_percentage DECIMAL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS revenue_amount DECIMAL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Create default stats for the Platform Sandbox application
INSERT INTO public.application_stats (application_id)
SELECT id FROM public.applications WHERE name = 'Platform Sandbox'
AND NOT EXISTS (
    SELECT 1 FROM public.application_stats 
    WHERE application_id = (SELECT id FROM public.applications WHERE name = 'Platform Sandbox')
);

-- Grant appropriate permissions
GRANT SELECT ON public.application_stats TO authenticated;