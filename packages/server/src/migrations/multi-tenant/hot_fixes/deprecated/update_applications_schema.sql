-- Update applications table with additional fields
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS version TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add application_id to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Create application_settings table
CREATE TABLE IF NOT EXISTS public.application_settings (
    application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
    resource_limits JSONB NOT NULL DEFAULT '{
        "api_calls": {
            "daily": 10000,
            "monthly": 300000
        },
        "storage": {
            "max_gb": 50
        },
        "users": {
            "max_count": 25
        }
    }',
    features JSONB NOT NULL DEFAULT '{
        "file_uploads": true,
        "custom_domains": false,
        "sso": false,
        "api_access": true,
        "advanced_analytics": false
    }',
    enabled_models JSONB NOT NULL DEFAULT '["gpt-3.5-turbo", "gpt-4"]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create application_stats table for tracking usage
CREATE TABLE IF NOT EXISTS public.application_stats (
    application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
    organization_count INTEGER DEFAULT 0,
    user_count INTEGER DEFAULT 0,
    flow_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for application_settings
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application_settings
CREATE POLICY "Allow authenticated users to read application_settings"
  ON public.application_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage application_settings
CREATE POLICY "Allow platform admins to manage application_settings"
  ON public.application_settings
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Add RLS policies for application_stats
ALTER TABLE public.application_stats ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application_stats
CREATE POLICY "Allow authenticated users to read application_stats"
  ON public.application_stats
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow platform admins to manage application_stats
CREATE POLICY "Allow platform admins to manage application_stats"
  ON public.application_stats
  USING (auth.jwt() ->> 'user_role' = 'platform_admin');

-- Create triggers to update the updated_at column for application_settings
CREATE TRIGGER update_application_settings_updated_at
BEFORE UPDATE ON public.application_settings
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Create function to update application stats
CREATE OR REPLACE FUNCTION update_application_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update organization count
    UPDATE public.application_stats
    SET organization_count = (
        SELECT COUNT(*) FROM public.organizations WHERE application_id = NEW.id
    ),
    last_updated = now()
    WHERE application_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update application stats when organizations change
CREATE TRIGGER update_application_stats_on_organization_change
AFTER INSERT OR UPDATE OR DELETE ON public.organizations
FOR EACH ROW
EXECUTE PROCEDURE update_application_stats();

-- Insert default settings for existing applications
INSERT INTO public.application_settings (application_id)
SELECT id FROM public.applications
ON CONFLICT (application_id) DO NOTHING;

-- Insert default stats for existing applications
INSERT INTO public.application_stats (application_id)
SELECT id FROM public.applications
ON CONFLICT (application_id) DO NOTHING;

-- Update sample data with additional fields
UPDATE public.applications
SET 
    type = 'standard',
    status = 'active',
    url = 'https://example.com/app/' || name,
    version = '1.0.0',
    logo_url = 'https://via.placeholder.com/150'
WHERE type IS NULL;

-- Assign organizations to applications if not already assigned
UPDATE public.organizations o
SET application_id = (
    SELECT id FROM public.applications 
    WHERE name = 'Default Application' 
    LIMIT 1
)
WHERE o.application_id IS NULL; 