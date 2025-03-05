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