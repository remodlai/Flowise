-- Create or update the applications table with all required fields
DO $$
BEGIN
    -- Check if the applications table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
        -- Table exists, add any missing columns
        ALTER TABLE public.applications
        ADD COLUMN IF NOT EXISTS logo_url TEXT,
        ADD COLUMN IF NOT EXISTS url TEXT,
        ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0',
        ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard',
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    ELSE
        -- Create the applications table
        CREATE TABLE public.applications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            logo_url TEXT,
            url TEXT,
            version TEXT DEFAULT '1.0.0',
            type TEXT DEFAULT 'standard',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Create the updated_at trigger
        CREATE TRIGGER update_applications_updated_at
        BEFORE UPDATE ON public.applications
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create the default "Platform Sandbox" application if it doesn't exist
INSERT INTO public.applications (name, description, type, status)
SELECT 'Platform Sandbox', 'Default application for all platform resources', 'sandbox', 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM public.applications WHERE name = 'Platform Sandbox'
);

-- Grant appropriate permissions
GRANT SELECT ON public.applications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.applications TO authenticated; 